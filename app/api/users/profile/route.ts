import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/lib/auth';
import { supabaseAdmin } from '@/app/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Fetch full profile details including shop_name
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: profile }, { status: 200 });
  } catch (error: any) {
    console.error('[API Profile GET] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();

    // Fetch existing profile to preserve unchanged fields
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const full_name = body.full_name || existingProfile?.full_name || user.user_metadata?.full_name || 'User';
    const phone = body.phone || existingProfile?.phone || '';
    const email = body.email || existingProfile?.email || user.email || '';

    if (!full_name || !email) {
      return NextResponse.json({ error: 'Missing required profile identity fields' }, { status: 400 });
    }

    // 1. Update Auth details if password or email is changed
    const authUpdates: any = {};
    if (body.password && body.password.trim() !== '') {
      if (body.password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
      }
      authUpdates.password = body.password;
    }
    if (body.email && body.email.toLowerCase() !== user.email?.toLowerCase()) {
      authUpdates.email = body.email;
    }

    if (Object.keys(authUpdates).length > 0) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        authUpdates
      );
      if (authError) {
        console.error('[API Profile PUT] Auth update error:', authError);
        return NextResponse.json({ error: authError.message || 'Failed to update credentials' }, { status: 400 });
      }
    }

    // 2. Update profiles table
    const profileUpdates: any = {
      full_name,
      phone,
      email,
      location: body.location !== undefined ? body.location : (existingProfile?.location || ''),
      updated_at: new Date().toISOString(),
    };

    if (body.latitude !== undefined && body.latitude !== null) {
      profileUpdates.latitude = body.latitude;
    }
    if (body.longitude !== undefined && body.longitude !== null) {
      profileUpdates.longitude = body.longitude;
    }

    // Sellers only: add/update shop_name
    if (user.profile.role === 'seller') {
      profileUpdates.shop_name = body.shop_name !== undefined ? body.shop_name : (existingProfile?.shop_name || '');
    }

    const { data: updatedProfile, error: dbError } = await supabaseAdmin
      .from('profiles')
      .update(profileUpdates)
      .eq('id', user.id)
      .select()
      .single();

    if (dbError) {
      console.error('[API Profile PUT] DB update error:', dbError);
      return NextResponse.json({ error: dbError.message || 'Failed to update profile records' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: updatedProfile }, { status: 200 });
  } catch (error: any) {
    console.error('[API Profile PUT] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update profile' }, { status: 500 });
  }
}
