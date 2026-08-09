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
 * POST /api/memories/video — two-step direct-to-storage flow (video
 * files are too big for Vercel's request-body cap, so they never pass
 * through this server):
 *
 *   { action: 'sign', ext }                 → { path, token }
 *       client then PUTs the file straight to Supabase storage
 *   { action: 'finalize', path, restaurant_id?, caption?, caption_es?,
 *     taken_label? }                        → inserts the wall row
 */
export async function POST(req: NextRequest) {
  const auth = await ensureManager();
  if (auth.error) return auth.error;

  const body = await req.json();
  const adminClient = getAdminClient();

  if (body.action === 'sign') {
    const ext = ['mp4', 'mov'].includes((body.ext || '').toLowerCase()) ? body.ext.toLowerCase() : 'mp4';
    const path = `videos/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { data, error } = await adminClient.storage.from('memories').createSignedUploadUrl(path);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ path: data.path, token: data.token });
  }

  if (body.action === 'finalize') {
    const path: string = body.path || '';
    // Only paths this route signs are insertable — no free-form URLs.
    if (!/^videos\/\d+-[a-z0-9]+\.(mp4|mov)$/.test(path)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }
    const url = adminClient.storage.from('memories').getPublicUrl(path).data.publicUrl;
    const { error } = await adminClient.from('memories').insert({
      restaurant_id: ((body.restaurant_id as string) || '').trim() || null,
      video_url: url,
      caption: ((body.caption as string) || '').trim() || null,
      caption_es: ((body.caption_es as string) || '').trim() || null,
      taken_label: ((body.taken_label as string) || '').trim() || null,
      uploaded_by: auth.user!.id,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
