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
 * GET /api/memories — the whole wall, every restaurant, for every
 * employee (Randy's call: culture is open across the brand). The
 * client groups by restaurant chip; restaurant_id null = brand-wide.
 */
export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // ?limit= keeps the Home-card preview fetch light (default: full wall).
  const limit = Math.min(Math.max(Number(req.nextUrl.searchParams.get('limit')) || 600, 1), 600);
  // Home-card scoping: ?restaurant_id=X shows that wall; ?scope=own shows
  // the caller's own restaurant. Brand-wide (null) rides along either way.
  // No scope → the full cross-restaurant wall (the Memories page).
  const ridParam = req.nextUrl.searchParams.get('restaurant_id');
  const scopeOwn = req.nextUrl.searchParams.get('scope') === 'own';

  const { data: me } = await supabase
    .from('profiles').select('role, restaurant_id, status').eq('id', user.id).single();
  if (!me || me.status === 'archived') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const adminClient = getAdminClient();
  const scopeRid = ridParam || (scopeOwn ? me.restaurant_id : null);
  let memoriesQuery = adminClient
    .from('memories')
    .select('id, restaurant_id, photo_url, video_youtube_id, caption, caption_es, taken_label, created_at')
    .eq('active', true);
  if (scopeRid) {
    memoriesQuery = memoriesQuery.or(`restaurant_id.eq.${scopeRid},restaurant_id.is.null`);
  }
  const [{ data: memories, error }, { data: restaurants }] = await Promise.all([
    memoriesQuery.order('created_at', { ascending: false }).limit(limit),
    adminClient.from('restaurants').select('id, name').order('name'),
  ]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    memories: memories ?? [],
    restaurants: restaurants ?? [],
    my_restaurant_id: me.restaurant_id,
    can_post: MANAGER_ROLES.includes(me.role),
  }, { headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=300' } });
}

async function ensureManager() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  const { data: me } = await supabase
    .from('profiles').select('role, status').eq('id', user.id).single();
  if (!me || me.status === 'archived' || !MANAGER_ROLES.includes(me.role)) {
    return { error: NextResponse.json({ error: 'Managers only' }, { status: 403 }) };
  }
  return { user };
}

/**
 * POST /api/memories — multipart form:
 *   photo?: File (already client-converted to JPEG ≤2048px)
 *   video_youtube_id?: string (11-char id — client extracts from URL)
 *   restaurant_id?: string ('' / missing = brand-wide WHG moment)
 *   caption?, caption_es?, taken_label?
 * One of photo / video_youtube_id is required.
 */
export async function POST(req: NextRequest) {
  const auth = await ensureManager();
  if (auth.error) return auth.error;

  const form = await req.formData();
  const photo = form.get('photo') as File | null;
  const videoId = ((form.get('video_youtube_id') as string) || '').trim() || null;
  const restaurantId = ((form.get('restaurant_id') as string) || '').trim() || null;
  const caption = ((form.get('caption') as string) || '').trim() || null;
  const captionEs = ((form.get('caption_es') as string) || '').trim() || null;
  const takenLabel = ((form.get('taken_label') as string) || '').trim() || null;

  if (!photo && !videoId) {
    return NextResponse.json({ error: 'Add a photo or a YouTube link.' }, { status: 400 });
  }

  const adminClient = getAdminClient();
  let photoUrl: string | null = null;

  if (photo) {
    const rawExt = (photo.name.split('.').pop() || 'jpg').toLowerCase();
    const ext = ['jpg', 'jpeg', 'png', 'webp'].includes(rawExt) ? rawExt : 'jpg';
    const key = `${restaurantId ?? 'whg'}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const buf = await photo.arrayBuffer();
    const { error: upErr } = await adminClient.storage
      .from('memories')
      .upload(key, buf, { contentType: photo.type || 'image/jpeg', upsert: false });
    if (upErr) return NextResponse.json({ error: `Upload failed: ${upErr.message}` }, { status: 500 });
    photoUrl = adminClient.storage.from('memories').getPublicUrl(key).data.publicUrl;
  }

  const { data, error } = await adminClient.from('memories').insert({
    restaurant_id: restaurantId,
    photo_url: photoUrl,
    video_youtube_id: videoId,
    caption,
    caption_es: captionEs,
    taken_label: takenLabel,
    uploaded_by: auth.user!.id,
  }).select('id').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true, id: data.id });
}

/** DELETE /api/memories?id=… — takedown (managers). Removal rule:
 *  anyone in a photo can ask a manager — it comes down, no questions. */
export async function DELETE(req: NextRequest) {
  const auth = await ensureManager();
  if (auth.error) return auth.error;

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const adminClient = getAdminClient();
  const { data: row } = await adminClient.from('memories').select('photo_url').eq('id', id).single();
  const { error } = await adminClient.from('memories').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Best-effort storage cleanup so the bucket doesn't hoard orphans.
  if (row?.photo_url) {
    const key = row.photo_url.split('/memories/')[1];
    if (key) adminClient.storage.from('memories').remove([decodeURIComponent(key)]).then(() => {});
  }
  return NextResponse.json({ success: true });
}
