import { useEffect, useState } from 'react';
import {
  Sparkles,
  ShoppingBag,
  ChefHat,
  Bike,
  ShieldCheck,
  MapPin,
  Clock,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  Zap,
  HeartPulse,
  Utensils,
  Star,
  Users,
  TrendingUp,
  X
} from 'lucide-react';
import { Button, Badge } from '../common';
import AuthPanel from '../auth/AuthPanel';

const LandingPage = ({ onEnterSession }) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authDefaultRole, setAuthDefaultRole] = useState('customer');
  const [activeTab, setActiveTab] = useState('customer');

  const openAuth = (role = 'customer') => {
    setAuthDefaultRole(role);
    setShowAuthModal(true);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const searchParams = new URLSearchParams(window.location.search);
    const shouldOpenReset =
      hashParams.get('type') === 'recovery' ||
      searchParams.get('type') === 'recovery' ||
      searchParams.get('reset_password') === 'true' ||
      window.location.pathname.includes('reset-password');

    if (shouldOpenReset) {
      setShowAuthModal(true);
    }
  }, []);

  const featureCards = [
    {
      icon: Sparkles,
      color: 'bg-emerald-500 text-white',
      title: 'Gemini 2.5 AI Health Advisor',
      desc: 'Analyze food ingredients, health suitability for lunch/dinner, protein content, and dietary safety powered by Google Gemini AI.',
    },
    {
      icon: MapPin,
      color: 'bg-orange-500 text-white',
      title: 'Hyper-Local 30-Min Delivery',
      desc: 'Haversine distance calculation matches customers with nearby kitchens for rapid 30-minute doorstep delivery.',
    },
    {
      icon: MessageSquare,
      color: 'bg-indigo-500 text-white',
      title: 'Active & Done 3-Way Messaging',
      desc: 'Real-time messaging between Customer, Kitchen Seller, and Delivery Partner with Active and Completed chat categories.',
    },
    {
      icon: RouteIcon,
      color: 'bg-teal-500 text-white',
      title: 'Rider Pickup & Dropoff Route Map',
      desc: 'Delivery partners preview seller pickup and customer dropoff coordinates on an interactive Leaflet map before task acceptance.',
    },
    {
      icon: ChefHat,
      color: 'bg-amber-500 text-white',
      title: 'Kitchen Order Management',
      desc: 'Sellers confirm orders, set cooking progress (Preparing → Ready), detail ingredient recipes, and launch flash deals.',
    },
    {
      icon: ShieldCheck,
      color: 'bg-rose-500 text-white',
      title: 'Super Admin Oversight',
      desc: 'Super admin verification for partner licenses, user management, revenue analytics, and system oversight.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-orange-500 selection:text-white">
      {/* Glow Ambient Lights */}
      <div className="fixed top-0 left-1/4 h-96 w-96 rounded-full bg-orange-600/15 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 h-96 w-96 rounded-full bg-emerald-600/15 blur-[120px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white shadow-lg shadow-orange-500/20">
              <Utensils className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white">CloudKitchen</span>
              <span className="ml-2 rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold text-orange-400 border border-orange-500/20">
                PRO
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-orange-400 transition-colors">Features</a>
            <a href="#ai-assistant" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
              <Sparkles className="h-4 w-4 text-emerald-400" /> AI Advisor
            </a>
            <a href="#ecosystem" className="hover:text-orange-400 transition-colors">3-Way Ecosystem</a>
            <a href="#kitchens" className="hover:text-orange-400 transition-colors">Cloud Kitchens</a>
          </nav>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => openAuth('customer')}
              className="border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800 hover:text-white"
            >
              Sign In
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => openAuth('customer')}
              icon={<ArrowRight className="h-4 w-4" />}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 border-none shadow-lg shadow-orange-500/25"
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column: Headline & CTAs */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-xs font-semibold text-orange-400 backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-orange-400" />
                <span>Next-Gen Cloud Kitchen & Gemini 2.5 AI Ecosystem</span>
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl leading-[1.1]">
                Thizo Food Delivery Meets <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-emerald-400 bg-clip-text text-transparent">Gemini AI Intelligence</span>.
              </h1>

              <p className="text-lg text-slate-400 leading-relaxed max-w-xl">
                Experience 30-minute hyper-local delivery, direct 3-way messaging between Kitchens, Customers & Delivery Riders, and real-time AI food & ingredient health analysis.
              </p>

              {/* Action Buttons Grid */}
              <div className="grid sm:grid-cols-2 gap-3.5 pt-2 max-w-lg">
                <button
                  onClick={() => openAuth('customer')}
                  className="group flex items-center justify-between rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 p-4 text-left font-bold text-white shadow-xl shadow-orange-500/20 hover:scale-[1.02] transition-all"
                >
                  <div>
                    <span className="block text-xs font-medium text-orange-100 opacity-90">Customer Portal</span>
                    <span className="text-sm font-extrabold">Order Food Now</span>
                  </div>
                  <ShoppingBag className="h-5 w-5 text-orange-100 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => openAuth('seller')}
                  className="group flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/90 p-4 text-left font-bold text-white hover:border-amber-500/50 hover:bg-slate-900 hover:scale-[1.02] transition-all"
                >
                  <div>
                    <span className="block text-xs font-medium text-amber-400">Kitchen Seller</span>
                    <span className="text-sm font-extrabold">List Your Kitchen</span>
                  </div>
                  <ChefHat className="h-5 w-5 text-amber-400 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => openAuth('delivery')}
                  className="group flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/90 p-4 text-left font-bold text-white hover:border-indigo-500/50 hover:bg-slate-900 hover:scale-[1.02] transition-all"
                >
                  <div>
                    <span className="block text-xs font-medium text-indigo-400">Delivery Partner</span>
                    <span className="text-sm font-extrabold">Become a Rider</span>
                  </div>
                  <Bike className="h-5 w-5 text-indigo-400 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => openAuth('customer')}
                  className="group flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-4 text-left font-bold text-emerald-300 hover:border-emerald-500/60 hover:bg-emerald-900/40 hover:scale-[1.02] transition-all"
                >
                  <div>
                    <span className="block text-xs font-medium text-emerald-400">Gemini 2.5 AI</span>
                    <span className="text-sm font-extrabold">Try AI Health Advisor</span>
                  </div>
                  <Sparkles className="h-5 w-5 text-emerald-400 group-hover:rotate-12 transition-transform" />
                </button>
              </div>

              {/* Trust Badges */}
              <div className="flex items-center gap-6 pt-4 text-xs font-medium text-slate-400 border-t border-slate-800/80">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> 30-Min Fast Guarantee
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Real-time Map Route
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> 3-Way Order Chat
                </span>
              </div>
            </div>

            {/* Right Column: Hero Visual Showcase */}
            <div className="relative">
              <div className="relative mx-auto max-w-md lg:max-w-none rounded-3xl border border-slate-800 bg-slate-900/60 p-3 shadow-2xl backdrop-blur-xl">
                <div className="relative h-[440px] overflow-hidden rounded-2xl">
                  <img
                    src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80"
                    alt="Thizo Cloud Kitchen Bowl"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

                  {/* Floating Live Badge 1: Rider Map Tracking */}
                  <div className="absolute top-4 left-4 rounded-2xl border border-slate-700/80 bg-slate-900/90 p-3 shadow-xl backdrop-blur-md max-w-xs animate-bounce" style={{ animationDuration: '6s' }}>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                        <Bike className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">Live Route Map Tracking</p>
                        <p className="text-[10px] text-slate-400">Rider assigned • 1.8 km to customer</p>
                      </div>
                    </div>
                  </div>

                  {/* Floating Live Badge 2: Gemini AI Health Check */}
                  <div className="absolute bottom-4 right-4 rounded-2xl border border-emerald-500/40 bg-emerald-950/90 p-3.5 shadow-xl backdrop-blur-md max-w-xs">
                    <div className="flex items-start gap-2.5">
                      <Sparkles className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-emerald-300">Gemini AI Health Approved</p>
                        <p className="text-[11px] text-emerald-100/80 mt-0.5">
                          "High protein, fresh salmon & avocado. Perfect lunch option!"
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Counter Section */}
      <section className="border-y border-slate-800 bg-slate-900/40 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl font-black text-white sm:text-4xl">30 Min</p>
              <p className="text-xs font-medium text-slate-400 mt-1">Hyper-Local Radius Delivery</p>
            </div>
            <div>
              <p className="text-3xl font-black text-emerald-400 sm:text-4xl">Gemini 2.5</p>
              <p className="text-xs font-medium text-slate-400 mt-1">AI Health & Ingredient Advisor</p>
            </div>
            <div>
              <p className="text-3xl font-black text-orange-400 sm:text-4xl">100%</p>
              <p className="text-xs font-medium text-slate-400 mt-1">Real-Time 3-Way Order Chat</p>
            </div>
            <div>
              <p className="text-3xl font-black text-amber-400 sm:text-4xl">500+</p>
              <p className="text-xs font-medium text-slate-400 mt-1">Thizo Cloud Kitchen Partners</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-400">Everything You Need</span>
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">Built for Modern Food Ecosystems</h2>
            <p className="text-sm text-slate-400">From customer AI recommendations to seller recipe details and rider route previews.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureCards.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div key={idx} className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 hover:border-slate-700 hover:bg-slate-900 transition-all group">
                  <div className={`h-12 w-12 rounded-2xl ${feat.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{feat.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Gemini AI Feature Spotlight */}
      <section id="ai-assistant" className="py-20 bg-gradient-to-b from-slate-950 via-emerald-950/20 to-slate-950 border-y border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400">
                <Sparkles className="h-4 w-4" /> Gemini AI Health Assistant
              </div>
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl leading-tight">
                Know What You Eat with <span className="text-emerald-400">AI Ingredient Analysis</span>.
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Customers don't just order blindly. Click <strong>"Ask AI"</strong> on any food item to let Gemini 2.5 evaluate ingredients, recommend lunch/dinner timing, check calories & protein, and provide health advice.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3 text-xs text-slate-300">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Lunch vs. Dinner Suitability:</strong> AI tells you if the meal is best for sustained midday energy or light evening digestion.</span>
                </div>
                <div className="flex items-start gap-3 text-xs text-slate-300">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Full Ingredient Breakdown:</strong> Uses kitchen seller recipe descriptions to detect allergens, protein, and healthy fats.</span>
                </div>
                <div className="flex items-start gap-3 text-xs text-slate-300">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>One-Tap Questions:</strong> Ask quick questions with preset prompt buttons.</span>
                </div>
              </div>

              <Button
                variant="success"
                onClick={() => openAuth('customer')}
                icon={<Sparkles className="h-4 w-4" />}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold border-none shadow-lg shadow-emerald-600/30"
              >
                Experience AI Food Assistant
              </Button>
            </div>

            {/* AI Assistant Graphic Card */}
            <div className="rounded-3xl border border-emerald-500/30 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-md">
              <div className="border-b border-slate-800 pb-4 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-400" />
                  <span className="font-bold text-sm text-white">Gemini AI Health Advisor</span>
                </div>
                <Badge variant="success" size="sm">Gemini 2.5 Live</Badge>
              </div>

              <div className="space-y-3 text-xs">
                <div className="bg-slate-800/80 rounded-2xl p-3 text-slate-200">
                  <p className="font-semibold text-orange-400 mb-1">User Query:</p>
                  <p>"Can I eat Salmon Quinoa Bowl for lunch? Is it good for workout recovery?"</p>
                </div>

                <div className="bg-emerald-950/60 border border-emerald-500/30 rounded-2xl p-3.5 text-emerald-100 space-y-2">
                  <p className="font-bold text-emerald-300 flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-400" /> Gemini AI Analysis:
                  </p>
                  <p className="leading-relaxed">
                    🥗 <strong>Excellent Lunch Choice!</strong><br />
                    • <strong>High Protein:</strong> Fresh Atlantic salmon provides 28g lean protein.<br />
                    • <strong>Complex Carbs:</strong> Organic Quinoa offers slow-release energy for your afternoon.<br />
                    • <strong>Healthy Fats:</strong> Omega-3 fatty acids reduce post-workout inflammation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Way Ecosystem Role Switcher Showcase */}
      <section id="ecosystem" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-400">Unified Platform</span>
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">4 Tailored Portals, 1 Seamless Engine</h2>
          </div>

          {/* Role Switcher Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {[
              { id: 'customer', label: 'Customer Portal', icon: ShoppingBag },
              { id: 'seller', label: 'Kitchen Seller Portal', icon: ChefHat },
              { id: 'delivery', label: 'Delivery Partner Portal', icon: Bike },
              { id: 'admin', label: 'Super Admin Control', icon: ShieldCheck },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-bold transition-all ${active
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Role Showcase Content */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8 shadow-2xl backdrop-blur-xl">
            {activeTab === 'customer' && (
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <Badge variant="warning" size="md">Customer Portal</Badge>
                  <h3 className="text-2xl font-bold text-white">Thizo Foods & AI Health Guidance</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Filter foods by 30-min radius, place custom distant kitchen orders, chat directly with your kitchen cook & delivery rider, and use Gemini AI to inspect ingredients.
                  </p>
                  <Button variant="primary" onClick={() => openAuth('customer')}>Enter Customer Portal</Button>
                </div>
                <img
                  src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80"
                  alt="Customer Food App"
                  className="rounded-2xl border border-slate-800 h-64 w-full object-cover"
                />
              </div>
            )}

            {activeTab === 'seller' && (
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <Badge variant="success" size="md">Kitchen Seller Portal</Badge>
                  <h3 className="text-2xl font-bold text-white">Menu Recipe Control & Order Pass-Through</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Add menu items with full ingredient descriptions, update order cooking status (Confirm & Cook → Pass to Rider), run flash deals, and manage earnings.
                  </p>
                  <Button variant="primary" onClick={() => openAuth('seller')}>Enter Kitchen Seller Portal</Button>
                </div>
                <img
                  src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80"
                  alt="Kitchen Seller Dashboard"
                  className="rounded-2xl border border-slate-800 h-64 w-full object-cover"
                />
              </div>
            )}

            {activeTab === 'delivery' && (
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <Badge variant="secondary" size="md">Delivery Partner Portal</Badge>
                  <h3 className="text-2xl font-bold text-white">Map Pickup & Dropoff Preview Before Task Accept</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Riders inspect full Leaflet route maps showing seller pickup and customer dropoff coordinates before accepting tasks, update status, and chat with customers.
                  </p>
                  <Button variant="primary" onClick={() => openAuth('delivery')}>Enter Delivery Partner Portal</Button>
                </div>
                <img
                  src="https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=800&q=80"
                  alt="Delivery Partner Rider"
                  className="rounded-2xl border border-slate-800 h-64 w-full object-cover"
                />
              </div>
            )}

            {activeTab === 'admin' && (
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <Badge variant="danger" size="md">Super Admin Portal</Badge>
                  <h3 className="text-2xl font-bold text-white">License Approvals & Platform Analytics</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Super admins verify seller/rider documents, monitor platform sales, manage user accounts, and resolve system issues.
                  </p>
                  <Button variant="primary" onClick={() => openAuth('admin')}>Enter Super Admin Portal</Button>
                </div>
                <img
                  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80"
                  alt="Super Admin Dashboard"
                  className="rounded-2xl border border-slate-800 h-64 w-full object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Cloud Kitchen Spotlight */}
      <section id="kitchens" className="py-20 bg-slate-900/30 border-t border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-extrabold text-white">Popular Cloud Kitchens</h2>
            <p className="text-xs text-slate-400 mt-2">Thizo kitchens delivering fresh meals nearby.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { name: 'Banani Thizo Kitchen', cuisine: 'Artisanal Bowls & Salmon', rating: '4.9', img: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80' },
              { name: 'Gulshan Wood-Fired Pizza', cuisine: 'Neapolitan Pizza & Pasta', rating: '4.8', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80' },
              { name: 'Dhanmondi Thai Kitchen', cuisine: 'Thai Spicy Basil & Noodle Bowls', rating: '4.9', img: 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=600&q=80' },
            ].map((k, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden group hover:border-orange-500/50 transition-all">
                <div className="h-44 overflow-hidden relative">
                  <img src={k.img} alt={k.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur px-2.5 py-1 rounded-full text-xs font-bold text-amber-400 flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {k.rating}
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="font-bold text-white text-base">{k.name}</h4>
                  <p className="text-xs text-slate-400 mt-1">{k.cuisine}</p>
                  <Button variant="secondary" size="sm" onClick={() => openAuth('customer')} className="w-full mt-4 border-slate-800 text-slate-200">
                    Order from Kitchen
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-12 text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-white">
              <Utensils className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-slate-200 text-sm">CloudKitchen Inc.</p>
              <p className="text-[11px] text-slate-500">Hyper-Local Delivery & Gemini AI Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={() => openAuth('customer')} className="hover:text-white">Customer Portal</button>
            <button onClick={() => openAuth('seller')} className="hover:text-white">Seller Portal</button>
            <button onClick={() => openAuth('delivery')} className="hover:text-white">Delivery Partner</button>
            <button onClick={() => openAuth('admin')} className="hover:text-white">Super Admin</button>
          </div>

          <p>© 2026 CloudKitchen. All rights reserved.</p>
        </div>
      </footer>

      {/* Auth Modal Overlay */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden my-8">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 z-50 rounded-full bg-slate-800 p-2 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <AuthPanel defaultRole={authDefaultRole} onEnter={(session) => { setShowAuthModal(false); onEnterSession(session); }} />
          </div>
        </div>
      )}
    </div>
  );
};

// Dummy RouteIcon for safety
const RouteIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
  </svg>
);

export default LandingPage;
