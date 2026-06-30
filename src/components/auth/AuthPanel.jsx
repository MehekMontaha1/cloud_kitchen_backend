import { useState } from 'react';
import { Bike, ChefHat, LockKeyhole, Mail, ShieldCheck, ShoppingBag, Upload, UserRound, Phone } from 'lucide-react';
import { Button, Input, Textarea } from '../common';
import { supabase } from '../../../app/lib/supabase';
import { registerUser, loginUser, logoutUser, uploadDocument } from '../../../app/lib/api-helpers';

const roles = [
  {
    value: 'customer',
    label: 'Customer',
    description: 'Nearby foods, custom orders, deals, cart, inbox, and support.',
    icon: ShoppingBag,
  },
  {
    value: 'seller',
    label: 'Seller',
    description: 'Menu, regular/custom orders, inbox, flash offers, and earnings.',
    icon: ChefHat,
  },
  {
    value: 'delivery',
    label: 'Delivery Partner',
    description: 'Nearby regular deliveries, locations, and order status updates.',
    icon: Bike,
  },
  {
    value: 'admin',
    label: 'Super Admin',
    description: 'Verification, analytics, system controls, and message monitoring.',
    icon: ShieldCheck,
  },
];

const AuthPanel = ({ onEnter }) => {
  const [mode, setMode] = useState('login');
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'customer',
    phone: '',
    address: '',
  });

  const selectedRole = roles.find((role) => role.value === form.role);

  const update = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleRoleChange = (roleValue) => {
    setForm((prev) => ({ ...prev, role: roleValue }));
    if (roleValue === 'admin') {
      setMode('login');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      if (mode === 'login') {
        const result = await loginUser(form.email, form.password);

        if (result.profile.status === 'pending') {
          alert('Your account is pending admin approval.');
          return;
        } else if (result.profile.status === 'rejected') {
          alert('Your account verification request was rejected.');
          return;
        }

        const mapDbRoleToFrontend = (dbRole) => {
          if (dbRole === 'delivery_partner') return 'delivery';
          if (dbRole === 'super_admin') return 'admin';
          return dbRole;
        };

        onEnter?.({
          id: result.profile.id,
          role: mapDbRoleToFrontend(result.profile.role) || 'customer',
          name: result.profile.full_name || 'User',
          email: result.user.email,
        });
      } else {
        if (form.role !== 'customer' && !file) {
          alert('Please upload your ID / License Document');
          return;
        }

        const dbRole = form.role === 'delivery' ? 'delivery_partner' : form.role;

        // 1. Call register backend API
        await registerUser(
          form.email,
          form.password,
          form.name,
          form.phone,
          dbRole
        );

        // 2. Programmatic login to perform upload
        const loginResult = await loginUser(form.email, form.password);

        // 3. Upload document if seller/delivery
        if (form.role !== 'customer' && file) {
          try {
            await uploadDocument(file, 'license');
          } catch (uploadErr) {
            alert('Registration succeeded but document upload failed: ' + uploadErr.message);
            await logoutUser();
            setMode('login');
            return;
          }
        }

        if (form.role !== 'customer') {
          alert('Registration successful. Awaiting admin approval.');
          await logoutUser();
          setMode('login');
        } else {
          onEnter?.({
            id: loginResult.profile.id,
            role: 'customer',
            name: loginResult.profile.full_name || 'User',
            email: loginResult.user.email,
          });
        }
      }
    } catch (error) {
      console.error('Authentication error:', error.message);
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500 text-white">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">CloudKitchen</h1>
              <p className="text-xs text-slate-500">Food delivery platform</p>
            </div>
          </div>
          <p className="hidden text-sm font-medium text-slate-500 sm:block">Backend Connected Access</p>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_440px] lg:px-8">
        <section className="flex min-h-[calc(100vh-8rem)] flex-col justify-center">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">Cloud kitchen operations</p>
            <h2 className="mt-3 text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl">
              Login once and continue to the right panel.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
              Choose whether you are a customer, seller, delivery partner, or super admin. Authentication and permissions are managed by the database backend.
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {roles.map((role) => {
              const Icon = role.icon;
              const active = form.role === role.value;

              return (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => handleRoleChange(role.value)}
                  className={`rounded-xl border bg-white p-4 text-left transition-all ${
                    active
                      ? 'border-slate-900 shadow-soft ring-2 ring-slate-900/10'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-soft'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`rounded-lg p-2 ${active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{role.label}</p>
                      <p className="mt-1 text-sm leading-5 text-slate-500">{role.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="self-center rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
          <div className="mb-5 flex rounded-xl bg-slate-100 p-1">
            <button
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold ${mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
              onClick={() => setMode('login')}
              type="button"
            >
              Login
            </button>
            {form.role !== 'admin' && (
              <button
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold ${mode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                onClick={() => setMode('register')}
                type="button"
              >
                Register
              </button>
            )}
          </div>

          <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Selected role</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{selectedRole.label}</p>
            <p className="mt-1 text-sm text-slate-500">{selectedRole.description}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'register' && (
              <Input label="Full Name" placeholder="Enter your name" value={form.name} onChange={update('name')} icon={<UserRound className="h-4 w-4" />} required />
            )}
            <Input label="Email" type="email" placeholder="name@example.com" value={form.email} onChange={update('email')} icon={<Mail className="h-4 w-4" />} required />
            <Input label="Password" type="password" placeholder="Enter password" value={form.password} onChange={update('password')} icon={<LockKeyhole className="h-4 w-4" />} required />
            {mode === 'register' && (
              <Input label="Phone Number" type="tel" placeholder="+1234567890" value={form.phone} onChange={update('phone')} icon={<Phone className="h-4 w-4" />} required />
            )}

            {mode === 'register' && form.role !== 'customer' && (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  ID / License Document (Required)
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1 file:text-xs file:font-semibold hover:file:bg-slate-200"
                    required
                  />
                </div>
              </div>
            )}
            {mode === 'register' && (
              <Textarea label="Address" rows={3} placeholder="Business, delivery, or customer address" value={form.address} onChange={update('address')} />
            )}

            <Button type="submit" className="w-full rounded-lg" size="lg">
              {mode === 'login' ? `Login as ${selectedRole.label}` : `Create ${selectedRole.label} Account`}
            </Button>
          </form>
        </section>
      </main>
    </div>
  );
};

export default AuthPanel;
