import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/new-hires
 * Returns staff who joined in the last 14 days. The home tab uses this to
 * render a "Welcome our newest teammates" section that auto-rotates off.
 *
 * Important: profiles created BEFORE the FEATURE_LIVE_AT timestamp are
 * excluded. This protects against the bulk-import day showing 96 "Welcome!"
 * cards. Going forward, every single-added profile will appear here for
 * exactly 14 days.
 */
const FEATURE_LIVE_AT = '2026-04-30T00:00:00Z';

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

  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  const cutoffISO = fourteenDaysAgo.toISOString();
  // Use whichever is later: 14-day window OR the feature-live timestamp
  const startISO = cutoffISO > FEATURE_LIVE_AT ? cutoffISO : FEATURE_LIVE_AT;

  let query = supabase
    .from('profiles')
    .select('id, full_name, restaurant_id, role, created_at, restaurants(name)')
    .eq('status', 'active')
    .gte('created_at', startISO)
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

  // Add days_since for display
  const today = new Date();
  const new_hires = (data || []).map((p) => {
    const created = new Date(p.created_at);
    const daysSince = Math.max(0, Math.round((today.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)));
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
