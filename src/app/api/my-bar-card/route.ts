import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/my-bar-card
 * Returns the current user's bar card status. Used by the home tab widget.
 *
 * Response shape:
 *   {
 *     requires: boolean,                          // profiles.requires_bar_card
 *     status: 'missing' | 'expired' | 'critical' | 'expiring' | 'valid' | 'not_required',
 *     card: { expiration_date, image_url } | null,
 *     days_until: number | null,                  // negative if expired, null if missing
 *   }
 *
 * Status thresholds:
 *   missing   — requires bar card but no active card on file
 *   expired   — days_until < 0
 *   critical  — 0 ≤ days_until ≤ 7
 *   expiring  — 8 ≤ days_until ≤ 30
 *   valid     — days_until > 30
 *   not_required — requires_bar_card is false
 */
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('requires_bar_card, status, role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.status === 'archived') {
    return NextResponse.json({ requires: false, role: null, status: 'not_required', card: null, days_until: null });
  }

  if (!profile.requires_bar_card) {
    return NextResponse.json({ requires: false, role: profile.role, status: 'not_required', card: null, days_until: null });
  }

  // Latest active card for this profile (most recent expiration_date wins —
  // covers the renewal case where staff has an old expired card + new fresh one)
  const { data: card } = await supabase
    .from('bar_cards')
    .select('id, expiration_date, card_image_url')
    .eq('profile_id', user.id)
    .eq('archived', false)
    .order('expiration_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!card) {
    return NextResponse.json({
      requires: true,
      status: 'missing',
      card: null,
      days_until: null,
    });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(card.expiration_date + 'T00:00:00');
  const days_until = Math.round((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  let status: 'expired' | 'critical' | 'expiring' | 'valid';
  if (days_until < 0) status = 'expired';
  else if (days_until <= 7) status = 'critical';
  else if (days_until <= 30) status = 'expiring';
  else status = 'valid';

  return NextResponse.json(
    {
      requires: true,
      role: profile.role,
      status,
      card: {
        expiration_date: card.expiration_date,
        image_url: card.card_image_url,
      },
      days_until,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
