import { createClient } from '@/lib/supabase-server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * GET /api/admin/manager-locations?profile_id=<uuid>
 * Returns the extra locations assigned to a specific manager.
 * Admin only.
 */
export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: me } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!me || me.role !== 'admin') {
    return Response.json({ error: 'Admin only' }, { status: 403 });
  }

  const profileId = req.nextUrl.searchParams.get('profile_id');
  if (!profileId) {
    return Response.json({ error: 'profile_id required' }, { status: 400 });
  }

  const adminClient = getAdminClient();
  const { data, error } = await adminClient
    .from('manager_locations')
    .select('id, restaurant_id, restaurants(id, name, slug)')
    .eq('profile_id', profileId);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ locations: data || [] });
}

/**
 * POST /api/admin/manager-locations
 * Assign a manager to an additional restaurant location.
 * Body: { profile_id, restaurant_id }
 * Admin only.
 */
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: me } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!me || me.role !== 'admin') {
    return Response.json({ error: 'Admin only' }, { status: 403 });
  }

  const body = await req.json();
  const { profile_id, restaurant_id } = body;

  if (!profile_id || !restaurant_id) {
    return Response.json({ error: 'profile_id and restaurant_id required' }, { status: 400 });
  }

  const adminClient = getAdminClient();

  // Verify target is a manager/assistant_manager
  const { data: target } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', profile_id)
    .single();

  if (!target || !['manager', 'assistant_manager'].includes(target.role)) {
    return Response.json({ error: 'Can only assign locations to managers' }, { status: 400 });
  }

  const { error } = await adminClient
    .from('manager_locations')
    .insert({ profile_id, restaurant_id });

  if (error) {
    if (error.code === '23505') {
      return Response.json({ error: 'Location already assigned' }, { status: 409 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true }, { status: 201 });
}

/**
 * DELETE /api/admin/manager-locations
 * Remove a manager's access to a restaurant location.
 * Body: { profile_id, restaurant_id }
 * Admin only.
 */
export async function DELETE(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: me } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!me || me.role !== 'admin') {
    return Response.json({ error: 'Admin only' }, { status: 403 });
  }

  const body = await req.json();
  const { profile_id, restaurant_id } = body;

  if (!profile_id || !restaurant_id) {
    return Response.json({ error: 'profile_id and restaurant_id required' }, { status: 400 });
  }

  const adminClient = getAdminClient();
  const { error } = await adminClient
    .from('manager_locations')
    .delete()
    .eq('profile_id', profile_id)
    .eq('restaurant_id', restaurant_id);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ success: true });
}
