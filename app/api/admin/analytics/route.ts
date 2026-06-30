import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/lib/auth';
import { supabaseAdmin } from '@/app/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (user.profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Access denied. Admin only.' }, { status: 403 });
    }

    // 1. Count total users
    const { count: totalUsers, error: errUsers } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    if (errUsers) throw errUsers;

    // 2. Count total orders
    const { count: totalOrders, error: errOrders } = await supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact', head: true });
    if (errOrders) throw errOrders;

    // 3. Sum total revenue from orders
    const { data: revenueData, error: errRev } = await supabaseAdmin
      .from('orders')
      .select('value');
    if (errRev) throw errRev;
    const totalRevenue = (revenueData || []).reduce((sum, item) => sum + Number(item.value || 0), 0);

    // 4. Count active sellers
    const { count: activeSellers, error: errSellers } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'seller')
      .eq('status', 'approved');
    if (errSellers) throw errSellers;

    // 5. Count active delivery partners
    const { count: activeDelivery, error: errDelivery } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'delivery_partner')
      .eq('status', 'approved');
    if (errDelivery) throw errDelivery;

    // 6. Count open reports
    const { count: openReports, error: errReports } = await supabaseAdmin
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open');
    if (errReports) throw errReports;

    return NextResponse.json({
      success: true,
      data: {
        totalUsers: totalUsers || 0,
        totalOrders: totalOrders || 0,
        totalRevenue: totalRevenue || 0,
        activeSellers: activeSellers || 0,
        activeDelivery: activeDelivery || 0,
        openReports: openReports || 0
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error('[API Admin Analytics GET] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch analytics data' }, { status: 500 });
  }
}
