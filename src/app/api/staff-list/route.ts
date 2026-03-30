import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

// Public endpoint — returns active staff names for a restaurant (used on the PIN login screen)
// Only returns employees (not managers/admins — they use the email/password login)
export async function GET(req: NextRequest) {
  const restaurantId = req.nextUrl.searchParams.get('restaurant_id');

  if (!restaurantId) {
    return Response.json({ error: 'restaurant_id is required' }, { status: 400 });
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data, error } = await admin
    .from('profiles')
    .select('id, full_name')
    .eq('restaurant_id', restaurantId)
    .eq('role', 'employee')
    .eq('status', 'active')
    .order('full_name');

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ staff: data });
}
