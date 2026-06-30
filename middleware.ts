import { NextRequest, NextResponse } from 'next/server';
import type { NextFetchEvent } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

// Routes that don't require authentication
const publicRoutes = ['/login', '/register', '/'];

// Role-based route mapping
const roleRoutes: Record<string, string[]> = {
  customer: ['/customer'],
  seller: ['/seller'],
  delivery_partner: ['/delivery'],
  super_admin: ['/admin'],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Allow API routes (they handle auth internally)
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Try to get token from cookies
  const token = request.cookies.get('cloud-kitchen-auth')?.value;

  if (!token) {
    // Redirect to login if trying to access protected route
    if (pathname.startsWith('/customer') || 
        pathname.startsWith('/seller') || 
        pathname.startsWith('/delivery') || 
        pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // Verify token and get user profile
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
    });

    // Get user from token
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !authData.user) {
      // Invalid token, redirect to login
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('cloud-kitchen-auth');
      return response;
    }

    // Get user profile with role and status
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role, status')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profileData) {
      // Profile not found, redirect to login
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('cloud-kitchen-auth');
      return response;
    }

    const { role, status } = profileData;

    // Check if user is rejected
    if (status === 'rejected') {
      return NextResponse.redirect(new URL('/rejected', request.url));
    }

    // Check if user is pending (for sellers and delivery partners)
    if (status === 'pending' && (role === 'seller' || role === 'delivery_partner')) {
      return NextResponse.redirect(new URL('/pending-approval', request.url));
    }

    // Check if user has access to the requested route
    const allowedRoutes = roleRoutes[role] || [];
    
    if (pathname.startsWith('/customer') || 
        pathname.startsWith('/seller') || 
        pathname.startsWith('/delivery') || 
        pathname.startsWith('/admin')) {
      // Extract the first part of the route (e.g., '/customer' from '/customer/dashboard')
      const routePrefix = '/' + pathname.split('/')[1];
      
      // Check if user's role is allowed to access this route
      const isAllowed = allowedRoutes.some(route => pathname.startsWith(route));
      
      if (!isAllowed) {
        // User doesn't have permission for this route
        return NextResponse.redirect(new URL(`${allowedRoutes[0]}/dashboard`, request.url));
      }
    }

    // User is authenticated and authorized
    const response = NextResponse.next();
    
    // Add user info to headers for use in route handlers
    response.headers.set('x-user-id', authData.user.id);
    response.headers.set('x-user-role', role);
    response.headers.set('x-user-status', status);

    return response;
  } catch (error) {
    console.error('[v0] Middleware error:', error);
    
    // On error, redirect to login
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('cloud-kitchen-auth');
    return response;
  }
}

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    // Run on all routes except these
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
