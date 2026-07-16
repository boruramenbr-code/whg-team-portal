import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const MANAGER_ROLES = ['admin', 'manager', 'assistant_manager'];

/**
 * POST   /api/training/floor-ready  { user_id, note? }  — grant override
 * DELETE /api/training/floor-ready  { user_id }         — revoke override
 *
 * Randy's Phase C fairness rule: he or a manager can make the judgment
 * call that someone is Floor-Ready (or pull it back) regardless of
 * module completion. Every grant records WHO made the call — judgment
 * stays accountable, never invisible. Manager+ only, scoped to staff
 * at restaurants they can access.
 */
async function handle(req: NextRequest, action: 'grant' | 'revoke') {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: me } = await supabase
    .from('profiles')
    .select('role, restaurant_id, status')
    .eq('id', user.id)
    .single();
  if (!me || me.status === 'archived' || !MANAGER_ROLES.includes(me.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const targetId: string | null = body.user_id || null;
  if (!targetId) return NextResponse.json({ error: 'user_id is required' }, { status: 400 });

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Scope: non-admin managers may only act on staff at their restaurants.
  const { data: target } = await adminClient
    .from('profiles').select('id, restaurant_id').eq('id', targetId).single();
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if (me.role !== 'admin' && target.restaurant_id !== me.restaurant_id) {
    const { data: extra } = await supabase
      .from('user_locations')
      .select('restaurant_id')
      .eq('profile_id', user.id)
      .eq('restaurant_id', target.restaurant_id)
      .maybeSingle();
    if (!extra) return NextResponse.json({ error: 'Access denied for this restaurant' }, { status: 403 });
  }

  if (action === 'revoke') {
    const { error } = await adminClient.from('floor_ready_overrides').delete().eq('user_id', targetId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  }

  const { error } = await adminClient
    .from('floor_ready_overrides')
    .upsert(
      {
        user_id: targetId,
        granted_by: user.id,
        note: typeof body.note === 'string' && body.note.trim() ? body.note.trim() : null,
        created_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}

export async function POST(req: NextRequest) { return handle(req, 'grant'); }
export async function DELETE(req: NextRequest) { return handle(req, 'revoke'); }
