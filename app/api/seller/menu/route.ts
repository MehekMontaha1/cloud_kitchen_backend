import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/lib/auth';
import { getSellerMenu, addMenuItem } from '@/app/lib/seller';
import { supabaseAdmin, supabase } from '@/app/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (user.profile.role !== 'seller') {
      return NextResponse.json({ error: 'Access denied. Only sellers can view their menu.' }, { status: 403 });
    }

    const menu = await getSellerMenu(user.id);

    return NextResponse.json({ success: true, data: menu }, { status: 200 });
  } catch (error: any) {
    console.error('[API Menu GET] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch menu' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (user.profile.role !== 'seller') {
      return NextResponse.json({ error: 'Access denied. Only sellers can modify menu.' }, { status: 403 });
    }

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const priceStr = formData.get('price') as string;
    const stockStr = formData.get('stock') as string;
    const description = (formData.get('description') as string) || '';
    const file = formData.get('file') as File | null;

    if (!name || !priceStr) {
      return NextResponse.json({ error: 'Missing required fields: name, price' }, { status: 400 });
    }

    const price = Number(priceStr);
    const stock = stockStr ? Number(stockStr) : 50;

    if (isNaN(price) || price < 0) {
      return NextResponse.json({ error: 'Invalid price value' }, { status: 400 });
    }

    if (isNaN(stock) || stock < 0) {
      return NextResponse.json({ error: 'Invalid stock value' }, { status: 400 });
    }

    let imageUrl = '';

    // If an image file was provided, upload to Supabase Storage
    if (file && file.size > 0) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: 'Invalid image type. Allowed types: JPEG, PNG, WEBP, GIF' },
          { status: 400 }
        );
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: 'Image too large. Maximum size: 5MB' },
          { status: 400 }
        );
      }

      const fileName = `${user.id}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;

      // Prefer admin client for storage uploads; fallback to anon client
      const storageClient: any = supabaseAdmin && supabaseAdmin.storage ? supabaseAdmin : supabase;

      // Convert File to Buffer/Uint8Array for node environment upload
      let uploadBody: any = file;
      try {
        if (typeof file.arrayBuffer === 'function') {
          const ab = await file.arrayBuffer();
          uploadBody = Buffer.from(ab);
        }
      } catch (convErr) {
        console.warn('[API Menu POST] Could not convert file to buffer, uploading raw:', convErr);
      }

      const { data: uploadData, error: uploadError } = await storageClient.storage
        .from('menu_image')
        .upload(fileName, uploadBody, { contentType: file.type });

      if (uploadError) {
        console.error('[API Menu POST] Storage upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = storageClient.storage
        .from('menu_image')
        .getPublicUrl(fileName);

      imageUrl = urlData.publicUrl;
    }

    const newItem = await addMenuItem(user.id, {
      name: name,
      price: price,
      stock: stock,
      description: description,
      image_url: imageUrl || undefined,
    });

    return NextResponse.json({ success: true, data: newItem }, { status: 201 });
  } catch (error: any) {
    console.error('[API Menu POST] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to add menu item' }, { status: 500 });
  }
}
