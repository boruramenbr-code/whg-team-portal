import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const MANAGER_ROLES = ['admin', 'manager', 'assistant_manager'];
const ZONES = ['menu', 'systems', 'academy'];
const PILLAR_KEYS = ['leadership', 'operations', 'administration'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

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

/** restaurantId null = a brand-wide section (every restaurant) — admins only. */
function canWrite(allowed: Set<string> | 'all', restaurantId: string | null) {
  return allowed === 'all' || (restaurantId !== null && allowed.has(restaurantId));
}

/**
 * Where it shows, who sees it, pillar, and review info — shared by POST and
 * PATCH (Manager Academy, migration 080). Academy sections are always
 * managers-only, and lesson sections count as study sections so they stay
 * out of the menu photo test. Returns an error message, or null.
 */
function applyLessonFields(body: Record<string, unknown>, row: Record<string, unknown>): string | null {
  if (body.zone !== undefined) {
    if (!ZONES.includes(body.zone as string)) return 'Unknown section type.';
    row.zone = body.zone;
    if (body.zone !== 'menu') row.is_knowledge = true;
  }
  if (body.audience !== undefined) row.audience = body.audience === 'mgmt' ? 'mgmt' : 'all';
  if (row.zone === 'academy') row.audience = 'mgmt';
  if (body.pillar !== undefined) {
    row.pillar = PILLAR_KEYS.includes(body.pillar as string) ? body.pillar : null;
  }
  for (const f of ['last_reviewed_at', 'review_due_at'] as const) {
    if (body[f] === undefined) continue;
    const v = typeof body[f] === 'string' ? (body[f] as string).trim() : '';
    if (v && !DATE_RE.test(v)) return 'Dates must look like 2026-09-13.';
    row[f] = v || null;
  }
  if (body.version !== undefined) {
    const n = Number(body.version);
    if (!Number.isInteger(n) || n < 1) return 'Version must be a whole number, 1 or more.';
    row.version = n;
  }
  if (body.sources !== undefined) {
    row.sources = typeof body.sources === 'string' && body.sources.trim() ? body.sources.trim() : null;
  }
  return null;
}

/**
 * POST   /api/menu/categories          Create a category
 * PATCH  /api/menu/categories?id=…     Update a category
 * DELETE /api/menu/categories?id=…     Hard delete (cascades to items)
 *
 * Manager+ only, scoped to restaurants they can access. scope: 'all'
 * creates (or moves) a brand-wide section — admins only. Writes use the
 * service-role client after the check (RLS-silent-fail pattern).
 */
export async function POST(req: NextRequest) {
  const auth = await ensureManagerWithScope();
  if (auth.error) return auth.error;

  const body = await req.json();
  const { name, name_es, sort_order } = body;
  const restaurantId: string | null = body.scope === 'all' ? null : body.restaurant_id || null;
  if ((body.scope !== 'all' && !restaurantId) || !name?.trim()) {
    return NextResponse.json({ error: 'restaurant_id and name are required' }, { status: 400 });
  }
  if (!canWrite(auth.allowed!, restaurantId)) {
    return NextResponse.json(
      { error: restaurantId ? 'Access denied for this restaurant' : 'Only the owner can create sections for every restaurant.' },
      { status: 403 }
    );
  }

  const row: Record<string, unknown> = {
    restaurant_id: restaurantId,
    name: name.trim(),
    name_es: name_es?.trim() || null,
    sort_order: typeof sort_order === 'number' ? sort_order : 100,
  };
  const lessonError = applyLessonFields(body, row);
  if (lessonError) return NextResponse.json({ error: lessonError }, { status: 400 });

  const { data, error } = await getAdminClient()
    .from('menu_categories')
    .insert(row)
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
  const lessonError = applyLessonFields(body, updates);
  if (lessonError) return NextResponse.json({ error: lessonError }, { status: 400 });

  // Moving between one restaurant and every restaurant.
  let movedTo: string | null | undefined;
  if (body.scope !== undefined) {
    const target: string | null = body.scope === 'all' ? null : body.restaurant_id || existing.restaurant_id;
    if (target !== existing.restaurant_id) {
      if (!canWrite(auth.allowed!, target)) {
        return NextResponse.json({ error: 'Only the owner can make a section brand-wide.' }, { status: 403 });
      }
      updates.restaurant_id = target;
      movedTo = target;
    }
  }

  const { error } = await adminClient.from('menu_categories').update(updates).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Cards carry a denormalized restaurant_id that read policies check —
  // keep it in step with the section.
  if (movedTo !== undefined) {
    const { error: itemsError } = await adminClient
      .from('menu_items')
      .update({ restaurant_id: movedTo })
      .eq('category_id', id);
    if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 400 });
  }
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
