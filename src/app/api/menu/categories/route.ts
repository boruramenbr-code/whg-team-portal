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

/**
 * Manager+ auth gate that also resolves which restaurants the caller may
 * write to. Admins: any. Others: primary restaurant + user_locations.
 */
async function ensureManagerWithScope() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, restaurant_id, status')
    .eq('id', user.id)
    .single();

  if (!profile || profile.status === 'archived' || !MANAGER_ROLES.includes(profile.role)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  let allowed: Set<string> | 'all';
  if (profile.role === 'admin') {
    allowed = 'all';
  } else {
    const { data: extras } = await supabase
      .from('user_locations')
      .select('restaurant_id')
      .eq('profile_id', user.id);
    allowed = new Set<string>(
      [profile.restaurant_id, ...(extras || []).map((e) => e.restaurant_id)].filter(Boolean) as string[]
    );
  }
  return { user, allowed };
}

function canWrite(allowed: Set<string> | 'all', restaurantId: string) {
  return allowed === 'all' || allowed.has(restaurantId);
}

/**
 * POST   /api/menu/categories          Create a category
 * PATCH  /api/menu/categories?id=…     Update a category
 * DELETE /api/menu/categories?id=…     Hard delete (cascades to items)
 *
 * Manager+ only, scoped to restaurants they can access. Writes use the
 * service-role client after the check (RLS-silent-fail pattern).
 */
export async function POST(req: NextRequest) {
  const auth = await ensureManagerWithScope();
  if (auth.error) return auth.error;

  const body = await req.json();
  const { restaurant_id, name, name_es, sort_order } = body;
  if (!restaurant_id || !name?.trim()) {
    return NextResponse.json({ error: 'restaurant_id and name are required' }, { status: 400 });
  }
  if (!canWrite(auth.allowed!, restaurant_id)) {
    return NextResponse.json({ error: 'Access denied for this restaurant' }, { status: 403 });
  }

  const { data, error } = await getAdminClient()
    .from('menu_categories')
    .insert({
      restaurant_id,
      name: name.trim(),
      name_es: name_es?.trim() || null,
      sort_order: typeof sort_order === 'number' ? sort_order : 100,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ category: data });
}

export async function PATCH(req: NextRequest) {
  const auth = await ensureManagerWithScope();
  if (auth.error) return auth.error;

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const adminClient = getAdminClient();
  const { data: existing } = await adminClient
    .from('menu_categories')
    .select('restaurant_id')
    .eq('id', id)
    .single();
  if (!existing) return NextResponse.json({ error: 'Category not found' }, { status: 404 });
  if (!canWrite(auth.allowed!, existing.restaurant_id)) {
    return NextResponse.json({ error: 'Access denied for this restaurant' }, { status: 403 });
  }

  const body = await req.json();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.name !== undefined) updates.name = body.name?.trim() || null;
  if (body.name_es !== undefined) updates.name_es = body.name_es?.trim() || null;
  if (body.sort_order !== undefined) updates.sort_order = body.sort_order;
  if (body.active !== undefined) updates.active = !!body.active;

  const { error } = await adminClient.from('menu_categories').update(updates).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const auth = await ensureManagerWithScope();
  if (auth.error) return auth.error;

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const adminClient = getAdminClient();
  const { data: existing } = await adminClient
    .from('menu_categories')
    .select('restaurant_id')
    .eq('id', id)
    .single();
  if (!existing) return NextResponse.json({ error: 'Category not found' }, { status: 404 });
  if (!canWrite(auth.allowed!, existing.restaurant_id)) {
    return NextResponse.json({ error: 'Access denied for this restaurant' }, { status: 403 });
  }

  const { error } = await adminClient.from('menu_categories').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
