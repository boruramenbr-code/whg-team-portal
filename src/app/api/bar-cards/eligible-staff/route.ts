import { createClient } from '@/lib/supabase-server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const MANAGER_ROLES = ['admin', 'manager', 'assistant_manager'];

/**
 * GET /api/bar-cards/eligible-staff?restaurant_id=<uuid>
 * Returns active profiles at the given restaurant for the bar card link picker.
 * Includes all roles (managers often serve alcohol too).
 * Manager+ access only — used by the BarCardsTab admin UI.
 */
export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, restaurant_id, status')
    .eq('id', user.id)
    .single();

  if (!profile || profile.status === 'archived' || !MANAGER_ROLES.includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const restaurantId = req.nextUrl.searchParams.get('restaurant_id');
  if (!restaurantId) {
    return NextResponse.json({ error: 'restaurant_id required' }, { status: 400 });
  }

  // Non-admin managers can only fetch staff for their own restaurant
  if (profile.role !== 'admin' && restaurantId !== profile.restaurant_id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data, error } = await admin
    .from('profiles')
    .select('id, full_name, role, requires_bar_card')
    .eq('restaurant_id', restaurantId)
    .eq('status', 'active')
    .order('full_name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ staff: data || [] }, { headers: { 'Cache-Control': 'no-store' } });
}
