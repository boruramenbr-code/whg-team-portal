import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/positions
 *
 * Returns the active position catalog grouped by department.
 * Visible to any authenticated employee — descriptions are
 * intended to help staff understand other roles for cross-training,
 * career growth, and onboarding.
 *
 * Pay rates are NOT included here. Pay info lives in /api/pay-rates
 * and is restricted to manager+ roles.
 */
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('positions')
    .select('id, slug, name, emoji, department, description, sort_order')
    .eq('active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ positions: data || [] });
}
