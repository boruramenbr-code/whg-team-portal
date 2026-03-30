import { createClient as createAdminClient } from '@supabase/supabase-js';

// Public endpoint — no auth required (used on the login screen before sign-in)
export async function GET() {
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data, error } = await admin
    .from('restaurants')
    .select('id, name, slug')
    .not('is_active', 'eq', false)
    .order('name');

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ restaurants: data });
}
