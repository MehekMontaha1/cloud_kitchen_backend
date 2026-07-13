import { useEffect, useMemo, useState } from 'react';
import { LogOut, ShoppingCart as CartIcon, User as UserIcon } from 'lucide-react';
import { Badge, Button } from './components/common';
import AuthPanel from './components/auth/AuthPanel';
import ProfilePanel from './components/profile/ProfilePanel';
import {
  SellerVerification,
  UserManagement,
  AnalyticsDashboard,
  ReportsSection,
} from './components/admin';
import {
  NearbyFoods,
  CustomOrders,
  ShoppingCart,
  GeolocationValidation,
  OffersFlashDeals,
  InboxMessaging,
  SupportChatbot,
  OrderTracking,
  NearbyKitchens,
} from './components/customer';
import GeminiFoodAssistant from './components/customer/GeminiFoodAssistant';
import LandingPage from './components/landing/LandingPage';

import SellerPanel from './components/seller/SellerPanel';
import DeliveryPanel from './components/delivery/DeliveryPanel';
import {
  sellersData,
  customersData,
  messagesData,
} from './data/adminData';
import {
  foodsData,
  flashDealsData,
  chatMessagesData,
} from './data/customerData';

const roleLabels = {
  customer: 'Customer Panel',
  seller: 'Seller Panel',
  delivery: 'Delivery Partner Panel',
  admin: 'Super Admin Panel',
};

const getTrackingStorageKey = (userId) => `activeTrackingOrderId:${userId}`;

const isValidCustomerLocation = (location) => {
  const lat = Number(location?.lat);
  const lng = Number(location?.lng);
  return Number.isFinite(lat) && Number.isFinite(lng);
};

function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  const [sellers, setSellers] = useState(sellersData);
  const [customers, setCustomers] = useState(customersData);
  const [messages, setMessages] = useState(messagesData);
  const [showNearbyOnly, setShowNearbyOnly] = useState(true);
  const [cartItems, setCartItems] = useState([]);
  const [withinRadius, setWithinRadius] = useState(true);
  const [promoCode, setPromoCode] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [flashDeals, setFlashDeals] = useState([]);
  const [claimedDeals, setClaimedDeals] = useState({});
  const [realFoods, setRealFoods] = useState([]);
  const [activeAiFoodItem, setActiveAiFoodItem] = useState(null);
  const [customerLocation, setCustomerLocation] = useState(null);
  const [paymentStatusMessage, setPaymentStatusMessage] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [customerOrdersLoaded, setCustomerOrdersLoaded] = useState(false);
  const [activeTrackingOrderId, setActiveTrackingOrderId] = useState(null);
  const hasSelectedCustomerLocation = isValidCustomerLocation(customerLocation);

  useEffect(() => {
    if (session?.role !== 'customer' || !session?.id) {
      setActiveTrackingOrderId(null);
      return;
    }

    try {
      if (typeof window !== 'undefined') {
        setActiveTrackingOrderId(localStorage.getItem(getTrackingStorageKey(session.id)) || null);
      }
    } catch (e) {
      console.warn('localStorage is not available:', e);
    }
  }, [session?.id, session?.role]);

  useEffect(() => {
    if (session?.role !== 'customer' || !session?.id) return;

    try {
      const storageKey = getTrackingStorageKey(session.id);
      if (activeTrackingOrderId) {
        localStorage.setItem(storageKey, activeTrackingOrderId);
      } else {
        localStorage.removeItem(storageKey);
      }
    } catch (e) {
      console.warn('localStorage write failed:', e);
    }
  }, [activeTrackingOrderId, session?.id, session?.role]);

  const loadCustomerData = async ({ syncProfileLocation = false } = {}) => {
    try {
      // 1. Load Profile to set saved location
      const profileRes = await fetch('/api/users/profile');
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        if (profileData.success && profileData.data) {
          const p = profileData.data;
          if (syncProfileLocation) {
            const savedLocation = p.latitude && p.longitude ? {
              lat: Number(p.latitude),
              lng: Number(p.longitude),
              address: p.location || 'Saved delivery location',
            } : null;

            setCustomerLocation(savedLocation);
          }
          // Sync avatar and name into session for header display
          if (p.avatar_url || p.full_name) {
            setSession(prev => prev ? {
              ...prev,
              avatar_url: p.avatar_url || prev.avatar_url,
              name: p.full_name || prev.name,
            } : prev);
          }
        }
      }

      // 2. Load Flash Deals from backend API
      const dealsRes = await fetch('/api/customer/flash-deals');
      if (dealsRes.ok) {
        const dealsDataResult = await dealsRes.json();
        if (dealsDataResult.success) {
          setFlashDeals(dealsDataResult.data || []);
        }
      }

      // 3. Load Customer Messages from backend API
      const msgRes = await fetch('/api/customer/messages');
      if (msgRes.ok) {
        const msgDataResult = await msgRes.json();
        if (msgDataResult.success) {
          setChatMessages(msgDataResult.data || []);
        }
      }

      // 4. Load Customer Orders from backend API
      setCustomerOrdersLoaded(false);
      const ordersRes = await fetch('/api/orders');
      if (ordersRes.ok) {
        const ordersDataResult = await ordersRes.json();
        if (ordersDataResult.success) {
          setCustomerOrders(ordersDataResult.data || []);
        }
      }
      setCustomerOrdersLoaded(true);
    } catch (err) {
      console.error('Error loading customer backend data:', err);
    }
  };

  const loadCustomerFoods = async () => {
    if (!hasSelectedCustomerLocation) {
      setRealFoods([]);
      return;
    }

    try {
      const foodsRes = await fetch(`/api/customer/foods?lat=${customerLocation.lat}&lng=${customerLocation.lng}`);
      if (foodsRes.ok) {
        const foodsDataResult = await foodsRes.json();
        if (foodsDataResult.success) {
          setRealFoods(foodsDataResult.data || []);
        }
      }
    } catch (err) {
      console.error('Error loading customer foods:', err);
    }
  };

  useEffect(() => {
    if (session?.role === 'customer') {
      loadCustomerData({ syncProfileLocation: true });
    } else {
      setCustomerLocation(null);
      setRealFoods([]);
      setCustomerOrders([]);
      setCustomerOrdersLoaded(false);
    }
  }, [session?.id, session?.role]);

  useEffect(() => {
    if (session?.role === 'customer') {
      loadCustomerFoods();
    }
  }, [session?.id, session?.role, customerLocation?.lat, customerLocation?.lng]);

  const visibleFoods = useMemo(() => {
    if (!hasSelectedCustomerLocation) return [];

    return realFoods.map(food => {
      const claim = claimedDeals[food.sellerId];
      if (claim) {
        const applies = !claim.itemIds || claim.itemIds.includes(food.id);
        if (applies) {
          const discountAmt = (food.price * claim.discount) / 100;
          return {
            ...food,
            originalPrice: food.price,
            price: Number((food.price - discountAmt).toFixed(2)),
            flashDiscount: claim.discount
          };
        }
      }
      return food;
    });
  }, [realFoods, claimedDeals, hasSelectedCustomerLocation]);

  const trackingOrders = useMemo(() => {
    return customerOrders.filter((order) => {
      const createdTime = new Date(order.created_at);
      const ageMins = (Date.now() - createdTime.getTime()) / 60000;

      const isCompleted = order.status === 'Delivered' || order.status === 'Cancelled';
      if (isCompleted) {
        // Only show completed orders for up to 60 minutes (1 hour)
        return ageMins <= 60;
      }

      // Always show active (uncompleted) orders
      return true;
    });
  }, [customerOrders]);

  useEffect(() => {
    if (!customerOrdersLoaded || !activeTrackingOrderId) return;

    const belongsToCurrentCustomer = customerOrders.some((order) => order.id === activeTrackingOrderId);
    if (!belongsToCurrentCustomer) {
      setActiveTrackingOrderId(null);
    }
  }, [customerOrdersLoaded, customerOrders, activeTrackingOrderId]);

  useEffect(() => {
    const interval = setInterval(() => {
      setFlashDeals((prev) =>
        prev.map((deal) => ({
          ...deal,
          timeLeft: Math.max(deal.timeLeft - 1, 0),
        }))
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const mapDbRoleToFrontend = (dbRole) => {
    if (dbRole === 'delivery_partner') return 'delivery';
    if (dbRole === 'super_admin') return 'admin';
    return dbRole;
  };

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const data = await res.json();
          if (data && data.success && data.profile) {
            setSession({
              id: data.profile.id,
              role: mapDbRoleToFrontend(data.profile.role),
              name: data.profile.full_name || 'User',
              email: data.user.email,
            });
          }
        }
      } catch (err) {
        console.error('Error fetching session:', err);
      } finally {
        setAuthLoading(false);
      }
    }
    checkSession();
  }, []);

  const loadAdminData = async () => {
    try {
      const resApprovals = await fetch('/api/admin/pending-approvals');
      if (resApprovals.ok) {
        const data = await resApprovals.json();
        if (data && data.success) {
          const mappedSellers = data.data.map(user => {
            const doc = user.documents && user.documents.length > 0 ? user.documents[0] : null;
            return {
              id: user.id,
              name: user.full_name || 'No Name',
              email: user.email,
              doc: doc ? doc.document_url.substring(doc.document_url.lastIndexOf('/') + 1) : 'No Document',
              docUrl: doc ? doc.document_url : null,
              docType: doc ? (doc.document_type === 'license' ? 'Business License' : doc.document_type) : (user.role === 'delivery_partner' ? 'Delivery License' : 'Business License'),
              status: user.status,
              submittedAt: user.created_at ? new Date(user.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
            };
          });
          setSellers(mappedSellers);
        }
      }

      const resUsers = await fetch('/api/admin/users');
      if (resUsers.ok) {
        const data = await resUsers.json();
        if (data && data.success) {
          const mappedUsers = data.data.map(user => ({
            id: user.id,
            name: user.full_name || 'No Name',
            email: user.email,
            role: user.role,
            status: user.status || 'approved',
            joinedAt: user.created_at ? new Date(user.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
          }));
          setCustomers(mappedUsers);
        }
      }
    } catch (err) {
      console.error('Error loading admin data:', err);
    }
  };

  useEffect(() => {
    if (session?.role === 'admin') {
      loadAdminData();
    }
  }, [session]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    const sessionId = params.get('session_id');
    const orderId = params.get('order_id');

    if (payment === 'success' && sessionId && orderId) {
      setPaymentStatusMessage({ status: 'confirming', message: 'Verifying payment with Stripe...' });

      fetch('/api/payment/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, order_id: orderId }),
      })
        .then(async (res) => {
          if (res.ok) {
            setPaymentStatusMessage({ status: 'success', message: 'Payment Successful! Your order has been placed.' });
            const firstOrderId = orderId.split(',')[0];
            setCustomerOrdersLoaded(false);
            setActiveTrackingOrderId(firstOrderId);
            setCartItems([]);
            // Clear URL params
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Reload customer dashboard data to show the new paid order
            if (session?.role === 'customer') {
              loadCustomerData();
            }
          } else {
            const data = await res.json().catch(() => ({}));
            setPaymentStatusMessage({ status: 'error', message: data.error || 'Failed to verify payment. Please contact support.' });
          }
        })
        .catch(() => {
          setPaymentStatusMessage({ status: 'error', message: 'Error verifying payment.' });
        });
    } else if (payment === 'cancel') {
      setPaymentStatusMessage({ status: 'cancel', message: 'Payment cancelled. Your order was not placed.' });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [session]);

  const goTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  const handleLogin = (profile) => {
    setSession(profile);
    goTop();
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    }
    setSession(null);
    setCartItems([]);
    setCustomerLocation(null);
    setRealFoods([]);
    setCustomerOrders([]);
    setCustomerOrdersLoaded(false);
    setActiveTrackingOrderId(null);
    goTop();
  };

  const handleSellerStatus = async (id, status) => {
    try {
      const endpoint = status === 'approved'
        ? `/api/admin/users/${id}/approve`
        : `/api/admin/users/${id}/reject`;
      const res = await fetch(endpoint, { method: 'PUT' });
      if (res.ok) {
        setSellers((prev) =>
          prev.map((seller) =>
            seller.id === id ? { ...seller, status } : seller
          )
        );
      } else {
        const data = await res.json();
        alert('Action failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCustomers((prev) => prev.filter((user) => user.id !== id));
        setSellers((prev) => prev.filter((seller) => seller.id !== id));
      } else {
        const data = await res.json();
        alert('Delete failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Error deleting user: ' + err.message);
    }
  };

  const handleOrder = (item) => {
    const existingCount = cartItems.filter(i => i.id === item.id).length;
    if (existingCount >= item.stock) {
      alert(`Cannot add more! Only ${item.stock} unit(s) of "${item.name}" available in stock.`);
      return;
    }
    setCartItems((prev) => [...prev, item]);
  };

  const handleRemoveItem = (id) => {
    if (id === null) {
      setCartItems([]);
    } else {
      setCartItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const handleFlagMessage = (id) => {
    setMessages((prev) =>
      prev.map((message) =>
        message.id === id ? { ...message, flagged: !message.flagged } : message
      )
    );
  };

  const handleDeleteMessage = (id) => {
    setMessages((prev) => prev.filter((message) => message.id !== id));
  };


  const handleClaimDeal = (deal) => {
    setClaimedDeals((prev) => ({
      ...prev,
      [deal.sellerId]: {
        discount: deal.discount,
        itemIds: deal.itemIds || null,
      }
    }));
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    if (!hasSelectedCustomerLocation) {
      alert('Please select your delivery location on the map before placing an order.');
      return;
    }

    const totalVal = cartItems.reduce((sum, item) => sum + item.price, 0) + 2.99;

    try {
      // 1. Group items by sellerId
      const groups = {};
      cartItems.forEach((item) => {
        const sId = item.sellerId || session?.id || 'default';
        if (!groups[sId]) groups[sId] = [];
        groups[sId].push(item);
      });

      const sellerIds = Object.keys(groups);

      // 2. Create an order for each seller group
      const orderPromises = sellerIds.map(async (sId, index) => {
        const items = groups[sId];
        const itemsPrice = items.reduce((sum, item) => sum + item.price, 0);
        // Distribute the 2.99 delivery fee to the first order only to keep the overall sum exact
        const shareOfDelivery = index === 0 ? 2.99 : 0;
        const orderValue = itemsPrice + shareOfDelivery;

        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            seller_id: sId === 'default' ? session?.id : sId,
            item_name: items.map(i => i.name).join(', '),
            value: orderValue,
            delivery_address: customerLocation.address || 'Selected delivery location',
            delivery_latitude: customerLocation.lat,
            delivery_longitude: customerLocation.lng,
            items: items.map(i => ({ id: i.id, name: i.name })),
          }),
        });

        if (res.ok) {
          const orderData = await res.json();
          return orderData.data?.id;
        }
        throw new Error('Failed to create sub-order');
      });

      const createdOrderIds = (await Promise.all(orderPromises)).filter(Boolean);
      const orderIdsStr = createdOrderIds.join(',');

      if (createdOrderIds.length > 0) {
        // 3. Initialize Stripe checkout session for all orders combined
        const sessionRes = await fetch('/api/payment/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: orderIdsStr,
            value: totalVal,
            item_name: cartItems.map(i => i.name).join(', '),
            origin: window.location.origin,
          }),
        });

        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          if (sessionData.url) {
            // Redirect customer to Stripe payment page
            window.location.href = sessionData.url;
            return;
          }
        }
      }

      // Fallback if Stripe creation fails
      const fallbackId = createdOrderIds[0] || 'ORD-' + Math.floor(1000 + Math.random() * 9000);
      setCartItems([]);
      setActiveTrackingOrderId(fallbackId);
    } catch (err) {
      console.error('Error placing order:', err);
      const demoId = 'ORD-' + Math.floor(1000 + Math.random() * 9000);
      setCartItems([]);
      setActiveTrackingOrderId(demoId);
    }
  };


  const handleSendChat = async (text) => {
    try {
      const res = await fetch('/api/customer/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (res.ok) {
        const data = await res.json();
        setChatMessages((prev) => [
          ...prev,
          {
            id: data.data?.id || Date.now(),
            from: 'customer',
            sender: 'You',
            text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };


  const renderCustomerPanel = () => (
    <div className="space-y-8">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Customer Panel</h2>
          <p className="mt-1 text-slate-500">Nearby foods, custom distant orders, cart checkout, flash deals, inbox, and support.</p>
        </div>
        <Badge variant={withinRadius ? 'success' : 'warning'} size="lg" dot>
          {withinRadius ? 'Inside 30-min radius' : 'Outside nearby radius'}
        </Badge>
      </section>

      {paymentStatusMessage && (
        <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs sm:text-sm font-medium shadow-xs transition-all ${
          paymentStatusMessage.status === 'confirming'
            ? 'bg-blue-50 border-blue-200 text-blue-800'
            : paymentStatusMessage.status === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 animate-pulse'
            : paymentStatusMessage.status === 'cancel'
            ? 'bg-amber-50 border-amber-200 text-amber-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className="flex items-center gap-2">
            {paymentStatusMessage.status === 'confirming' && (
              <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {paymentStatusMessage.status === 'success' && (
              <span className="text-emerald-600 text-base">✅</span>
            )}
            {paymentStatusMessage.status === 'cancel' && (
              <span className="text-amber-600 text-base">⚠️</span>
            )}
            {paymentStatusMessage.status === 'error' && (
              <span className="text-rose-600 text-base">❌</span>
            )}
            <span>{paymentStatusMessage.message}</span>
          </div>
          <button 
            onClick={() => setPaymentStatusMessage(null)}
            className="text-slate-400 hover:text-slate-600 font-bold px-2 py-1 rounded hover:bg-slate-100/50"
          >
            ✕
          </button>
        </div>
      )}

      {/* Active Live Order Tracking Banner / Modal */}
      {activeTrackingOrderId && (
        <OrderTracking
          orderId={activeTrackingOrderId}
          onClose={() => setActiveTrackingOrderId(null)}
        />
      )}

      {/* Track Your Orders Section */}
      {trackingOrders.length > 0 && (
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-orange-500 text-lg">📦</span>
            <h3 className="text-base font-bold text-slate-900">Track Your Orders</h3>
            <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full font-bold">
              {trackingOrders.length}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trackingOrders.map((order) => {
              const createdTime = new Date(order.created_at);
              const ageMins = isNaN(createdTime.getTime()) 
                ? 0 
                : Math.round((Date.now() - createdTime.getTime()) / 60000);
              const isCompleted = order.status === 'Delivered' || order.status === 'Cancelled';
              const isDelayed = !isCompleted && ageMins > 45;
              const isValidDate = !isNaN(createdTime.getTime());
              const timeString = isValidDate 
                ? createdTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'Unknown time';

              return (
                <div
                  key={order.id}
                  className={`border rounded-xl p-4 flex flex-col justify-between transition-all hover:shadow-xs bg-slate-50/50 ${
                    isDelayed ? 'border-amber-300 bg-amber-50/10' : 'border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Order status
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.status === 'Ready' || order.status === 'Picked Up'
                          ? 'bg-blue-100 text-blue-800 animate-pulse'
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-800 text-sm truncate">{order.item_name}</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Kitchen: <strong>{order.seller?.shop_name || 'Cloud Kitchen'}</strong>
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Placed: {timeString} ({ageMins} mins ago)
                    </p>

                    {/* Delayed Warning */}
                    {isDelayed && (
                      <p className="text-[11px] text-amber-700 bg-amber-100/50 rounded-lg p-2 mt-2 font-medium flex items-center gap-1">
                        ⚠️ Order is not complete (Delayed)
                      </p>
                    )}
                  </div>

                  <div className="border-t border-slate-100 mt-3 pt-3 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">৳{order.value}</span>
                    <button
                      onClick={() => setActiveTrackingOrderId(order.id)}
                      className="text-xs font-bold text-orange-600 hover:text-orange-800 bg-orange-50 hover:bg-orange-100/80 px-3.5 py-1.5 rounded-lg transition-all"
                    >
                      Track Live 🗺️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <NearbyKitchens
        foods={visibleFoods}
        hasLocation={hasSelectedCustomerLocation}
        onOrder={handleOrder}
        onAskAI={(item) => {
          setActiveAiFoodItem(item);
          const el = document.getElementById('gemini-food-assistant-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      <NearbyFoods
        foods={visibleFoods}
        showNearbyOnly={showNearbyOnly}
        userLocation={customerLocation}
        hasLocation={hasSelectedCustomerLocation}
        onToggle={() => setShowNearbyOnly((prev) => !prev)}
        onOrder={handleOrder}
        onAskAI={(item) => {
          setActiveAiFoodItem(item);
          const el = document.getElementById('gemini-food-assistant-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Gemini AI Food & Health Assistant Section */}
      <div id="gemini-food-assistant-section">
        <GeminiFoodAssistant
          activeFoodItem={activeAiFoodItem}
          onClearActiveFood={() => setActiveAiFoodItem(null)}
        />
      </div>

      {/* ── Custom Orders Special Section ── */}
      <section className="rounded-2xl border-2 border-dashed border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-1.5 shadow-sm">
        <div className="mb-3 px-4 pt-4 flex items-center gap-2">
          <span className="text-xl">✨</span>
          <div>
            <h3 className="font-bold text-indigo-800 text-base">Can't find what you're craving?</h3>
            <p className="text-xs text-indigo-500">Send a custom food request directly to a kitchen — they'll cook it just for you!</p>
          </div>
        </div>
        <section className="grid gap-8 lg:grid-cols-2 p-2">
          <CustomOrders
            foods={visibleFoods}
            customerLocation={customerLocation}
            onSubmit={async () => {
              await loadCustomerData();
            }}
          />
          <ShoppingCart
            items={cartItems}
            onRemove={handleRemoveItem}
            onCheckout={handleCheckout}
          />
        </section>
      </section>

      <GeolocationValidation
        withinRadius={withinRadius}
        onToggleRadius={() => setWithinRadius((prev) => !prev)}
        onLocationChange={setCustomerLocation}
        customerLocation={customerLocation}
      />

      <OffersFlashDeals
        deals={flashDeals}
        promoCode={promoCode}
        onPromoChange={setPromoCode}
        onClaimDeal={handleClaimDeal}
      />

      <section className="grid gap-8 lg:grid-cols-2">
        <InboxMessaging userRole="customer" />
        <SupportChatbot />
      </section>
    </div>
  );

  const renderAdminPanel = () => (
    <div className="space-y-8">
      <section>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Super Admin Dashboard</h2>
            <p className="mt-1 text-slate-500">Partner verification, user management, analytics, and user reports.</p>
          </div>
        </div>
      </section>

      <AnalyticsDashboard />

      <section className="grid gap-8 lg:grid-cols-2">
        <SellerVerification sellers={sellers} onStatusChange={handleSellerStatus} />
        <UserManagement users={customers} onDelete={handleDeleteUser} />
      </section>

      <ReportsSection />
    </div>
  );

  const renderPanel = () => {
    if (currentView === 'profile') {
      return <ProfilePanel session={session} onUpdate={(updated) => setSession(prev => ({ ...prev, name: updated.full_name, avatar_url: updated.avatar_url ?? prev.avatar_url }))} />;
    }
    if (session?.role === 'seller') return <SellerPanel />;
    if (session?.role === 'delivery') return <DeliveryPanel />;
    if (session?.role === 'admin') return renderAdminPanel();
    return renderCustomerPanel();
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!session) {
    return <LandingPage onEnterSession={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-16 flex-wrap items-center justify-between gap-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500 text-white">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">CloudKitchen</h1>
                <p className="text-xs text-slate-500">{roleLabels[session.role]}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {session.role === 'customer' && (
                <Button variant="secondary" size="sm" className="rounded-lg">
                  <CartIcon className="h-4 w-4" />
                  Cart
                  {cartItems.length > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-xs font-medium text-white">
                      {cartItems.length}
                    </span>
                  )}
                </Button>
              )}
              <div 
                className="hidden text-right sm:block cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setCurrentView(currentView === 'profile' ? 'dashboard' : 'profile')}
              >
                <p className="text-sm font-semibold text-slate-900">{session.name || 'Demo User'}</p>
                <p className="text-xs text-slate-500">{session.email || roleLabels[session.role]}</p>
              </div>
              <button
                title={currentView === 'profile' ? 'Back to Dashboard' : 'My Profile'}
                onClick={() => setCurrentView(currentView === 'profile' ? 'dashboard' : 'profile')}
                className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-orange-300 shadow-sm hover:border-orange-500 transition-all"
              >
                {session.avatar_url ? (
                  <img
                    src={session.avatar_url}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-orange-100 text-xs font-bold text-orange-700 select-none">
                    {(session.name || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </button>
              <Button variant="ghost" size="sm" className="rounded-lg" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {renderPanel()}
      </main>
    </div>
  );
}

export default App;
