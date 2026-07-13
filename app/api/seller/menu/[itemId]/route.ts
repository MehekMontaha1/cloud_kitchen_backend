import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/lib/auth';
import { toggleMenuItemStatus, deleteMenuItem, updateMenuItem } from '@/app/lib/seller';
import { supabaseAdmin, supabase } from '@/app/lib/supabase';

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
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const name = formData.get('name') as string;
      const priceStr = formData.get('price') as string;
      const stockStr = formData.get('stock') as string;
      const description = formData.get('description') as string;
      const category = formData.get('category') as string;
      const status = formData.get('status') as string;
      const file = formData.get('file') as File | null;

      const updates: any = {};
      if (name) updates.name = name;
      if (priceStr) {
        const price = Number(priceStr);
        if (!isNaN(price) && price >= 0) updates.price = price;
      }
      if (stockStr) {
        const stock = Number(stockStr);
        if (!isNaN(stock) && stock >= 0) updates.stock = stock;
      }
      if (description !== null && description !== undefined) updates.description = description;
      if (category) updates.category = category;
      if (status) updates.status = status;

      // Handle image upload if a file was provided
      if (file && file.size > 0) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
          return NextResponse.json(
            { error: 'Invalid image type. Allowed types: JPEG, PNG, WEBP, GIF' },
            { status: 400 }
          );
        }

        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
          return NextResponse.json(
            { error: 'Image too large. Maximum size: 5MB' },
            { status: 400 }
          );
        }

        const fileName = `${user.id}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
        const storageClient: any = supabaseAdmin && supabaseAdmin.storage ? supabaseAdmin : supabase;

        let uploadBody: any = file;
        try {
          if (typeof file.arrayBuffer === 'function') {
            const ab = await file.arrayBuffer();
            uploadBody = Buffer.from(ab);
          }
        } catch (convErr) {
          console.warn('[API Menu PUT] Could not convert file to buffer:', convErr);
        }

        const { error: uploadError } = await storageClient.storage
          .from('menu_image')
          .upload(fileName, uploadBody, { contentType: file.type });

        if (uploadError) {
          console.error('[API Menu PUT] Storage upload error:', uploadError);
          throw uploadError;
        }

        const { data: urlData } = storageClient.storage
          .from('menu_image')
          .getPublicUrl(fileName);

        updates.image_url = urlData.publicUrl;
      }

      const updatedItem = await updateMenuItem(user.id, itemId, updates);
      return NextResponse.json({ success: true, data: updatedItem }, { status: 200 });
    }

    if (contentType.includes('application/json')) {
      const body = await request.json();
      const updatedItem = await updateMenuItem(user.id, itemId, body);
      return NextResponse.json({ success: true, data: updatedItem }, { status: 200 });
    }

    // Default fallback to toggle status if no form-data or JSON body is provided
    const updatedItem = await toggleMenuItemStatus(user.id, itemId);
    return NextResponse.json({ success: true, data: updatedItem }, { status: 200 });
  } catch (error: any) {
    console.error('[API Menu PUT] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update menu item' }, { status: 500 });
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
