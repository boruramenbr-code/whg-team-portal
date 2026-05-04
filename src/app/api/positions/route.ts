import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/positions
 *
 * Returns the active position catalog SCOPED to the caller's restaurant.
 *
 * Visibility rule: a position appears for a given restaurant only if
 * a row exists in position_descriptions for (position_id, restaurant_id).
 * That keeps Boru staff from seeing Sushi Chef and vice versa.
 *
 * The returned `description` field is the per-restaurant override.
 * Positions without a description for the user's restaurant are filtered out.
 *
 * Optional override: ?restaurant_id=<uuid> lets admins preview a specific
 * restaurant's catalog (useful for content management and previewing).
 *
 * Pay rates are NOT included here — they live in /api/pay-rates (manager-only).
 */
export async function GET(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Resolve restaurant scope: query param wins (admin preview), else profile.
  const url = new URL(req.url);
  const queryRestaurant = url.searchParams.get('restaurant_id');

  const { data: me } = await supabase
    .from('profiles')
    .select('restaurant_id, role')
    .eq('id', user.id)
    .single();

  const restaurantId = queryRestaurant || me?.restaurant_id || null;

  // No restaurant context → return empty (e.g. archived user, missing assignment)
  if (!restaurantId) {
    return NextResponse.json({ positions: [], restaurant_id: null });
  }

  // Pull positions joined with their per-restaurant description.
  // Inner-join semantics: only positions that have a description for
  // this restaurant are returned. Achieved via filter on the joined col.
  const { data, error } = await supabase
    .from('positions')
    .select(`
      id, slug, name, emoji, department, sort_order,
      position_descriptions!inner(description, restaurant_id)
    `)
    .eq('active', true)
    .eq('position_descriptions.restaurant_id', restaurantId)
    .order('sort_order', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  type Row = {
    id: string;
    slug: string;
    name: string;
    emoji: string;
    department: string;
    sort_order: number;
    position_descriptions: { description: string; restaurant_id: string }[];
  };

  // Flatten: take the first matching description (should be exactly one
  // due to the unique constraint on (position_id, restaurant_id)).
  const positions = (data as unknown as Row[] | null || []).map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    emoji: p.emoji,
    department: p.department,
    sort_order: p.sort_order,
    description: p.position_descriptions?.[0]?.description || null,
  }));

  return NextResponse.json({ positions, restaurant_id: restaurantId });
}
