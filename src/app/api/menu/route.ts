import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { pingLastSeen } from '@/lib/last-seen';

export const dynamic = 'force-dynamic';

/**
 * GET /api/menu?restaurant_id=<uuid>
 *
 * Menu library for the Training → Menu sub-tab. Restaurant-scoped:
 *   - Employees: always their own restaurant (restaurant_id param ignored
 *     unless they have access to it).
 *   - Admins: any restaurant; multi-location managers: any assigned one.
 *
 * Returns categories with their items embedded (one round trip, like
 * /api/training) plus the accessible-restaurants list so admin/multi-
 * location views can render a switcher.
 *
 * Response:
 *   { restaurant_id, categories: [{ id, name, name_es, sort_order,
 *       items: [{ ...training card fields }] }],
 *     available_restaurants: [{ id, name }] }
 */
export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  pingLastSeen(user.id);

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, restaurant_id, status')
    .eq('id', user.id)
    .single();

  if (!profile || profile.status === 'archived') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Resolve which restaurants this user can view (mirrors /api/my-locations).
  let accessible: { id: string; name: string }[] = [];
  if (profile.role === 'admin') {
    const { data: all } = await supabase
      .from('restaurants')
      .select('id, name')
      .eq('is_active', true)
      .order('name');
    accessible = all || [];
  } else {
    const [{ data: own }, { data: extras }] = await Promise.all([
      profile.restaurant_id
        ? supabase.from('restaurants').select('id, name').eq('id', profile.restaurant_id).single()
        : Promise.resolve({ data: null }),
      supabase.from('user_locations').select('restaurant_id, restaurants(id, name)').eq('profile_id', user.id),
    ]);
    const map = new Map<string, { id: string; name: string }>();
    if (own) map.set(own.id, own);
    for (const e of extras || []) {
      const r = e.restaurants as unknown as { id: string; name: string } | null;
      if (r) map.set(r.id, r);
    }
    accessible = Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  const requested = req.nextUrl.searchParams.get('restaurant_id');
  const restaurantId =
    requested && accessible.some((r) => r.id === requested)
      ? requested
      : profile.restaurant_id || accessible[0]?.id || null;

  if (!restaurantId) {
    return NextResponse.json({ restaurant_id: null, categories: [], available_restaurants: accessible });
  }

  // RLS also enforces scoping — this request-bound client can only read
  // rows the user is allowed to see, so a forged param returns nothing.
  const { data, error } = await supabase
    .from('menu_categories')
    .select(`
      id, name, name_es, sort_order, active, is_knowledge,
      items:menu_items(
        id, name, name_es, description, description_es,
        ingredients, ingredients_es, allergens,
        prep_notes, prep_notes_es, upsell_note, upsell_note_es,
        price, photo_url, sort_order, active,
        pronunciation, is_raw, spice_level
      )
    `)
    .eq('restaurant_id', restaurantId)
    .eq('active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  type RawItem = {
    id: string; name: string; name_es: string | null;
    description: string | null; description_es: string | null;
    ingredients: string | null; ingredients_es: string | null;
    allergens: string[]; prep_notes: string | null; prep_notes_es: string | null;
    upsell_note: string | null; upsell_note_es: string | null;
    price: string | null; photo_url: string | null;
    sort_order: number; active: boolean;
    pronunciation: string | null; is_raw: boolean | null; spice_level: number | null;
  };
  type RawCategory = {
    id: string; name: string; name_es: string | null;
    sort_order: number; active: boolean; is_knowledge: boolean; items: RawItem[] | null;
  };

  // Sort embedded items client-side (PostgREST embedded ordering is
  // unreliable across versions — same note as /api/training).
  const categories = ((data ?? []) as RawCategory[]).map((c) => ({
    id: c.id,
    name: c.name,
    name_es: c.name_es,
    sort_order: c.sort_order,
    is_knowledge: c.is_knowledge,
    items: (c.items ?? [])
      .filter((i) => i.active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(({ active: _unused, ...rest }) => rest),
  }));

  // Menus change rarely outside a change-up. 60s browser cache keeps tab
  // swaps snappy without hiding edits for more than a minute.
  return NextResponse.json(
    { restaurant_id: restaurantId, categories, available_restaurants: accessible },
    { headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=300' } }
  );
}
