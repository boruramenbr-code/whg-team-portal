import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const MANAGER_ROLES = ['admin', 'manager', 'assistant_manager'];

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * Extracts an 11-character YouTube video ID from any common URL shape.
 * Accepts:
 *   • Bare 11-char ID                              "dQw4w9WgXcQ"
 *   • youtu.be/<id>                                 "https://youtu.be/dQw4w9WgXcQ"
 *   • youtube.com/watch?v=<id>                      "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
 *   • youtube.com/embed/<id>                        "https://www.youtube.com/embed/dQw4w9WgXcQ"
 *   • youtube.com/shorts/<id>                       "https://www.youtube.com/shorts/dQw4w9WgXcQ"
 * Returns null if no valid ID can be extracted.
 */
function parseYouTubeId(raw: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();

  // Bare ID already
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  // Try parsing as URL
  try {
    const u = new URL(trimmed);
    const host = u.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      const id = u.pathname.replace(/^\//, '').split('/')[0];
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      // /watch?v=<id>
      const v = u.searchParams.get('v');
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
      // /embed/<id> or /shorts/<id>
      const segments = u.pathname.split('/').filter(Boolean);
      if (segments.length >= 2 && (segments[0] === 'embed' || segments[0] === 'shorts')) {
        const id = segments[1];
        if (/^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
      }
    }
  } catch {
    // Not a URL — fall through
  }
  return null;
}

async function ensureManager() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .single();

  if (!profile || profile.status === 'archived' || !MANAGER_ROLES.includes(profile.role)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { user };
}

/**
 * POST /api/training/videos        Create a video
 * PATCH /api/training/videos?id=…  Update a video
 * DELETE /api/training/videos?id=… Hard delete
 *
 * Body for POST: { series_id, title, description?, youtube_url, duration?, sort_order? }
 *   youtube_url accepts any common YouTube URL or a bare 11-char ID.
 */
export async function POST(req: NextRequest) {
  const auth = await ensureManager();
  if (auth.error) return auth.error;

  const body = await req.json();
  const { series_id, title, description, youtube_url, duration, sort_order } = body;

  if (!series_id) return NextResponse.json({ error: 'series_id is required' }, { status: 400 });
  if (!title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 });

  const youtube_id = parseYouTubeId(youtube_url || '');
  if (!youtube_id) {
    return NextResponse.json(
      { error: 'Could not read a YouTube video ID from that URL. Paste the full link from YouTube.' },
      { status: 400 }
    );
  }

  const adminClient = getAdminClient();
  const { data, error } = await adminClient
    .from('training_videos')
    .insert({
      series_id,
      title: title.trim(),
      description: description?.trim() || null,
      youtube_id,
      duration: duration?.trim() || null,
      sort_order: typeof sort_order === 'number' ? sort_order : 100,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ video: data });
}

export async function PATCH(req: NextRequest) {
  const auth = await ensureManager();
  if (auth.error) return auth.error;

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const body = await req.json();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.title !== undefined) updates.title = body.title?.trim() || null;
  if (body.description !== undefined) updates.description = body.description?.trim() || null;
  if (body.duration !== undefined) updates.duration = body.duration?.trim() || null;
  if (body.sort_order !== undefined) updates.sort_order = body.sort_order;
  if (body.active !== undefined) updates.active = !!body.active;
  if (body.series_id !== undefined) updates.series_id = body.series_id;

  // Re-parse YouTube URL if provided so an edit can swap the link
  if (body.youtube_url !== undefined) {
    const youtube_id = parseYouTubeId(body.youtube_url);
    if (!youtube_id) {
      return NextResponse.json(
        { error: 'Could not read a YouTube video ID from that URL.' },
        { status: 400 }
      );
    }
    updates.youtube_id = youtube_id;
  }

  const adminClient = getAdminClient();
  const { error } = await adminClient
    .from('training_videos')
    .update(updates)
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const auth = await ensureManager();
  if (auth.error) return auth.error;

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const adminClient = getAdminClient();
  const { error } = await adminClient
    .from('training_videos')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
