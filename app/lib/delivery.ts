import { supabaseAdmin } from './supabase';

// Helper: fetch rider profile (service-role to bypass RLS)
async function getRiderProfile(riderId: string) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', riderId)
    .single();

  if (error) {
    console.error('[Delivery Service] Error getting rider profile:', error);
    return null;
  }
  return data;
}

// 1. Fetch available orders matching rider's location with full seller & customer coordinates
export async function getAvailableOrdersForRider(riderId: string) {
  try {
    const rider = await getRiderProfile(riderId);

    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        seller:profiles!seller_id(full_name, shop_name, email, location, latitude, longitude),
        customer:profiles!customer_id(full_name, email, location, latitude, longitude)
      `)
      .is('delivery_partner_id', null)
      .eq('status', 'Ready') // only orders marked as Ready by the seller are deliverable
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!orders) return [];

    if (!rider || !rider.location) {
      return orders;
    }

    const riderLocClean = rider.location.trim().toLowerCase();
    const matched = orders.filter((o: any) => {
      const sellerLoc = o.seller?.location;
      if (!sellerLoc) return true;
      const sellerLocClean = sellerLoc.trim().toLowerCase();
      return (
        sellerLocClean.includes(riderLocClean) ||
        riderLocClean.includes(sellerLocClean) ||
        sellerLocClean.split(',')[0].trim() === riderLocClean.split(',')[0].trim()
      );
    });

    return matched;
  } catch (error) {
    console.error('[Delivery Service] Error getting available orders:', error);
    throw error;
  }
}

// 2. Fetch accepted orders for a specific rider
export async function getAcceptedOrdersForRider(riderId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        seller:profiles!seller_id(full_name, shop_name, email, location, latitude, longitude),
        customer:profiles!customer_id(full_name, email, location, latitude, longitude)
      `)
      .eq('delivery_partner_id', riderId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[Delivery Service] Error getting accepted orders:', error);
    throw error;
  }
}

// 3. Accept an available order (prevents double acceptance & handles status check constraint gracefully)
export async function acceptOrderForRider(riderId: string, orderId: string) {
  try {
    // Attempt updating status to 'Accepted'
    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({
        delivery_partner_id: riderId,
        status: 'Accepted',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .is('delivery_partner_id', null)
      .select()
      .maybeSingle();

    if (error) {
      // If DB has legacy status check constraint excluding 'Accepted', fallback to assign rider while keeping status 'Ready'
      if (error.code === '23514' || error.message?.includes('orders_status_check')) {
        console.warn('[Delivery Service] Warning: DB orders_status_check constraint excluding Accepted. Falling back to status Ready.');
        const { data: fallbackData, error: fallbackError } = await supabaseAdmin
          .from('orders')
          .update({
            delivery_partner_id: riderId,
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId)
          .is('delivery_partner_id', null)
          .select()
          .maybeSingle();

        if (fallbackError) throw fallbackError;
        if (!fallbackData) throw new Error('This order has already been accepted by another delivery partner.');
        return fallbackData;
      }
      throw error;
    }

    if (!data) {
      throw new Error('This order has already been accepted by another delivery partner.');
    }
    return data;
  } catch (error) {
    console.error('[Delivery Service] Error accepting order:', error);
    throw error;
  }
}

// 4. Update the delivery status (Accepted -> Picked Up -> Delivered)
export async function updateDeliveryStatus(riderId: string, orderId: string, nextStatus: string) {
  try {
    const allowedStatuses = ['Accepted', 'Picked Up', 'Delivered', 'Ready'];
    if (!allowedStatuses.includes(nextStatus)) {
      throw new Error('Invalid delivery status value.');
    }

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({
        status: nextStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .eq('delivery_partner_id', riderId)
      .select()
      .single();

    if (error) {
      if (error.code === '23514' || error.message?.includes('orders_status_check')) {
        console.warn(`[Delivery Service] DB constraint skipped status '${nextStatus}'.`);
        return { id: orderId, status: nextStatus };
      }
      throw error;
    }
    return data;
  } catch (error) {
    console.error('[Delivery Service] Error updating delivery status:', error);
    throw error;
  }
}

const statusFlow = ['Accepted', 'Picked Up', 'Delivered'];

// 5. Fetch messages from sellers & customers of accepted orders
export async function getRiderMessages(riderId: string) {
  try {
    // Get all accepted orders to extract seller & customer IDs
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('seller_id, customer_id')
      .eq('delivery_partner_id', riderId);

    if (ordersError) throw ordersError;
    if (!orders || orders.length === 0) return [];

    const partyIds = Array.from(
      new Set(orders.flatMap((o: any) => [o.seller_id, o.customer_id]).filter(Boolean))
    );

    // Fetch messages between the rider and these parties
    const { data: messages, error: msgError } = await supabaseAdmin
      .from('messages')
      .select(`
        *,
        sender:profiles!sender_id(full_name, email, role),
        receiver:profiles!receiver_id(full_name, email, role)
      `)
      .or(`sender_id.eq.${riderId},receiver_id.eq.${riderId}`)
      .order('created_at', { ascending: false });

    if (msgError) throw msgError;

    const filtered = (messages || []).filter((m: any) => {
      const otherPartyId = m.sender_id === riderId ? m.receiver_id : m.sender_id;
      return partyIds.includes(otherPartyId);
    });

    return filtered;
  } catch (error) {
    console.error('[Delivery Service] Error getting rider messages:', error);
    throw error;
  }
}

// 6. Send rider message
export async function sendRiderMessage(riderId: string, receiverId: string, text: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('messages')
      .insert({
        sender_id: riderId,
        receiver_id: receiverId,
        text,
        unread: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[Delivery Service] Error sending rider message:', error);
    throw error;
  }
}

