import { createClient } from '@/lib/supabase-server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * PATCH /api/positions/[id]
 *
 * Admin-only. Updates a position's catalog fields (name, emoji, sort_order,
 * active) and/or its per-restaurant description.
 *
 * Body:
 *   {
 *     // Catalog (brand-wide) fields — applied directly to positions:
 *     name?: string,
 *     emoji?: string,
 *     sort_order?: number,
 *     active?: boolean,
 *
 *     // Description fields — applied to position_descriptions:
 *     description?: string | null,
 *     restaurant_id?: uuid,   // required when description is provided
 *   }
 *
 * Description writes target the (position_id, restaurant_id) row in
 * position_descriptions. To remove a description, pass description=null.
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: me } = await supabase
    .from('profiles')
    .select('role, restaurant_id')
    .eq('id', user.id)
    .single();
  if (!me || me.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const body = await req.json();
  const adminClient = getAdminClient();

  // ── Catalog fields (positions table) ───────────────────────────────
  const catalogUpdates: Record<string, unknown> = {};
  if (typeof body.name === 'string' && body.name.trim()) catalogUpdates.name = body.name.trim();
  if (typeof body.emoji === 'string' && body.emoji.trim()) catalogUpdates.emoji = body.emoji.trim();
  if (typeof body.sort_order === 'number') catalogUpdates.sort_order = body.sort_order;
  if (typeof body.active === 'boolean') catalogUpdates.active = body.active;

  if (Object.keys(catalogUpdates).length > 0) {
    const { error } = await adminClient
      .from('positions')
      .update(catalogUpdates)
      .eq('id', params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // ── Per-restaurant description ─────────────────────────────────────
  // body.description: string sets/updates; null deletes; undefined skips.
  if (body.description !== undefined) {
    const restaurantId = body.restaurant_id || me.restaurant_id;
    if (!restaurantId) {
      return NextResponse.json({ error: 'restaurant_id required for description writes' }, { status: 400 });
    }

    if (body.description === null) {
      const { error } = await adminClient
        .from('position_descriptions')
        .delete()
        .eq('position_id', params.id)
        .eq('restaurant_id', restaurantId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else if (typeof body.description === 'string') {
      const { error } = await adminClient
        .from('position_descriptions')
        .upsert(
          {
            position_id: params.id,
            restaurant_id: restaurantId,
            description: body.description,
          },
          { onConflict: 'position_id,restaurant_id' }
        );
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // Return updated position
  const { data, error } = await adminClient
    .from('positions')
    .select('id, slug, name, emoji, department, sort_order, active')
    .eq('id', params.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ position: data });
}
