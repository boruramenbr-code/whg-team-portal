import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/owner-messages
 * Returns all currently active owner messages where today is within [start_date, end_date].
 * Any authenticated user can read.
 */
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const today = new Date().toISOString().split('T')[0];

  const { data: messages, error } = await supabase
    .from('owner_messages')
    .select('*')
    .eq('is_active', true)
    .lte('start_date', today)
    .gte('end_date', today)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch owner messages:', error.message);
    return NextResponse.json({ messages: [] }, { headers: { 'Cache-Control': 'no-store' } });
  }

  return NextResponse.json(
    { messages: messages || [] },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

/**
 * GET all messages (including inactive/expired) — admin only.
 * Separate endpoint: /api/owner-messages/all
 * Not implemented here; admin editor uses GET above for current state.
 */

/**
 * POST /api/owner-messages
 * Create a new owner message. Admin only.
 * Body: { message, startDate, endDate }
 */
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Only admins can post owner messages' }, { status: 403 });
  }

  const body = await req.json();
  const { message, startDate, endDate, id } = body;

  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  const today = new Date().toISOString().split('T')[0];
  const start = startDate || today;
  const end = endDate || start;

  if (end < start) {
    return NextResponse.json({ error: 'End date must be on or after start date' }, { status: 400 });
  }

  // If id is provided, update; otherwise insert.
  if (id) {
    const { data: updated, error } = await supabase
      .from('owner_messages')
      .update({
        message: message.trim(),
        start_date: start,
        end_date: end,
        is_active: true,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update owner message:', error.message);
      return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
    }
    return NextResponse.json({ message: updated });
  }

  const { data: created, error } = await supabase
    .from('owner_messages')
    .insert({
      message: message.trim(),
      start_date: start,
      end_date: end,
      created_by: user.id,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create owner message:', error.message);
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
  }

  return NextResponse.json({ message: created });
}

/**
 * DELETE /api/owner-messages?id=UUID
 * Soft-delete (set is_active = false). Admin only.
 */
export async function DELETE(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Only admins can delete owner messages' }, { status: 403 });
  }

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const { error } = await supabase
    .from('owner_messages')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
