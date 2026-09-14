import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/training/latest
 *
 * Returns the most recently created active video this person may see, plus
 * its parent series title — used to render the "Latest Training" card on
 * HomeTab. Manager-only series never surface for staff (RLS enforces it too
 * after migration 080). Returns `{ video: null }` if nothing qualifies so
 * the card can hide itself cleanly.
 */
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: me } = await supabase
    .from('profiles')
    .select('role, onboarding_category')
    .eq('id', user.id)
    .single();
  const isMgmt =
    ['admin', 'manager', 'assistant_manager'].includes(me?.role ?? '') ||
    me?.onboarding_category === 'mgmt';

  // Newest few active videos, then the first whose series is live and
  // visible to this person. Two queries instead of a single embed because
  // PostgREST nested filters on FK joins have historically dropped rows
  // silently when the parent doesn't match — pattern documented in
  // feedback_supabase_fk_embeds.
  const { data: videos, error: videoErr } = await supabase
    .from('training_videos')
    .select('id, title, description, youtube_id, duration, series_id, created_at')
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(20);

  if (videoErr) {
    return NextResponse.json({ error: videoErr.message }, { status: 500 });
  }

  const seriesIds = Array.from(new Set((videos ?? []).map((v) => v.series_id)));
  const { data: seriesRows } = seriesIds.length
    ? await supabase.from('training_series').select('id, title, active, audience').in('id', seriesIds)
    : { data: [] as { id: string; title: string; active: boolean; audience: string }[] };
  const seriesById = new Map((seriesRows ?? []).map((s) => [s.id, s]));

  // Archived series stay hidden, like the main Training tab.
  const pick = (videos ?? []).find((v) => {
    const s = seriesById.get(v.series_id);
    return !!s && s.active && (s.audience !== 'mgmt' || isMgmt);
  });
  const series = pick ? seriesById.get(pick.series_id) : null;

  if (!pick || !series) {
    return NextResponse.json({ video: null }, {
      headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=300' },
    });
  }

  return NextResponse.json(
    {
      video: {
        id: pick.id,
        title: pick.title,
        description: pick.description,
        youtube_id: pick.youtube_id,
        duration: pick.duration,
        series_title: series.title,
      },
    },
    { headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=300' } }
  );
}
