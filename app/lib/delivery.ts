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

// 1. Fetch available orders matching rider's location
export async function getAvailableOrdersForRider(riderId: string) {
  try {
    const rider = await getRiderProfile(riderId);
    if (!rider || !rider.location) {
      return []; // Rider must set their location/city first
    }

    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        seller:profiles!seller_id(full_name, email, location),
        customer:profiles!customer_id(full_name, email)
      `)
      .is('delivery_partner_id', null)
      .eq('status', 'Ready') // only orders marked as Ready by the seller are deliverable
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Filter orders where the seller's location matches the rider's location
    const matched = (orders || []).filter((o: any) => {
      const sellerLoc = o.seller?.location;
      return sellerLoc && sellerLoc.trim().toLowerCase() === rider.location.trim().toLowerCase();
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
        seller:profiles!seller_id(full_name, email, location),
        customer:profiles!customer_id(full_name, email)
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

// 3. Accept an available order (prevents double acceptance)
export async function acceptOrderForRider(riderId: string, orderId: string) {
  try {
    // Perform conditional update to avoid race conditions
    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({
        delivery_partner_id: riderId,
        status: 'Accepted',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .is('delivery_partner_id', null) // CRITICAL: only allow if not accepted yet
      .select()
      .maybeSingle();

    if (error) throw error;
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
    if (!statusFlow.includes(nextStatus)) {
      throw new Error('Invalid delivery status value.');
    }

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({
        status: nextStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .eq('delivery_partner_id', riderId) // CRITICAL: must be assigned to this rider
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[Delivery Service] Error updating delivery status:', error);
    throw error;
  }
}

const statusFlow = ['Accepted', 'Picked Up', 'Delivered'];

// 5. Fetch messages from sellers of accepted orders
export async function getRiderMessages(riderId: string) {
  try {
    // Get all accepted orders to extract seller IDs
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('seller_id')
      .eq('delivery_partner_id', riderId);

    if (ordersError) throw ordersError;
    if (!orders || orders.length === 0) return [];

    const sellerIds = Array.from(new Set(orders.map((o: any) => o.seller_id)));

    // Fetch messages between the rider and these sellers
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

    // Filter messages to only include those with the matched sellers
    const filtered = (messages || []).filter((m: any) => {
      const otherPartyId = m.sender_id === riderId ? m.receiver_id : m.sender_id;
      return sellerIds.includes(otherPartyId);
    });

    return filtered;
  } catch (error) {
    console.error('[Delivery Service] Error getting rider messages:', error);
    throw error;
  }
}
