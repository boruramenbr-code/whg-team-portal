import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/owner-messages/all
 * Admin only. Returns all non-deleted owner messages (past, current, future).
 */
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const { data: messages, error } = await supabase
    .from('owner_messages')
    .select('*')
    .eq('is_active', true)
    .order('end_date', { ascending: false });

  if (error) {
    return NextResponse.json({ messages: [] }, { headers: { 'Cache-Control': 'no-store' } });
  }

  return NextResponse.json(
    { messages: messages || [] },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
