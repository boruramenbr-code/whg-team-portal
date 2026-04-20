import { createClient } from '@/lib/supabase-server';

/**
 * GET /api/my-locations
 * Returns the restaurants the current user can access:
 *  - Employees: just their assigned restaurant
 *  - Managers / Asst. Managers: their primary restaurant + any extras from manager_locations
 *  - Admins: all active restaurants
 */
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, restaurant_id, restaurants(id, name, slug)')
    .eq('id', user.id)
    .single();

  if (!profile) return Response.json({ error: 'Profile not found' }, { status: 404 });

  // Admin: return all active restaurants
  if (profile.role === 'admin') {
    const { data: all } = await supabase
      .from('restaurants')
      .select('id, name, slug')
      .eq('is_active', true)
      .order('name');

    return Response.json({ locations: all || [] });
  }

  // Manager / Asst. Manager: primary + assigned extras
  if (profile.role === 'manager' || profile.role === 'assistant_manager') {
    // Get extra assigned locations
    const { data: extras } = await supabase
      .from('manager_locations')
      .select('restaurant_id, restaurants(id, name, slug)')
      .eq('profile_id', user.id);

    const locationMap = new Map<string, { id: string; name: string; slug: string }>();

    // Add primary restaurant
    const primary = profile.restaurants as unknown as { id: string; name: string; slug: string } | null;
    if (primary) {
      locationMap.set(primary.id, primary);
    }

    // Add extras
    if (extras) {
      for (const e of extras) {
        const r = e.restaurants as unknown as { id: string; name: string; slug: string } | null;
        if (r && !locationMap.has(r.id)) {
          locationMap.set(r.id, r);
        }
      }
    }

    const locations = Array.from(locationMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    return Response.json({ locations });
  }

  // Employee: just their restaurant
  const primary = profile.restaurants as unknown as { id: string; name: string; slug: string } | null;
  return Response.json({ locations: primary ? [primary] : [] });
}
