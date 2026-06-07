# Quick Start - Backend Setup Guide

## Step 1: Environment Variables

Add to `.env.local` in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Step 2: Create Database Schema

1. Open Supabase Dashboard → SQL Editor
2. Create new query
3. Copy entire content from `/supabase/migrations/001_init_schema.sql`
4. Execute the query

This creates:
- `profiles` table
- `user_documents` table
- RLS policies for security
- Enums for roles and status

## Step 3: Create Storage Bucket

1. Go to Supabase Dashboard → Storage
2. Create new bucket: `user-documents`
3. Set to **Private** (authenticated access only)

## Step 4: Create Super Admin User (Optional)

### Option A: Via Supabase UI
1. Dashboard → Authentication → Add User
2. Email: admin@cloudkitchen.com
3. Create temporary password
4. Copy the user UUID

### Option B: Via SQL
1. Get user UUID from Step A or create new user in Auth tab
2. SQL Editor → New query
3. Run this (replace UUID):
```sql
INSERT INTO profiles (id, email, full_name, phone, role, status) 
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin@cloudkitchen.com', 'Admin', '+1234567890', 'super_admin', 'approved')
ON CONFLICT (id) DO NOTHING;
```

## Step 5: Verify Setup

### Test Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@12345",
    "full_name": "Test User",
    "phone": "+1234567890",
    "role": "customer"
  }'
```

### Test Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@12345"
  }'
```

## File Structure Overview

```
Backend Files Created:
├── middleware.ts                           # Role-based route protection
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── register/route.ts          # User registration
│   │   │   ├── login/route.ts             # User login
│   │   │   ├── logout/route.ts            # User logout
│   │   │   └── session/route.ts           # Get current session
│   │   ├── admin/
│   │   │   ├── pending-approvals/route.ts # List pending users
│   │   │   ├── users/route.ts             # Get all users
│   │   │   ├── users/[userId]/[action]/route.ts  # Approve/reject
│   │   │   └── customers/route.ts         # Create/delete customers
│   │   └── users/
│   │       ├── profile/route.ts           # Get/update profile
│   │       └── documents/route.ts         # Upload/get documents
│   ├── lib/
│   │   ├── supabase.ts                    # Supabase client setup
│   │   ├── auth.ts                        # Auth logic
│   │   └── admin.ts                       # Admin operations
│   └── types/
│       └── index.ts                       # TypeScript types
├── supabase/
│   ├── migrations/
│   │   └── 001_init_schema.sql            # Database schema
│   └── seed.sql                           # Demo super_admin seed
└── BACKEND_SETUP.md                       # Full documentation
```

## Key API Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/auth/register` | POST | ❌ | Create new user account |
| `/api/auth/login` | POST | ❌ | Login & get JWT |
| `/api/auth/logout` | POST | ✅ | Clear session |
| `/api/auth/session` | GET | ✅ | Get current user |
| `/api/users/profile` | GET/PUT | ✅ | User profile mgmt |
| `/api/users/documents` | GET/POST | ✅ | Document upload |
| `/api/admin/pending-approvals` | GET | ✅ SA | List pending |
| `/api/admin/users` | GET | ✅ SA | List all users |
| `/api/admin/users/[id]/approve` | PUT | ✅ SA | Approve user |
| `/api/admin/users/[id]/reject` | PUT | ✅ SA | Reject user |
| `/api/admin/customers` | POST/DELETE | ✅ SA | Manage customers |

✅ = Required | ❌ = Not required | SA = Super Admin only

## Role-Based Routing

After login, middleware automatically redirects:
- **Customer** → `/customer/dashboard`
- **Seller** → `/seller/dashboard`
- **Delivery Partner** → `/delivery/dashboard`
- **Super Admin** → `/admin/dashboard`

## Common Issues

| Issue | Solution |
|-------|----------|
| "Missing Supabase env vars" | Add all 3 env vars to `.env.local` |
| "Cannot register as super_admin" | Use seed file to create super_admin |
| "Permission denied" errors | Ensure RLS policies ran in Step 2 |
| "JWT expired" | Users must re-login every 7 days |
| "File upload fails" | Check bucket exists and is Private |
| "User profile not found" | Database schema might not be created |

## Frontend Integration

Connect your existing Vite frontend:

```javascript
// In your login component
const handleLogin = async (email, password) => {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  if (res.ok) {
    const data = await res.json();
    // Redirect based on role
    window.location.href = `/${data.profile.role}/dashboard`;
  }
};
```

## Next: Create Dashboard Pages

You still need to create dashboard pages for each role:
- `/app/customer/dashboard/page.tsx`
- `/app/seller/dashboard/page.tsx`
- `/app/delivery/dashboard/page.tsx`
- `/app/admin/dashboard/page.tsx`

See `/BACKEND_SETUP.md` for full API documentation and examples.
