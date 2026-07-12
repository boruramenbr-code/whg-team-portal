import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const MANAGER_ROLES = ['admin', 'manager', 'assistant_manager'];

/** Standardized allergen keys — the only values accepted into allergens[].
 *  Phase B quiz auto-drafting depends on these staying canonical. */
const ALLERGEN_KEYS = [
  'shellfish', 'fish', 'soy', 'wheat', 'egg', 'dairy', 'peanut', 'tree_nut', 'sesame',
];

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

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

function cleanAllergens(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input.filter((a): a is string => typeof a === 'string' && ALLERGEN_KEYS.includes(a));
}

/** Text fields shared by POST and PATCH — all optional, trimmed, null when empty. */
const TEXT_FIELDS = [
  'name_es', 'description', 'description_es', 'ingredients', 'ingredients_es',
  'prep_notes', 'prep_notes_es', 'upsell_note', 'upsell_note_es', 'price',
  'pronunciation',
] as const;

/** is_raw: true/false/null. spice_level: 0-3 or null. */
function cleanTrainingFields(body: Record<string, unknown>, updates: Record<string, unknown>) {
  if (body.is_raw !== undefined) {
    updates.is_raw = typeof body.is_raw === 'boolean' ? body.is_raw : null;
  }
  if (body.spice_level !== undefined) {
    const n = Number(body.spice_level);
    updates.spice_level = Number.isInteger(n) && n >= 0 && n <= 3 ? n : null;
  }
}

/**
 * POST   /api/menu/items          Create an item (JSON — photo uploads separately)
 * PATCH  /api/menu/items?id=…     Update an item
 * DELETE /api/menu/items?id=…     Hard delete
 *
 * Manager+ only, restaurant-scoped. restaurant_id is derived from the
 * category server-side so the two can never disagree.
 */
export async function POST(req: NextRequest) {
  const auth = await ensureManagerWithScope();
  if (auth.error) return auth.error;

  const body = await req.json();
  const { category_id, name } = body;
  if (!category_id || !name?.trim()) {
    return NextResponse.json({ error: 'category_id and name are required' }, { status: 400 });
  }

  const adminClient = getAdminClient();
  const { data: category } = await adminClient
    .from('menu_categories')
    .select('restaurant_id')
    .eq('id', category_id)
    .single();
  if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 404 });
  if (!canWrite(auth.allowed!, category.restaurant_id)) {
    return NextResponse.json({ error: 'Access denied for this restaurant' }, { status: 403 });
  }

  const row: Record<string, unknown> = {
    category_id,
    restaurant_id: category.restaurant_id,
    name: name.trim(),
    allergens: cleanAllergens(body.allergens),
    sort_order: typeof body.sort_order === 'number' ? body.sort_order : 100,
  };
  for (const f of TEXT_FIELDS) {
    row[f] = typeof body[f] === 'string' && body[f].trim() ? body[f].trim() : null;
  }
  cleanTrainingFields(body, row);

  const { data, error } = await adminClient
    .from('menu_items')
    .insert(row)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ item: data });
}

export async function PATCH(req: NextRequest) {
  const auth = await ensureManagerWithScope();
  if (auth.error) return auth.error;

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const adminClient = getAdminClient();
  const { data: existing } = await adminClient
    .from('menu_items')
    .select('restaurant_id')
    .eq('id', id)
    .single();
  if (!existing) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  if (!canWrite(auth.allowed!, existing.restaurant_id)) {
    return NextResponse.json({ error: 'Access denied for this restaurant' }, { status: 403 });
  }

  const body = await req.json();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.name !== undefined) {
    if (!body.name?.trim()) return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
    updates.name = body.name.trim();
  }
  for (const f of TEXT_FIELDS) {
    if (body[f] !== undefined) {
      updates[f] = typeof body[f] === 'string' && body[f].trim() ? body[f].trim() : null;
    }
  }
  if (body.allergens !== undefined) updates.allergens = cleanAllergens(body.allergens);
  cleanTrainingFields(body, updates);
  if (body.sort_order !== undefined) updates.sort_order = body.sort_order;
  if (body.active !== undefined) updates.active = !!body.active;
  // Moving an item to another category re-derives restaurant_id so the
  // denormalized column can't drift.
  if (body.category_id !== undefined) {
    const { data: cat } = await adminClient
      .from('menu_categories')
      .select('restaurant_id')
      .eq('id', body.category_id)
      .single();
    if (!cat) return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    if (!canWrite(auth.allowed!, cat.restaurant_id)) {
      return NextResponse.json({ error: 'Access denied for this restaurant' }, { status: 403 });
    }
    updates.category_id = body.category_id;
    updates.restaurant_id = cat.restaurant_id;
  }

  const { error } = await adminClient.from('menu_items').update(updates).eq('id', id);
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
    .from('menu_items')
    .select('restaurant_id')
    .eq('id', id)
    .single();
  if (!existing) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  if (!canWrite(auth.allowed!, existing.restaurant_id)) {
    return NextResponse.json({ error: 'Access denied for this restaurant' }, { status: 403 });
  }

  const { error } = await adminClient.from('menu_items').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
