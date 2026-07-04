import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/lib/auth';
import { supabaseAdmin } from '@/app/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: messages, error } = await supabaseAdmin
      .from('messages')
      .select(`
        *,
        sender:profiles!sender_id(full_name, role),
        receiver:profiles!receiver_id(full_name, role)
      `)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const mapped = (messages || []).map((m: any) => ({
      id: m.id,
      from: m.sender_id === user.id ? 'customer' : 'seller',
      sender: m.sender_id === user.id ? 'You' : (m.sender?.full_name || 'Kitchen'),
      text: m.text,
      timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }));

    return NextResponse.json({ success: true, data: mapped }, { status: 200 });
  } catch (error: any) {
    console.error('[API Customer Messages GET] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch customer messages' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    if (!body.text) {
      return NextResponse.json({ error: 'Message text is required' }, { status: 400 });
    }

    // Find any seller to send message to, or receiver_id if provided
    let receiverId = body.receiver_id;
    if (!receiverId) {
      const { data: sellers } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('role', 'seller')
        .limit(1);

      if (sellers && sellers.length > 0) {
        receiverId = sellers[0].id;
      } else {
        receiverId = user.id; // Fallback self
      }
    }

    const { data: message, error } = await supabaseAdmin
      .from('messages')
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
        text: body.text,
        unread: true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data: message }, { status: 201 });
  } catch (error: any) {
    console.error('[API Customer Messages POST] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send message' }, { status: 500 });
  }
}
