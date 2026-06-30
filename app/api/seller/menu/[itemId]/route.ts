import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/lib/auth';
import { toggleMenuItemStatus, deleteMenuItem } from '@/app/lib/seller';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (user.profile.role !== 'seller') {
      return NextResponse.json({ error: 'Access denied. Only sellers can modify menu items.' }, { status: 403 });
    }

    const { itemId } = await params;
    const updatedItem = await toggleMenuItemStatus(user.id, itemId);

    return NextResponse.json({ success: true, data: updatedItem }, { status: 200 });
  } catch (error: any) {
    console.error('[API Menu PUT] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update menu item status' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (user.profile.role !== 'seller') {
      return NextResponse.json({ error: 'Access denied. Only sellers can delete menu items.' }, { status: 403 });
    }

    const { itemId } = await params;
    await deleteMenuItem(user.id, itemId);

    return NextResponse.json({ success: true, message: 'Item deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('[API Menu DELETE] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete menu item' }, { status: 500 });
  }
}
