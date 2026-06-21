import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const MANAGER_ROLES = ['admin', 'manager', 'assistant_manager'];

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function ensureManager() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .single();

  if (!profile || profile.status === 'archived' || !MANAGER_ROLES.includes(profile.role)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { user };
}

/**
 * POST /api/training/series        Create a series
 * PATCH /api/training/series?id=…  Update a series
 * DELETE /api/training/series?id=… Hard delete (cascades to videos)
 *
 * Manager+ only. Uses the service-role client for writes so RLS doesn't
 * silently swallow updates — we've already verified the manager role.
 */
export async function POST(req: NextRequest) {
  const auth = await ensureManager();
  if (auth.error) return auth.error;

  const body = await req.json();
  const { title, blurb, sort_order } = body;
  if (!title?.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  const adminClient = getAdminClient();
  const { data, error } = await adminClient
    .from('training_series')
    .insert({
      title: title.trim(),
      blurb: blurb?.trim() || null,
      sort_order: typeof sort_order === 'number' ? sort_order : 100,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ series: data });
}

export async function PATCH(req: NextRequest) {
  const auth = await ensureManager();
  if (auth.error) return auth.error;

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const body = await req.json();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.title !== undefined) updates.title = body.title?.trim() || null;
  if (body.blurb !== undefined) updates.blurb = body.blurb?.trim() || null;
  if (body.sort_order !== undefined) updates.sort_order = body.sort_order;
  if (body.active !== undefined) updates.active = !!body.active;

  const adminClient = getAdminClient();
  const { error } = await adminClient
    .from('training_series')
    .update(updates)
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const auth = await ensureManager();
  if (auth.error) return auth.error;

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const adminClient = getAdminClient();
  const { error } = await adminClient
    .from('training_series')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
