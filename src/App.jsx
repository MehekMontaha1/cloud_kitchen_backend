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
  const [realFoods, setRealFoods] = useState([]);
  const [activeAiFoodItem, setActiveAiFoodItem] = useState(null);
  const [customerLocation, setCustomerLocation] = useState({
    lat: 23.8103,
    lng: 90.4125,
    address: 'Dhaka, Bangladesh',
  });

  const loadCustomerData = async () => {
    try {
      // 1. Load Profile to set saved location
      const profileRes = await fetch('/api/users/profile');
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        if (profileData.success && profileData.data) {
          const p = profileData.data;
          if (p.latitude && p.longitude) {
            setCustomerLocation({
              lat: Number(p.latitude),
              lng: Number(p.longitude),
              address: p.location || 'Dhaka, Bangladesh',
            });
          }
        }
      }

      // 2. Load Foods from backend API
      const foodsRes = await fetch(`/api/customer/foods?lat=${customerLocation.lat}&lng=${customerLocation.lng}`);
      if (foodsRes.ok) {
        const foodsDataResult = await foodsRes.json();
        if (foodsDataResult.success) {
          setRealFoods(foodsDataResult.data || []);
        }
      }

      // 3. Load Flash Deals from backend API
      const dealsRes = await fetch('/api/customer/flash-deals');
      if (dealsRes.ok) {
        const dealsDataResult = await dealsRes.json();
        if (dealsDataResult.success) {
          setFlashDeals(dealsDataResult.data || []);
        }
      }

      // 4. Load Customer Messages from backend API
      const msgRes = await fetch('/api/customer/messages');
      if (msgRes.ok) {
        const msgDataResult = await msgRes.json();
        if (msgDataResult.success) {
          setChatMessages(msgDataResult.data || []);
        }
      }
    } catch (err) {
      console.error('Error loading customer backend data:', err);
    }
  };

  useEffect(() => {
    if (session?.role === 'customer') {
      loadCustomerData();
    }
  }, [session, customerLocation.lat, customerLocation.lng]);

  const visibleFoods = useMemo(() => {
    return realFoods;
  }, [realFoods]);



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

  const [activeTrackingOrderId, setActiveTrackingOrderId] = useState(null);

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    const firstItem = cartItems[0];
    const totalVal = cartItems.reduce((sum, item) => sum + item.price, 0) + 2.99;

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seller_id: firstItem.sellerId || session?.id,
          item_name: cartItems.map(i => i.name).join(', '),
          value: totalVal,
          delivery_address: customerLocation.address || 'Dhaka, Bangladesh',
          delivery_latitude: customerLocation.lat,
          delivery_longitude: customerLocation.lng,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const newOrderId = data.data?.id || 'ORD-' + Math.floor(1000 + Math.random() * 9000);
        setCartItems([]);
        setActiveTrackingOrderId(newOrderId);
      } else {
        // Fallback to tracking UI on demo
        const demoId = 'ORD-' + Math.floor(1000 + Math.random() * 9000);
        setCartItems([]);
        setActiveTrackingOrderId(demoId);
      }
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

      {/* Active Live Order Tracking Banner / Modal */}
      {activeTrackingOrderId && (
        <OrderTracking
          orderId={activeTrackingOrderId}
          onClose={() => setActiveTrackingOrderId(null)}
        />
      )}

      <NearbyFoods
        foods={visibleFoods}
        showNearbyOnly={showNearbyOnly}
        userLocation={customerLocation}
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

      <section className="grid gap-8 lg:grid-cols-2">
        <CustomOrders onSubmit={() => {}} />
        <ShoppingCart
          items={cartItems}
          onRemove={handleRemoveItem}
          onCheckout={handleCheckout}
        />
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
      return <ProfilePanel session={session} onUpdate={(updated) => setSession(prev => ({ ...prev, name: updated.full_name }))} />;
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
              <Button 
                variant="ghost" 
                size="sm" 
                className="rounded-lg" 
                onClick={() => setCurrentView(currentView === 'profile' ? 'dashboard' : 'profile')}
              >
                <UserIcon className="h-4 w-4" />
                {currentView === 'profile' ? 'Dashboard' : 'Profile'}
              </Button>
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
