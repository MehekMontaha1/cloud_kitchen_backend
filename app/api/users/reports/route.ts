import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/lib/auth';
import { supabaseAdmin } from '@/app/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: reports, error } = await supabaseAdmin
      .from('reports')
      .select('*')
      .eq('reporter_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data: reports || [] }, { status: 200 });
  } catch (error: any) {
    console.error('[API User Reports GET] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch your reports' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();

    if (!body.title || !body.description) {
      return NextResponse.json({ error: 'Missing required fields: title, description' }, { status: 400 });
    }

    const { data: report, error } = await supabaseAdmin
      .from('reports')
      .insert({
        reporter_id: user.id,
        title: body.title,
        description: body.description,
        status: 'open',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data: report }, { status: 201 });
  } catch (error: any) {
    console.error('[API User Reports POST] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit report' }, { status: 500 });
  }
}
