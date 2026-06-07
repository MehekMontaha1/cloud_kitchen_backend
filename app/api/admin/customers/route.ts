import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/lib/auth';
import { createCustomerManually, deleteCustomer } from '@/app/lib/admin';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    // Check if user is authenticated and is super_admin
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    if (user.profile.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Access denied. Only super admin can create customers.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, full_name, phone } = body;

    if (!email || !full_name || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields: email, full_name, phone' },
        { status: 400 }
      );
    }

    const result = await createCustomerManually(email, full_name, phone);

    return NextResponse.json(
      {
        success: true,
        message: 'Customer created successfully',
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
          },
          profile: result.profile,
          tempPassword: result.tempPassword,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[v0] Create customer route error:', error);

    if (error.message?.includes('duplicate')) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create customer' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    // Check if user is authenticated and is super_admin
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    if (user.profile.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Access denied. Only super admin can delete customers.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: 'Missing required field: user_id' },
        { status: 400 }
      );
    }

    await deleteCustomer(user_id);

    return NextResponse.json(
      {
        success: true,
        message: 'Customer deleted successfully',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[v0] Delete customer route error:', error);

    if (error.message?.includes('not found')) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    if (error.message?.includes('Only customers')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to delete customer' },
      { status: 500 }
    );
  }
}
