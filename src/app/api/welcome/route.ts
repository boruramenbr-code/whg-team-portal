import { createClient } from '@/lib/supabase-server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * GET /api/welcome
 * Returns the active welcome message (EN + ES) and whether the current user
 * has dismissed it. Used by HomeTab to decide whether to show the modal.
 */
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Two independent reads — fire in parallel.
  const [msgRes, profileRes] = await Promise.all([
    supabase
      .from('welcome_messages')
      .select('id, content, content_es, updated_at')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('profiles')
      .select('welcome_dismissed_at, preferred_language')
      .eq('id', user.id)
      .single(),
  ]);
  const msg = msgRes.data;
  const profile = profileRes.data;

  return NextResponse.json(
    {
      message: msg || null,
      dismissed: !!profile?.welcome_dismissed_at,
      preferred_language: profile?.preferred_language || 'en',
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

/**
 * PATCH /api/welcome
 * Admin-only. Updates the active welcome message (EN + ES).
 * Body: { content, content_es }
 *
 * Strategy: insert a new active row and deactivate the old one. Keeps history
 * for audit, lets us re-show to staff in the future if needed.
 */
export async function PATCH(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // Welcome note is editable by managers, assistant managers, and admins.
  // Single canonical message — last write wins. If conflicts become an issue,
  // we can tighten back to admin-only later.
  if (!profile || !['admin', 'manager', 'assistant_manager'].includes(profile.role)) {
    return NextResponse.json({ error: 'Only managers and admins can edit the welcome note' }, { status: 403 });
  }

  const { content, content_es } = await req.json();
  if (!content?.trim()) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 });
  }

  const adminClient = getAdminClient();

  // Deactivate previous, insert new.
  await adminClient.from('welcome_messages').update({ is_active: false }).eq('is_active', true);

  const { data: created, error } = await adminClient
    .from('welcome_messages')
    .insert({
      content: content.trim(),
      content_es: content_es?.trim() || null,
      is_active: true,
      updated_by: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to update welcome message:', error.message);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }

  return NextResponse.json({ message: created });
}
