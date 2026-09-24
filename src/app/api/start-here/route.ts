import { NextRequest, NextResponse } from 'next/server';
import { createClient, getMyProfile, getMyExtraLocationIds } from '@/lib/supabase-server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { getOnboardingForUser } from '@/lib/onboarding';
import { youtubeId } from '@/lib/youtube';
import { GET as trainingGuideGET } from '../training/guide/route';

export const dynamic = 'force-dynamic';

const MANAGER_ROLES = ['admin', 'manager', 'assistant_manager'];
const SECTION_ORDER = ['paperwork', 'training', 'first_week', 'ongoing'] as const;
const INFO_FIELDS = [
  'address', 'maps_url', 'phone', 'hours', 'hours_es', 'parking', 'parking_es',
  'entrance', 'entrance_es', 'first_day', 'first_day_es',
] as const;

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/** First paragraph of the welcome note, without markdown emphasis. */
function excerpt(text: string | null | undefined) {
  if (!text) return null;
  return text.split(/\n\s*\n/)[0].replace(/\*\*/g, '').trim() || null;
}

/** Which restaurants this person may view or edit Start Here details for. */
async function allowedRestaurants(role: string, own: string | null) {
  if (role === 'admin') return null; // all
  return new Set([...(own ? [own] : []), ...(await getMyExtraLocationIds())]);
}

/**
 * GET /api/start-here[?restaurant_id=…] — everything the Start Here →
 * Welcome page needs, in one request: progress (guided step + onboarding
 * checklist by stage), the restaurant's first-day details, the people
 * (leadership + assigned trainer), and the owner's welcome note + video.
 * With ?editor=1 (managers): just the raw fields for Mission Control.
 */
export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const me = await getMyProfile();
  if (!me || me.status === 'archived') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const requested = req.nextUrl.searchParams.get('restaurant_id');
  const allowed = await allowedRestaurants(me.role, me.restaurant_id);
  const restaurantId = requested && (!allowed || allowed.has(requested)) ? requested : me.restaurant_id;

  const admin = getAdminClient();

  // ?editor=1 — Mission Control's Start Here editor: just the raw fields.
  if (req.nextUrl.searchParams.get('editor')) {
    if (!MANAGER_ROLES.includes(me.role)) return NextResponse.json({ error: 'Managers only' }, { status: 403 });
    const [infoRes, videoRes] = await Promise.all([
      restaurantId
        ? admin.from('restaurant_info').select('*').eq('restaurant_id', restaurantId).maybeSingle()
        : Promise.resolve({ data: null }),
      me.role === 'admin'
        ? admin.from('whg_settings').select('value').eq('key', 'welcome_video_url').maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    return NextResponse.json(
      {
        restaurant_id: restaurantId,
        info: infoRes.data ?? {},
        welcome_video_url: (videoRes.data as { value?: string } | null)?.value ?? '',
      },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  }
  const [profileRes, restaurantRes, infoRes, videoRes, welcomeRes, onboarding, guide, leadersRes] = await Promise.all([
    admin.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
    restaurantId
      ? admin.from('restaurants').select('id, name, slug').eq('id', restaurantId).maybeSingle()
      : Promise.resolve({ data: null }),
    restaurantId
      ? admin.from('restaurant_info').select('*').eq('restaurant_id', restaurantId).maybeSingle()
      : Promise.resolve({ data: null }),
    admin.from('whg_settings').select('value').eq('key', 'welcome_video_url').maybeSingle(),
    admin.from('welcome_messages').select('content, content_es').eq('is_active', true)
      .order('created_at', { ascending: false }).limit(1).maybeSingle(),
    getOnboardingForUser(admin, user.id),
    trainingGuideGET(new NextRequest(new URL('/api/training/guide', req.url), { headers: req.headers }))
      .then((r) => (r.ok ? r.json() : null)).catch(() => null),
    restaurantId
      ? admin.from('org_chart_positions')
          .select('first_name, last_initial, title, role_level, photo_url')
          .eq('restaurant_id', restaurantId).eq('active', true)
          .gte('role_level', 2).lte('role_level', 4)
          .order('role_level', { ascending: true }).order('sort_order', { ascending: true })
      : Promise.resolve({ data: [] }),
  ]);

  const items = onboarding?.items ?? [];
  const sections = SECTION_ORDER.map((key) => {
    const list = items.filter((i) => i.section === key);
    return { key, total: list.length, done: list.filter((i) => i.is_complete).length };
  }).filter((s) => s.total > 0);

  const info = infoRes.data as Record<string, string | null> | null;
  const hasInfo = !!info && INFO_FIELDS.some((f) => info[f]);
  const videoUrl = (videoRes.data as { value?: string } | null)?.value || null;

  return NextResponse.json(
    {
      first_name: ((profileRes.data as { full_name?: string } | null)?.full_name || '').split(' ')[0] || null,
      restaurant: restaurantRes.data ?? null,
      in_training: !!guide?.in_training,
      guided: guide?.in_training && guide.summary ? guide.summary : null,
      checklist: {
        sections,
        total: items.length,
        done: items.filter((i) => i.is_complete).length,
      },
      welcome: {
        excerpt: excerpt((welcomeRes.data as { content?: string } | null)?.content),
        excerpt_es: excerpt((welcomeRes.data as { content_es?: string } | null)?.content_es),
        video_id: youtubeId(videoUrl),
      },
      info: hasInfo ? info : null,
      people: {
        trainer: guide?.assignment?.trainer_name ? { name: guide.assignment.trainer_name } : null,
        leaders: ((leadersRes.data ?? []) as Array<{ first_name: string; last_initial: string | null; title: string; photo_url: string | null }>)
          .map((p) => ({ name: [p.first_name, p.last_initial].filter(Boolean).join(' '), title: p.title, photo_url: p.photo_url })),
      },
      can_edit: MANAGER_ROLES.includes(me.role),
    },
    { headers: { 'Cache-Control': 'private, no-store' } }
  );
}

/**
 * PATCH /api/start-here
 *   { restaurant_id, info: { address, phone, … } } — managers (their own
 *     restaurants) and admins: save a restaurant's first-day details.
 *   { welcome_video_url } — admins: the owner's welcome video (YouTube).
 */
export async function PATCH(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const me = await getMyProfile();
  if (!me || me.status === 'archived' || !MANAGER_ROLES.includes(me.role)) {
    return NextResponse.json({ error: 'Managers only' }, { status: 403 });
  }

  const body = await req.json();
  const admin = getAdminClient();

  if (body.welcome_video_url !== undefined) {
    if (me.role !== 'admin') return NextResponse.json({ error: 'Owner only' }, { status: 403 });
    const url = String(body.welcome_video_url || '').trim();
    if (url && !youtubeId(url)) {
      return NextResponse.json({ error: 'That doesn’t look like a YouTube link.' }, { status: 400 });
    }
    const { error } = await admin.from('whg_settings').upsert(
      { key: 'welcome_video_url', value: url || null, updated_at: new Date().toISOString(), updated_by: user.id },
      { onConflict: 'key' }
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (body.info !== undefined) {
    const restaurantId = String(body.restaurant_id || '');
    const allowed = await allowedRestaurants(me.role, me.restaurant_id);
    if (!restaurantId || (allowed && !allowed.has(restaurantId))) {
      return NextResponse.json({ error: 'You can only edit your own restaurant' }, { status: 403 });
    }
    const row: Record<string, string | null> = {};
    for (const f of INFO_FIELDS) {
      const v = body.info?.[f];
      row[f] = typeof v === 'string' && v.trim() ? v.trim() : null;
    }
    const { error } = await admin.from('restaurant_info').upsert(
      { restaurant_id: restaurantId, ...row, updated_at: new Date().toISOString(), updated_by: user.id },
      { onConflict: 'restaurant_id' }
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
