import { supabaseAdmin } from './supabase';

// Calculate straight-line distance in km (Haversine formula)
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in KM
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

// 1. Fetch menu items from sellers joined with seller profile location & coordinates
export async function getAreaFilteredFoods(customerLat: number, customerLng: number, maxRadiusKm = 99999) {
  try {
    const { data: menuItems, error } = await supabaseAdmin
      .from('menu_items')
      .select(`
        *,
        seller:profiles!seller_id(id, full_name, shop_name, location, latitude, longitude, avatar_url)
      `)
      .eq('status', 'live');

    if (error) throw error;
    if (!menuItems) return [];

    // Fetch reviews to calculate average ratings dynamically
    const { data: ratingStats } = await supabaseAdmin
      .from('reviews')
      .select('seller_id, rating');

    const sellerRatings: { [key: string]: { sum: number; count: number } } = {};
    if (ratingStats) {
      ratingStats.forEach((r: any) => {
        if (r.seller_id) {
          if (!sellerRatings[r.seller_id]) {
            sellerRatings[r.seller_id] = { sum: 0, count: 0 };
          }
          sellerRatings[r.seller_id].sum += Number(r.rating);
          sellerRatings[r.seller_id].count += 1;
        }
      });
    }

    const filtered = menuItems
      .map((item: any) => {
        const hasSellerCoords = item.seller?.latitude && item.seller?.longitude;
        const sellerLat = hasSellerCoords ? Number(item.seller.latitude) : null;
        const sellerLng = hasSellerCoords ? Number(item.seller.longitude) : null;

        let distance = 1.5; // Default close distance for items in same system
        if (sellerLat !== null && sellerLng !== null && customerLat && customerLng) {
          distance = calculateDistanceKm(customerLat, customerLng, sellerLat, sellerLng);
        } else if (item.seller?.location) {
          // If seller location text is provided, keep default low distance 1.5km
          distance = 1.5;
        }

        const eta = Math.max(12, Math.round(distance * 3 + 10));

        const ratingStatsForSeller = sellerRatings[item.seller_id];
        const rating = ratingStatsForSeller 
          ? parseFloat((ratingStatsForSeller.sum / ratingStatsForSeller.count).toFixed(1)) 
          : 0;

        return {
          id: item.id,
          name: item.name,
          description: item.description || (item.name + ' - Freshly prepared by ' + (item.seller?.shop_name || item.seller?.full_name || 'Cloud Kitchen')),
          price: Number(item.price),
          seller: item.seller?.shop_name || item.seller?.full_name || 'Cloud Kitchen',
          sellerId: item.seller_id,
          distance,
          eta,
          image: item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
          category: item.category || 'Food',
          rating,
          sellerLocation: item.seller?.location || 'Dhaka',
          sellerLat: sellerLat !== null ? sellerLat : customerLat,
          sellerLng: sellerLng !== null ? sellerLng : customerLng,
          stock: Number(item.stock || 0),
          sellerAvatar: item.seller?.avatar_url || null,
        };
      })
      .filter((item: any) => item.distance <= maxRadiusKm);

    return filtered;
  } catch (error) {
    console.error('[Orders Service] Error fetching area filtered foods:', error);
    throw error;
  }
}

// 2. Create new customer order
export async function createCustomerOrder(customerId: string, payload: {
  seller_id: string;
  item_name: string;
  value: number;
  delivery_address: string;
  delivery_latitude: number;
  delivery_longitude: number;
  type?: string;
  items?: any[];
}) {
  try {
    const requestDetails = Array.isArray(payload.items) && payload.items.length > 0 ? payload.items[0] : null;

    if (payload.type === 'Custom') {
      const { data, error } = await supabaseAdmin
        .from('custom_orders')
        .insert({
          customer_id: customerId,
          seller_id: payload.seller_id,
          item_name: payload.item_name,
          description: requestDetails?.description || payload.item_name,
          note: requestDetails?.note || null,
          cuisine: requestDetails?.cuisine || 'any',
          urgency: requestDetails?.urgency || 'standard',
          budget: payload.value,
          delivery_address: payload.delivery_address,
          delivery_latitude: payload.delivery_latitude,
          delivery_longitude: payload.delivery_longitude,
          status: 'Pending',
          details: requestDetails,
        })
        .select(`
          *,
          seller:profiles!seller_id(full_name, shop_name, location, latitude, longitude)
        `)
        .single();

      if (error) throw error;
      return data;
    }

    const { data, error } = await supabaseAdmin
      .from('orders')
      .insert({
        customer_id: customerId,
        seller_id: payload.seller_id,
        item_name: payload.item_name,
        value: payload.value,
        type: payload.type || 'Regular',
        status: 'Pending',
        eta: '25 min',
        delivery_address: payload.delivery_address,
        delivery_latitude: payload.delivery_latitude,
        delivery_longitude: payload.delivery_longitude,
        items: payload.items || null,
        payment_status: 'unpaid',
      })
      .select(`
        *,
        seller:profiles!seller_id(full_name, shop_name, location, latitude, longitude)
      `)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[Orders Service] Error creating customer order:', error);
    throw error;
  }
}

// 2.7 Confirm payment for an order
export async function confirmPayment(orderId: string, stripeSessionId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({
        payment_status: 'paid',
        stripe_session_id: stripeSessionId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[Orders Service] Error confirming payment:', error);
    throw error;
  }
}

// 3. Fetch orders for customer
export async function getCustomerOrders(customerId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        seller:profiles!seller_id(full_name, shop_name, location, latitude, longitude),
        delivery_partner:profiles!delivery_partner_id(full_name, phone)
      `)
      .eq('customer_id', customerId)
      .eq('payment_status', 'paid')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[Orders Service] Error fetching customer orders:', error);
    throw error;
  }
}

// 3b. Fetch custom order requests placed by a customer
export async function getCustomerCustomOrders(customerId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('custom_orders')
      .select(`
        *,
        seller:profiles!seller_id(full_name, shop_name, location, latitude, longitude)
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[Orders Service] Error fetching customer custom orders:', error);
    throw error;
  }
}

// 4. Get order tracking status & live coordinates
export async function getOrderTrackingDetails(orderId: string, customerId: string) {
  try {
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        seller:profiles!seller_id(full_name, shop_name, location, latitude, longitude, phone),
        delivery_partner:profiles!delivery_partner_id(full_name, phone, location, latitude, longitude)
      `)
      .eq('id', orderId)
      .eq('customer_id', customerId)
      .eq('payment_status', 'paid')
      .single();

    if (error || !order) throw new Error('Order not found for this customer');

    const customerLat = order.delivery_latitude || 23.8103;
    const customerLng = order.delivery_longitude || 90.4125;
    const sellerLat = order.seller?.latitude ? Number(order.seller.latitude) : customerLat + 0.015;
    const sellerLng = order.seller?.longitude ? Number(order.seller.longitude) : customerLng + 0.015;
    const riderLat = order.delivery_partner?.latitude ? Number(order.delivery_partner.latitude) : (sellerLat + customerLat) / 2;
    const riderLng = order.delivery_partner?.longitude ? Number(order.delivery_partner.longitude) : (sellerLng + customerLng) / 2;

    const distanceKm = calculateDistanceKm(customerLat, customerLng, sellerLat, sellerLng);

    return {
      orderId: order.id,
      status: order.status,
      itemName: order.item_name,
      value: Number(order.value),
      createdAt: order.created_at,
      etaMinutes: order.estimated_minutes || Math.max(10, Math.round(distanceKm * 3 + 8)),
      customer: {
        address: order.delivery_address || 'Customer Location',
        lat: customerLat,
        lng: customerLng,
      },
      kitchen: {
        name: order.seller?.shop_name || order.seller?.full_name || 'Cloud Kitchen',
        location: order.seller?.location || 'Dhaka',
        lat: sellerLat,
        lng: sellerLng,
        phone: order.seller?.phone || '+880 1700-000000',
      },
      rider: order.delivery_partner ? {
        name: order.delivery_partner.full_name || 'Delivery Partner',
        phone: order.delivery_partner.phone || '+880 1800-000000',
        lat: riderLat,
        lng: riderLng,
      } : null,
    };
  } catch (error) {
    console.error('[Orders Service] Error getting order tracking details:', error);
    throw error;
  }
}
