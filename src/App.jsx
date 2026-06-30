import { useEffect, useMemo, useState } from 'react';
import { LogOut, ShoppingCart as CartIcon } from 'lucide-react';
import { Badge, Button } from './components/common';
import AuthPanel from './components/auth/AuthPanel';
import {
  SellerVerification,
  CustomerVerification,
  AnalyticsDashboard,
  SystemControls,
  MessageMonitoring,
} from './components/admin';
import {
  NearbyFoods,
  CustomOrders,
  ShoppingCart,
  GeolocationValidation,
  OffersFlashDeals,
  InboxMessaging,
  SupportChatbot,
} from './components/customer';
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
  const [sellers, setSellers] = useState(sellersData);
  const [customers, setCustomers] = useState(customersData);
  const [systemPaused, setSystemPaused] = useState(false);
  const [messages, setMessages] = useState(messagesData);
  const [showNearbyOnly, setShowNearbyOnly] = useState(true);
  const [cartItems, setCartItems] = useState([]);
  const [withinRadius, setWithinRadius] = useState(true);
  const [promoCode, setPromoCode] = useState('');
  const [chatMessages, setChatMessages] = useState(chatMessagesData);
  const [flashDeals, setFlashDeals] = useState(flashDealsData);

  const visibleFoods = useMemo(() => {
    if (!showNearbyOnly) return foodsData;
    return foodsData.filter((food) => food.eta <= 30);
  }, [showNearbyOnly]);

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
              docType: doc ? (doc.document_type === 'license' ? 'Business License' : doc.document_type) : 'Business License',
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
          const mappedCustomers = data.data
            .filter(u => u.role === 'customer')
            .map(user => ({
              id: user.id,
              name: user.full_name || 'No Name',
              email: user.email,
              city: 'Address: ' + (user.address || 'Unknown'),
              status: user.status,
              joinedAt: user.created_at ? new Date(user.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
            }));
          setCustomers(mappedCustomers);
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

  const handleCustomerStatus = async (id, status) => {
    try {
      const endpoint = status === 'approved'
        ? `/api/admin/users/${id}/approve`
        : `/api/admin/users/${id}/reject`;
      const res = await fetch(endpoint, { method: 'PUT' });
      if (res.ok) {
        setCustomers((prev) =>
          prev.map((customer) =>
            customer.id === id ? { ...customer, status } : customer
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

  const handleCheckout = () => {
    alert('Order placed successfully!');
    setCartItems([]);
  };

  const handleSendChat = (text) => {
    setChatMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        from: 'customer',
        sender: 'You',
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
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

      <NearbyFoods
        foods={visibleFoods}
        showNearbyOnly={showNearbyOnly}
        onToggle={() => setShowNearbyOnly((prev) => !prev)}
        onOrder={handleOrder}
      />

      <section className="grid gap-8 lg:grid-cols-2">
        <CustomOrders onSubmit={() => {}} />
        <ShoppingCart
          items={cartItems}
          onRemove={handleRemoveItem}
          onCheckout={handleCheckout}
        />
      </section>

      <GeolocationValidation withinRadius={withinRadius} onToggleRadius={() => setWithinRadius((prev) => !prev)} />

      <OffersFlashDeals
        deals={flashDeals}
        promoCode={promoCode}
        onPromoChange={setPromoCode}
      />

      <section className="grid gap-8 lg:grid-cols-2">
        <InboxMessaging messages={chatMessages} onSend={handleSendChat} />
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
            <p className="mt-1 text-slate-500">Seller verification, customer verification, analytics, platform controls, and message monitoring.</p>
          </div>
          <Badge variant={systemPaused ? 'danger' : 'success'} size="lg" dot>
            {systemPaused ? 'System Paused' : 'System Active'}
          </Badge>
        </div>
      </section>

      <AnalyticsDashboard />

      <section className="grid gap-8 lg:grid-cols-2">
        <SellerVerification sellers={sellers} onStatusChange={handleSellerStatus} />
        <CustomerVerification customers={customers} onAction={handleCustomerStatus} />
      </section>

      <SystemControls paused={systemPaused} onToggle={() => setSystemPaused((prev) => !prev)} />

      <MessageMonitoring
        messages={messages}
        onFlag={handleFlagMessage}
        onDelete={handleDeleteMessage}
      />
    </div>
  );

  const renderPanel = () => {
    if (session?.role === 'seller') return <SellerPanel />;
    if (session?.role === 'delivery') return <DeliveryPanel />;
    if (session?.role === 'admin') return renderAdminPanel();
    return renderCustomerPanel();
  };

  if (!session) {
    return <AuthPanel onEnter={handleLogin} />;
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
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-slate-900">{session.name || 'Demo User'}</p>
                <p className="text-xs text-slate-500">{session.email || roleLabels[session.role]}</p>
              </div>
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
