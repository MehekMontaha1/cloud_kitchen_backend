import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/lib/auth';
import { getUserProfile } from '@/app/lib/supabase';
import { supabase } from '@/app/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const profile = await getUserProfile(user.id);

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: profile,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[v0] Get profile route error:', error);

    return NextResponse.json(
      { error: error.message || 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { full_name, phone } = body;

    // Only allow updating certain fields
    const updateData: any = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (phone !== undefined) updateData.phone = phone;
    updateData.updated_at = new Date().toISOString();

    if (Object.keys(updateData).length === 1 && updateData.updated_at) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      {
        success: true,
        message: 'Profile updated successfully',
        data,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[v0] Update profile route error:', error);

    return NextResponse.json(
      { error: error.message || 'Failed to update profile' },
      { status: 500 }
    );
  }
}
