import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { todayInCentralTime } from '@/lib/dates';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/new-hires
 * Returns staff who are currently featured in the home tab "Welcome to the
 * team" section — i.e. profiles whose `welcome_until` date is today or later.
 *
 * Default behavior: Add Member sets welcome_until = today + 30 days, so new
 * hires automatically appear for a month. Admin can also manually highlight
 * any active profile by setting welcome_until via the AdminPanel inline edit.
 *
 * Bulk-imported staff have welcome_until = NULL → never auto-featured.
 */
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: me } = await supabase
    .from('profiles')
    .select('role, restaurant_id')
    .eq('id', user.id)
    .single();

  if (!me) return NextResponse.json({ new_hires: [] });

  const today = todayInCentralTime();

  let query = supabase
    .from('profiles')
    .select('id, full_name, restaurant_id, role, created_at, welcome_until, restaurants(name)')
    .eq('status', 'active')
    .gte('welcome_until', today)
    .neq('id', user.id) // don't show self as new hire
    .order('created_at', { ascending: false })
    .limit(8);

  // Non-admins only see new hires at their own restaurant
  if (me.role !== 'admin' && me.restaurant_id) {
    query = query.eq('restaurant_id', me.restaurant_id);
  }

  const { data, error } = await query;
  if (error) {
    console.error('New hires fetch error:', error.message);
    return NextResponse.json({ new_hires: [] });
  }

  // Compute days_since (using created_at) for the spotlight label
  const now = new Date();
  const new_hires = (data || []).map((p) => {
    const created = new Date(p.created_at);
    const daysSince = Math.max(
      0,
      Math.round((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
    );
    return {
      id: p.id,
      full_name: p.full_name,
      role: p.role,
      restaurant_name: (p.restaurants as { name?: string } | null)?.name || null,
      days_since: daysSince,
    };
  });

  return NextResponse.json({ new_hires }, { headers: { 'Cache-Control': 'no-store' } });
}
