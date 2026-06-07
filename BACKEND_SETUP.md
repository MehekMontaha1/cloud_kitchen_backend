# Cloud Kitchen Backend - Supabase Authentication & Authorization

Complete backend implementation for a role-based authentication system with Supabase and Next.js API routes.

## Project Structure

```
/app
  /api
    /auth
      /register
        route.ts           # User registration (customer, seller, delivery_partner only)
      /login
        route.ts           # User login with JWT
      /logout
        route.ts           # Clear auth cookie
      /session
        route.ts           # Get current user session
    /admin
      /pending-approvals
        route.ts           # Get all pending sellers/delivery partners
      /users
        route.ts           # Get all users (admin only)
        /[userId]
          /[action]
            route.ts       # Approve/reject users (admin only)
      /customers
        route.ts           # Create/delete customers (admin only)
    /users
      /profile
        route.ts           # Get/update user profile
      /documents
        route.ts           # Upload/get verification documents
  /lib
    supabase.ts            # Supabase client initialization and helpers
    auth.ts                # Authentication logic (register, login, logout)
    admin.ts               # Admin functions (approve, reject, manage users)
  /types
    index.ts               # TypeScript type definitions
  middleware.ts            # Role-based route protection and redirects

/supabase
  /migrations
    001_init_schema.sql    # Database schema, tables, RLS policies
  seed.sql                 # Seed file for super_admin creation

package.json               # Dependencies
```

## Environment Variables

Create a `.env.local` file in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**How to find these values:**
1. Go to your Supabase project dashboard
2. Settings → API
3. Copy the Project URL and keys

## Roles & Access Control

### Four Roles:

1. **customer** - Can self-register, auto-approved
2. **seller** - Can self-register with license, pending approval
3. **delivery_partner** - Can self-register with license, pending approval
4. **super_admin** - Created only via seed/script, manages approvals and users

### Super Admin Permissions:

- View all users and their details
- Approve/reject pending sellers and delivery partners
- Create customer accounts manually
- Delete customer accounts
- Access admin dashboard at `/admin/dashboard`

### Status Flow:

- **customer**: Always `approved`
- **seller/delivery_partner**: Start `pending` → `approved` or `rejected` by super_admin
- **super_admin**: Always `approved`

## Authentication Flow

### 1. Registration

```
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "full_name": "John Doe",
  "phone": "+1234567890",
  "role": "customer" | "seller" | "delivery_partner"  (NOT super_admin)
}

Response:
{
  "success": true,
  "user": { "id": "uuid", "email": "..." },
  "profile": { "id", "role", "status", ... },
  "message": "Registration successful. Awaiting admin approval." (if seller/delivery_partner)
}
```

### 2. Login

```
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "SecurePass123"
}

Response:
{
  "success": true,
  "user": { "id": "uuid", "email": "..." },
  "profile": { "id", "role", "status", ... }
}

JWT is stored in secure httpOnly cookie: cloud-kitchen-auth
```

### 3. Middleware Protection

After login, the middleware (`middleware.ts`) automatically:
- Validates JWT from cookie
- Checks user role and status
- Redirects based on role:
  - `customer` → `/customer/dashboard`
  - `seller` → `/seller/dashboard`
  - `delivery_partner` → `/delivery/dashboard`
  - `super_admin` → `/admin/dashboard`
- Denies access if status is `rejected`
- Shows pending approval page if status is `pending`

### 4. Session

```
GET /api/auth/session

Response:
{
  "success": true,
  "user": { "id": "uuid", "email": "..." },
  "profile": { "id", "role", "status", ... }
}
```

### 5. Logout

```
POST /api/auth/logout

Response: { "success": true, "message": "Logged out successfully" }
```

## Admin Operations

### Get Pending Approvals

```
GET /api/admin/pending-approvals (super_admin only)

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "seller@example.com",
      "full_name": "...",
      "role": "seller",
      "status": "pending",
      "documents": [...]
    }
  ]
}
```

### Approve User

```
PUT /api/admin/users/[userId]/approve (super_admin only)

Response:
{
  "success": true,
  "message": "User approvedsuccsesfully",
  "data": { "id", "role", "status": "approved", ... }
}
```

### Reject User

```
PUT /api/admin/users/[userId]/reject (super_admin only)

Response:
{
  "success": true,
  "message": "User rejectedsuccessfully",
  "data": { "id", "role", "status": "rejected", ... }
}
```

### Create Customer (Admin)

```
POST /api/admin/customers (super_admin only)
{
  "email": "customer@example.com",
  "full_name": "John Doe",
  "phone": "+1234567890"
}

Response:
{
  "success": true,
  "message": "Customer created successfully",
  "data": {
    "user": { "id": "uuid", "email": "..." },
    "profile": { ... },
    "tempPassword": "Temp_abc123" (share with customer securely)
  }
}
```

### Delete Customer (Admin)

```
DELETE /api/admin/customers (super_admin only)
{
  "user_id": "uuid"
}

Response:
{
  "success": true,
  "message": "Customer deleted successfully"
}
```

### Get All Users

```
GET /api/admin/users (super_admin only)

Response:
{
  "success": true,
  "data": [ { "id", "email", "role", "status", ... } ],
  "total": 10
}
```

## User Operations

### Get Profile

```
GET /api/users/profile (authenticated users only)

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "phone": "+1234567890",
    "role": "seller",
    "status": "pending",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

### Update Profile

```
PUT /api/users/profile (authenticated users only)
{
  "full_name": "Jane Doe",
  "phone": "+0987654321"
}

Response:
{
  "success": true,
  "message": "Profile updated successfully",
  "data": { ... }
}
```

### Get Documents

```
GET /api/users/documents (authenticated users only)

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "document_type": "license",
      "document_url": "https://...",
      "uploaded_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Upload Document

```
POST /api/users/documents (authenticated users only)
FormData:
  - file: File (JPEG, PNG, or PDF, max 5MB)
  - document_type: "license" | "id_proof" | ... (string)

Response:
{
  "success": true,
  "message": "Document uploaded successfully",
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "document_type": "license",
    "document_url": "https://...",
    "uploaded_at": "2024-01-15T10:30:00Z"
  }
}
```

## Database Schema

### Profiles Table
- `id` (UUID) - Primary key, links to auth.users
- `email` (TEXT) - User's email
- `full_name` (TEXT) - User's full name
- `phone` (TEXT) - User's phone number
- `role` (ENUM) - customer, seller, delivery_partner, super_admin
- `status` (ENUM) - pending, approved, rejected
- `created_at` (TIMESTAMP) - Creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

### User Documents Table
- `id` (UUID) - Primary key
- `user_id` (UUID) - Foreign key to profiles
- `document_type` (TEXT) - license, id_proof, etc.
- `document_url` (TEXT) - URL stored in Supabase Storage
- `uploaded_at` (TIMESTAMP) - Upload timestamp

### Row Level Security (RLS)
- Users can only view their own profile
- Super admin can view/update any profile
- Users can only upload their own documents
- Super admin can manage all documents

## Setting Up the Backend

### 1. Add Environment Variables

In Vercel or your `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### 2. Create Database Schema

Run the SQL migration in Supabase SQL Editor:
- Open `/supabase/migrations/001_init_schema.sql`
- Copy the entire content
- Go to Supabase Dashboard → SQL Editor
- Create a new query and paste the SQL
- Execute it

### 3. Create Super Admin User (Optional)

Method 1: Supabase Auth UI
1. Go to Supabase → Authentication
2. Create a new user with email: admin@cloudkitchen.com
3. Copy the user UUID from the auth.users table
4. In SQL Editor, run the seed.sql with the UUID

Method 2: Server-side Script
See `/supabase/seed.sql` for reference

### 4. Bucket for Document Storage

Create a bucket in Supabase Storage:
1. Go to Supabase Dashboard → Storage
2. Create bucket: `user-documents`
3. Set to Private (authenticated users only)

## Security Features

✅ httpOnly cookies for JWT storage (no JS access)  
✅ Server-side middleware validation  
✅ Row Level Security (RLS) policies  
✅ Role-based access control  
✅ Status-based access (approved/pending/rejected)  
✅ Input validation on all routes  
✅ Service role key for admin operations  
✅ File upload validation (type, size)  
✅ Automatic user profile creation on signup  
✅ Cascading deletes for data integrity

## Error Handling

All API routes return appropriate HTTP status codes:
- `200` - Success
- `201` - Created (e.g., user registered)
- `400` - Bad request (validation error)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (no permission)
- `404` - Not found
- `409` - Conflict (e.g., email already exists)
- `500` - Server error

Error response format:
```json
{
  "error": "Error message describing what went wrong"
}
```

## Frontend Integration

### Example: Register a Seller

```javascript
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'seller@example.com',
    password: 'SecurePass123',
    full_name: 'John Doe',
    phone: '+1234567890',
    role: 'seller'
  })
});

if (response.ok) {
  const data = await response.json();
  // Redirect to pending approval page or dashboard
} else {
  const error = await response.json();
  // Show error message
}
```

### Example: Login

```javascript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePass123'
  })
});

if (response.ok) {
  // Cookie is set automatically, redirect based on role
  const data = await response.json();
  window.location.href = `/${data.profile.role}/dashboard`;
} else {
  const error = await response.json();
  // Show login error
}
```

### Example: Upload License (Seller)

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('document_type', 'license');

const response = await fetch('/api/users/documents', {
  method: 'POST',
  body: formData
});

if (response.ok) {
  const data = await response.json();
  console.log('Document uploaded:', data.data.document_url);
} else {
  const error = await response.json();
  // Show upload error
}
```

## Testing

### Test Registration Flow
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456",
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
    "password": "Test123456"
  }'
```

### Test Get Session
```bash
curl -X GET http://localhost:3000/api/auth/session \
  -H "Cookie: cloud-kitchen-auth=your_jwt_token"
```

## Troubleshooting

**"Missing Supabase environment variables"**
- Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are in `.env.local`

**"User cannot register as super_admin"**
- Super admin registration is intentionally disabled. Create via seed file or admin script instead.

**"JWT invalid or expired"**
- Token expires after 7 days. User needs to log in again.

**"User profile not found"**
- This shouldn't happen in normal flow. Check if auth and profile creation both succeeded.

**"File upload fails"**
- Ensure Supabase Storage bucket `user-documents` is created and set to Private
- Check file size (max 5MB) and type (JPEG, PNG, PDF)

## Next Steps

1. Deploy database schema to Supabase
2. Create super_admin user via seed file
3. Create storage bucket for documents
4. Set environment variables in Vercel/production
5. Connect frontend to the API routes
6. Test full registration → login → approval flow
7. Monitor middleware logs for auth issues

## Support

For issues with:
- **Supabase setup**: https://supabase.com/docs
- **Next.js middleware**: https://nextjs.org/docs/app/building-your-application/routing/middleware
- **JWT handling**: Check `/app/lib/auth.ts`
