import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/lib/auth';
import { supabaseAdmin } from '@/app/lib/supabase';

export const config = { api: { bodyParser: false } };

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('photo') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No photo file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF allowed.' }, { status: 400 });
    }

    // Validate file size (max 5MB)
    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return NextResponse.json({ error: 'File too large. Maximum size is 5MB.' }, { status: 400 });
    }

    // Generate unique filename per user — overwrite old photo
    const ext = file.name.split('.').pop() || 'jpg';
    const filePath = `${user.id}/avatar.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload to Supabase storage bucket "profile-photos"
    const { error: uploadError } = await supabaseAdmin.storage
      .from('profile-photos')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true, // overwrite existing avatar
      });

    if (uploadError) {
      console.error('[Avatar Upload] Storage error:', uploadError);
      return NextResponse.json({ error: uploadError.message || 'Failed to upload photo' }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('profile-photos')
      .getPublicUrl(filePath);

    const publicUrl = urlData?.publicUrl;
    if (!publicUrl) {
      return NextResponse.json({ error: 'Failed to get public URL for uploaded photo' }, { status: 500 });
    }

    // Cache-bust URL to force browsers to reload new image
    const cachedUrl = `${publicUrl}?t=${Date.now()}`;

    // Save the URL to profiles table
    const { data: updatedProfile, error: dbError } = await supabaseAdmin
      .from('profiles')
      .update({ avatar_url: cachedUrl, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single();

    if (dbError) {
      console.error('[Avatar Upload] DB error:', dbError);
      return NextResponse.json({ error: dbError.message || 'Failed to save avatar URL' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: { avatar_url: cachedUrl, profile: updatedProfile },
    }, { status: 200 });

  } catch (error: any) {
    console.error('[Avatar Upload] Unexpected error:', error);
    return NextResponse.json({ error: error.message || 'Unexpected server error' }, { status: 500 });
  }
}
