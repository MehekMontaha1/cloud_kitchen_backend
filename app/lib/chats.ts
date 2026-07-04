import { supabaseAdmin } from './supabase';

export interface OrderContact {
  id: string; // Partner profile ID
  name: string; // Partner name or shop name
  role: 'seller' | 'delivery_partner' | 'customer' | string;
  orderId: string;
  itemName: string;
  orderStatus: string;
  updatedAt: string;
  unreadCount?: number;
}

export async function getUserOrderChatData(userId: string) {
  try {
    // 1. Query all orders where user is customer, seller, or delivery partner
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        seller:profiles!seller_id(id, full_name, shop_name, role),
        customer:profiles!customer_id(id, full_name, role),
        delivery_partner:profiles!delivery_partner_id(id, full_name, role)
      `)
      .or(`customer_id.eq.${userId},seller_id.eq.${userId},delivery_partner_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (ordersError) throw ordersError;

    const activeContactsMap = new Map<string, OrderContact>();
    const doneContactsMap = new Map<string, OrderContact>();

    (orders || []).forEach((order: any) => {
      const isDone = order.status === 'Delivered' || order.status === 'Cancelled';
      const contactsMap = isDone ? doneContactsMap : activeContactsMap;

      // Extract seller profile if current user is not seller
      if (order.seller && order.seller.id !== userId) {
        const contactKey = `${order.seller.id}_${order.id}`;
        if (!contactsMap.has(contactKey)) {
          contactsMap.set(contactKey, {
            id: order.seller.id,
            name: order.seller.shop_name || order.seller.full_name || 'Kitchen Seller',
            role: 'seller',
            orderId: order.id,
            itemName: order.item_name,
            orderStatus: order.status,
            updatedAt: order.updated_at || order.created_at,
          });
        }
      }

      // Extract delivery partner profile if present and current user is not rider
      if (order.delivery_partner && order.delivery_partner.id !== userId) {
        const contactKey = `${order.delivery_partner.id}_${order.id}`;
        if (!contactsMap.has(contactKey)) {
          contactsMap.set(contactKey, {
            id: order.delivery_partner.id,
            name: order.delivery_partner.full_name || 'Delivery Partner',
            role: 'delivery_partner',
            orderId: order.id,
            itemName: order.item_name,
            orderStatus: order.status,
            updatedAt: order.updated_at || order.created_at,
          });
        }
      }

      // Extract customer profile if current user is not customer
      if (order.customer && order.customer.id !== userId) {
        const contactKey = `${order.customer.id}_${order.id}`;
        if (!contactsMap.has(contactKey)) {
          contactsMap.set(contactKey, {
            id: order.customer.id,
            name: order.customer.full_name || 'Customer',
            role: 'customer',
            orderId: order.id,
            itemName: order.item_name,
            orderStatus: order.status,
            updatedAt: order.updated_at || order.created_at,
          });
        }
      }
    });

    const activeContacts = Array.from(activeContactsMap.values());
    const doneContacts = Array.from(doneContactsMap.values());

    // 2. Fetch all messages sent/received by this user
    const { data: messages, error: msgError } = await supabaseAdmin
      .from('messages')
      .select(`
        *,
        sender:profiles!sender_id(id, full_name, shop_name, role),
        receiver:profiles!receiver_id(id, full_name, shop_name, role)
      `)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: true });

    if (msgError) throw msgError;

    const mappedMessages = (messages || []).map((m: any) => ({
      id: m.id,
      senderId: m.sender_id,
      receiverId: m.receiver_id,
      senderName: m.sender_id === userId ? 'You' : (m.sender?.shop_name || m.sender?.full_name || 'User'),
      senderRole: m.sender?.role || 'user',
      receiverName: m.receiver_id === userId ? 'You' : (m.receiver?.shop_name || m.receiver?.full_name || 'User'),
      text: m.text,
      unread: m.unread,
      timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: m.created_at,
    }));

    return {
      activeContacts,
      doneContacts,
      messages: mappedMessages,
    };
  } catch (error) {
    console.error('[Chats Service] Error getting user order chat data:', error);
    throw error;
  }
}

export async function sendChatMessage(senderId: string, receiverId: string, text: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('messages')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        text,
        unread: true,
      })
      .select(`
        *,
        sender:profiles!sender_id(id, full_name, shop_name, role),
        receiver:profiles!receiver_id(id, full_name, shop_name, role)
      `)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[Chats Service] Error sending chat message:', error);
    throw error;
  }
}
