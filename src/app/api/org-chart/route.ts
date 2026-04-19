import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/org-chart?restaurant_id=<uuid>
 * Returns org chart positions for a given restaurant,
 * structured as a flat list (the client builds the tree).
 */
export async function GET(req: NextRequest) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const restaurantId = req.nextUrl.searchParams.get('restaurant_id');
  if (!restaurantId) {
    return NextResponse.json({ error: 'restaurant_id is required' }, { status: 400 });
  }

  const { data: positions, error } = await supabase
    .from('org_chart_positions')
    .select('id, first_name, last_initial, title, role_level, reports_to, photo_url, sort_order, detail')
    .eq('restaurant_id', restaurantId)
    .eq('active', true)
    .order('role_level', { ascending: true })
    .order('sort_order', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ positions: positions ?? [] });
}
