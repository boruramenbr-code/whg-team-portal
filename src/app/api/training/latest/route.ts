import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/training/latest
 *
 * Returns the single most recently created active video plus its parent
 * series title — used to render the "Latest Training" card on HomeTab.
 * Returns `{ video: null }` if no active videos exist anywhere so the
 * card can hide itself cleanly.
 */
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Pull the newest active video, scoped to active series.
  // Two queries instead of a single embed because PostgREST nested filters
  // on FK joins have historically dropped rows silently when the parent
  // doesn't match — pattern documented in feedback_supabase_fk_embeds.
  const { data: video, error: videoErr } = await supabase
    .from('training_videos')
    .select('id, title, description, youtube_id, duration, series_id, created_at')
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (videoErr) {
    return NextResponse.json({ error: videoErr.message }, { status: 500 });
  }
  if (!video) {
    return NextResponse.json({ video: null }, {
      headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=300' },
    });
  }

  const { data: series } = await supabase
    .from('training_series')
    .select('id, title, active')
    .eq('id', video.series_id)
    .maybeSingle();

  // If the parent series was archived, treat as "no latest" so we don't
  // surface a video whose series is hidden in the main Training tab.
  if (!series || !series.active) {
    return NextResponse.json({ video: null }, {
      headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=300' },
    });
  }

  return NextResponse.json(
    {
      video: {
        id: video.id,
        title: video.title,
        description: video.description,
        youtube_id: video.youtube_id,
        duration: video.duration,
        series_title: series.title,
      },
    },
    { headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=300' } }
  );
}
