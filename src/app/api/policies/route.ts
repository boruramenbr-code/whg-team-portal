import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { decoratePoliciesWithStatus, filterPoliciesForUser, groupPoliciesForDisplay } from '@/lib/policies';
import type { Policy } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/policies
 * Returns the policies the current user is required to see, plus their
 * signature status on each, grouped for the Policies sub-tab.
 */
export async function GET() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, restaurant_id, status')
    .eq('id', user.id)
    .single();

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  if (profile.status === 'archived') return NextResponse.json({ error: 'Account archived' }, { status: 403 });

  const { data: policies, error } = await supabase
    .from('policies')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const applicable = filterPoliciesForUser((policies ?? []) as Policy[], {
    role: profile.role,
    restaurant_id: profile.restaurant_id,
  });

  const { data: sigs } = await supabase
    .from('policy_signatures')
    .select('policy_id, policy_version, signed_at')
    .eq('user_id', user.id);

  const decorated = decoratePoliciesWithStatus(applicable, sigs ?? []);
  const grouped = groupPoliciesForDisplay(decorated);

  const total = decorated.filter((p) => p.kind === 'policy').length;
  const signed = decorated.filter((p) => p.kind === 'policy' && p.signed).length;

  return NextResponse.json({
    policies: decorated,
    grouped,
    progress: {
      total,
      signed,
      remaining: total - signed,
    },
    role: profile.role,
  });
}
