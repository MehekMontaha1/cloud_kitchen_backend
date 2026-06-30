import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/lib/auth';
import { supabase, supabaseAdmin } from '@/app/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Use admin client to bypass RLS
    const { data: documents, error } = await supabaseAdmin
      .from('user_documents')
      .select('*')
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json(
      {
        success: true,
        data: documents || [],
        total: (documents || []).length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[Backend] Get documents route error:', error);

    return NextResponse.json(
      { error: error.message || 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('document_type') as string;

    if (!file || !documentType) {
      return NextResponse.json(
        { error: 'Missing required fields: file, document_type' },
        { status: 400 }
      );
    }

    // Validate file type (only allow images and PDFs for simplicity)
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed types: JPEG, PNG, PDF' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size: 5MB' },
        { status: 400 }
      );
    }

    // Upload file to Supabase Storage
    const fileName = `${user.id}/${documentType}_${Date.now()}`;

    // Prefer admin client (service role) for server-side uploads; fallback to anon client
    const storageClient: any = supabaseAdmin && supabaseAdmin.storage ? supabaseAdmin : supabase;

    // Convert File to a buffer/Uint8Array for server-side upload
    let uploadBody: any = file;
    try {
      // Some runtimes provide a File with arrayBuffer(); use it to build a Buffer
      if (typeof file.arrayBuffer === 'function') {
        const ab = await file.arrayBuffer();
        uploadBody = Buffer.from(ab);
      }
    } catch (convErr) {
      console.warn('[v0] Could not convert file to buffer, uploading raw file object:', convErr);
    }

    const { data: uploadData, error: uploadError } = await storageClient.storage
      .from('user-documents')
      .upload(fileName, uploadBody, { contentType: file.type });

    if (uploadError) throw uploadError;

    // Get public URL for the uploaded file
    const { data: urlData } = storageClient.storage
      .from('user-documents')
      .getPublicUrl(fileName);

    // Save document record to database (use admin client when available)
    const dbClient: any = supabaseAdmin && supabaseAdmin.from ? supabaseAdmin : supabase;

    const { data: docData, error: docError } = await dbClient
      .from('user_documents')
      .upsert(
        {
          user_id: user.id,
          document_type: documentType,
          document_url: urlData.publicUrl,
          uploaded_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,document_type' }
      )
      .select()
      .single();

    if (docError) {
      // Delete uploaded file if database insert fails
      try {
        await storageClient.storage.from('user-documents').remove([fileName]);
      } catch (rmErr) {
        console.error('[v0] Failed to remove uploaded file after DB error:', rmErr);
      }
      throw docError;
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Document uploaded successfully',
        data: docData,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[v0] Upload document route error:', error);

    return NextResponse.json(
      { error: error.message || 'Failed to upload document' },
      { status: 500 }
    );
  }
}
