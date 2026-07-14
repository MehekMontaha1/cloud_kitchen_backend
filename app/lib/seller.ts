import { supabaseAdmin } from './supabase';

// 1. Fetch menu items for a seller
export async function getSellerMenu(sellerId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('menu_items')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[Seller Service] Error getting menu:', error);
    throw error;
  }
}

// 2. Add a new menu item
export async function addMenuItem(sellerId: string, payload: { name: string; category?: string; price: number; stock: number; image_url?: string; description?: string }) {
  try {
    const { data, error } = await supabaseAdmin
      .from('menu_items')
      .insert({
        seller_id: sellerId,
        name: payload.name,
        category: payload.category || 'Food',
        price: payload.price,
        stock: payload.stock,
        status: 'live',
        image_url: payload.image_url,
        description: payload.description,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[Seller Service] Error adding menu item:', error);
    throw error;
  }
}

// 2.5 Update an existing menu item
export async function updateMenuItem(
  sellerId: string,
  itemId: string,
  payload: {
    name?: string;
    category?: string;
    price?: number;
    stock?: number;
    image_url?: string;
    description?: string;
    status?: string;
  }
) {
  try {
    const { data, error } = await supabaseAdmin
      .from('menu_items')
      .update({
        ...payload,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)
      .eq('seller_id', sellerId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[Seller Service] Error updating menu item:', error);
    throw error;
  }
}

// 3. Toggle menu item status (live <-> paused)
export async function toggleMenuItemStatus(sellerId: string, itemId: string) {
  try {
    // Fetch current status
    const { data: item, error: getError } = await supabaseAdmin
      .from('menu_items')
      .select('*')
      .eq('id', itemId)
      .eq('seller_id', sellerId)
      .single();

    if (getError || !item) throw new Error('Menu item not found or unauthorized');

    const nextStatus = item.status === 'live' ? 'paused' : 'live';

    const { data, error } = await supabaseAdmin
      .from('menu_items')
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq('id', itemId)
      .eq('seller_id', sellerId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[Seller Service] Error toggling status:', error);
    throw error;
  }
}

// 4. Fetch orders for a seller
export async function getSellerOrders(sellerId: string) {
  try {
    // Fetch orders and select profiles (customers) joined on customer_id
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        customer:profiles!customer_id(full_name, email)
      `)
      .eq('seller_id', sellerId)
      .eq('payment_status', 'paid')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[Seller Service] Error getting seller orders:', error);
    throw error;
  }
}

// 4b. Fetch custom order requests for a seller
export async function getSellerCustomOrders(sellerId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('custom_orders')
      .select(`
        *,
        customer:profiles!customer_id(full_name, email)
      `)
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[Seller Service] Error getting custom orders:', error);
    throw error;
  }
}

// 5. Publish flash offer
export async function publishFlashOffer(sellerId: string, payload: { title: string; discount: number; duration: number; item_ids?: string[] }) {
  try {
    const { data, error } = await supabaseAdmin
      .from('flash_offers')
      .insert({
        seller_id: sellerId,
        title: payload.title,
        discount: payload.discount,
        duration_minutes: payload.duration,
        item_ids: payload.item_ids || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[Seller Service] Error publishing flash offer:', error);
    throw error;
  }
}

// 6. Fetch messages for a seller
export async function getSellerMessages(sellerId: string) {
  try {
    // Fetch messages where this seller is sender or receiver
    const { data, error } = await supabaseAdmin
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(full_name, email),
        receiver:profiles!messages_receiver_id_fkey(full_name, email)
      `)
      .or(`sender_id.eq.${sellerId},receiver_id.eq.${sellerId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[Seller Service] Error getting messages:', error);
    throw error;
  }
}

// 7. Get seller earnings metrics
export async function getSellerEarnings(sellerId: string) {
  try {
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('seller_id', sellerId);

    const { data: customOrders, error: customOrdersError } = await supabaseAdmin
      .from('custom_orders')
      .select('budget, status')
      .eq('seller_id', sellerId);

    if (error) throw error;
    if (customOrdersError) throw customOrdersError;

    const todayStr = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let todayTotal = 0;
    let weekTotal = 0;
    let customTotal = 0;
    let totalSales = 0;

    if (orders && orders.length > 0) {
      orders.forEach((o: any) => {
        const orderDate = new Date(o.created_at);
        const orderDateStr = o.created_at.split('T')[0];
        const val = Number(o.value || 0);

        if (o.status !== 'Cancelled') {
          totalSales += val;

          // Today
          if (orderDateStr === todayStr) {
            todayTotal += val;
          }

          // This Week
          if (orderDate >= sevenDaysAgo) {
            weekTotal += val;
          }

          // Custom Orders
          if (o.type === 'Custom') {
            customTotal += val;
          }
        }
      });
    }

    if (customOrders && customOrders.length > 0) {
      customOrders.forEach((o: any) => {
        const val = Number(o.budget || 0);

        if (o.status !== 'Cancelled') {
          customTotal += val;
          totalSales += val;
        }
      });
    }

    return [
      { label: 'Today', value: `৳${todayTotal.toFixed(2)}`, delta: '+14%' },
      { label: 'This Week', value: `৳${weekTotal.toFixed(2)}`, delta: '+8%' },
      { label: 'Custom Orders', value: `৳${customTotal.toFixed(2)}`, delta: '+21%' },
      { label: 'Total Sales', value: `৳${totalSales.toFixed(2)}`, delta: '+18%' },
    ];
  } catch (error) {
    console.error('[Seller Service] Error getting earnings:', error);
    throw error;
  }
}

// 8. Delete a menu item
export async function deleteMenuItem(sellerId: string, itemId: string) {
  try {
    const { error } = await supabaseAdmin
      .from('menu_items')
      .delete()
      .eq('id', itemId)
      .eq('seller_id', sellerId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('[Seller Service] Error deleting menu item:', error);
    throw error;
  }
}

// 9. Update order status by seller (Pending -> Preparing, Preparing -> Ready, Cancelled)
export async function updateSellerOrderStatus(sellerId: string, orderId: string, status: string) {
  try {
    const allowedStatuses = ['Pending', 'Preparing', 'Ready', 'Cancelled'];
    if (!allowedStatuses.includes(status)) {
      throw new Error(`Invalid status transition to '${status}' by seller.`);
    }

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .eq('seller_id', sellerId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[Seller Service] Error updating order status:', error);
    throw error;
  }
}

// 9b. Update a custom order request status by seller
export async function updateSellerCustomOrderStatus(sellerId: string, orderId: string, status: string) {
  try {
    const allowedStatuses = ['Pending', 'Preparing', 'Ready', 'Cancelled'];
    if (!allowedStatuses.includes(status)) {
      throw new Error(`Invalid status transition to '${status}' by seller.`);
    }

    const { data, error } = await supabaseAdmin
      .from('custom_orders')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .eq('seller_id', sellerId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[Seller Service] Error updating custom order status:', error);
    throw error;
  }
}

// 10. Send seller message
export async function sendSellerMessage(sellerId: string, receiverId: string, text: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('messages')
      .insert({
        sender_id: sellerId,
        receiver_id: receiverId,
        text,
        unread: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[Seller Service] Error sending message:', error);
    throw error;
  }
}

