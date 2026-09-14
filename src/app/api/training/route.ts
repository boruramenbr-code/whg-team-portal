import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { pingLastSeen } from '@/lib/last-seen';

export const dynamic = 'force-dynamic';

const BASE_SERIES_COLUMNS = 'id, title, blurb, sort_order, audience';
const BASE_VIDEO_COLUMNS = 'id, title, description, youtube_id, duration, sort_order, active';

/**
 * GET /api/training
 *
 * Read-only employee view. Returns active series with their active videos,
 * sorted by sort_order. One round trip — videos are embedded under each
 * series in the response. Manager-only series reach management alone (this
 * route filters; RLS enforces it too after migration 080).
 *
 * Response shape:
 *   { series: [
 *       { id, title, blurb, sort_order, audience, pillar,
 *         videos: [{ id, title, description, youtube_id, duration, sort_order,
 *                    last_reviewed_at, review_due_at, sources }] },
 *       ...
 *     ]
 *   }
 */
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Adoption tracker: stamp last_seen_at — same pattern as other read routes.
  pingLastSeen(user.id);

  // Manager-only series (audience = 'mgmt') are visible to management
  // roles and the mgmt onboarding category only.
  const { data: me } = await supabase
    .from('profiles')
    .select('role, onboarding_category')
    .eq('id', user.id)
    .single();
  const isMgmt =
    ['admin', 'manager', 'assistant_manager'].includes(me?.role ?? '') ||
    me?.onboarding_category === 'mgmt';

  const query = (seriesColumns: string, videoColumns: string) =>
    supabase
      .from('training_series')
      .select(`${seriesColumns}, videos:training_videos(${videoColumns})`)
      .eq('active', true)
      .order('sort_order', { ascending: true });

  // Pillar + review columns arrived in migration 080 — fall back cleanly.
  let result = await query(
    `${BASE_SERIES_COLUMNS}, pillar`,
    `${BASE_VIDEO_COLUMNS}, last_reviewed_at, review_due_at, sources`
  );
  if (result.error) result = await query(BASE_SERIES_COLUMNS, BASE_VIDEO_COLUMNS);

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  // Filter videos to active + sort. Supabase doesn't let us order embedded
  // joins reliably across PostgREST versions, so we sort client-side here.
  type RawSeries = {
    id: string;
    title: string;
    blurb: string | null;
    sort_order: number;
    audience: 'all' | 'mgmt';
    pillar?: string | null;
    videos: {
      id: string; title: string; description: string | null;
      youtube_id: string; duration: string | null;
      sort_order: number; active: boolean;
      last_reviewed_at?: string | null; review_due_at?: string | null; sources?: string | null;
    }[] | null;
  };

  const series = ((result.data ?? []) as unknown as RawSeries[])
    .filter((s) => s.audience !== 'mgmt' || isMgmt)
    .map((s) => ({
    id: s.id,
    title: s.title,
    blurb: s.blurb,
    sort_order: s.sort_order,
    audience: s.audience,
    pillar: s.pillar ?? null,
    videos: (s.videos ?? [])
      .filter((v) => v.active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(({ active: _unused, ...rest }) => ({
        ...rest,
        last_reviewed_at: rest.last_reviewed_at ?? null,
        review_due_at: rest.review_due_at ?? null,
        sources: rest.sources ?? null,
      })),
  }));

  // Training content changes rarely once seeded. 60s browser cache keeps
  // tab swaps snappy without hiding new uploads for more than a minute.
  return NextResponse.json(
    { series },
    { headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=300' } }
  );
}
