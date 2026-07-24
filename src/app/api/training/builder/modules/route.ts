import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const MODULE_TYPES = ['video_series', 'menu_category', 'quiz', 'photo_test', 'skill', 'note'];
const COMPLETIONS = ['self', 'exam', 'manager'];

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function ensureAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  const { data: me } = await supabase
    .from('profiles').select('role, status').eq('id', user.id).single();
  if (!me || me.status === 'archived' || me.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Admins only' }, { status: 403 }) };
  }
  return { user };
}

/**
 * POST /api/training/builder/modules
 * Body: { track_ids: string[], title, title_es?, description?,
 *         description_es?, module_type, ref_id?, completion, required,
 *         sort_order }
 * Creates the SAME block on every selected track — Randy's "create a
 * training, point positions at it." Skips tracks that already have a
 * module with the same type+ref (or same title for skill/note).
 */
export async function POST(req: NextRequest) {
  const auth = await ensureAdmin();
  if (auth.error) return auth.error;

  const body = await req.json();
  const trackIds: string[] = Array.isArray(body.track_ids) ? body.track_ids : [];
  const title: string = (body.title || '').trim();
  const moduleType: string = body.module_type;
  const completion: string = COMPLETIONS.includes(body.completion) ? body.completion : 'self';
  const refId: string | null = body.ref_id || null;

  if (trackIds.length === 0) return NextResponse.json({ error: 'Pick at least one track.' }, { status: 400 });
  if (!title) return NextResponse.json({ error: 'Title is required.' }, { status: 400 });
  if (!MODULE_TYPES.includes(moduleType)) return NextResponse.json({ error: 'Invalid module type.' }, { status: 400 });
  if (['video_series', 'menu_category', 'quiz'].includes(moduleType) && !refId) {
    return NextResponse.json({ error: 'Pick what this block points at.' }, { status: 400 });
  }

  const adminClient = getAdminClient();
  let created = 0;
  let skipped = 0;
  for (const trackId of trackIds) {
    // Duplicate guard: same ref on the same track (or same title for
    // skill/note blocks) — pointing twice helps nobody.
    const dupQuery = adminClient
      .from('track_modules').select('id').eq('track_id', trackId).eq('module_type', moduleType).eq('active', true);
    const { data: dup } = refId
      ? await dupQuery.eq('ref_id', refId).maybeSingle()
      : await dupQuery.eq('title', title).maybeSingle();
    if (dup) { skipped++; continue; }

    const { error } = await adminClient.from('track_modules').insert({
      track_id: trackId,
      title,
      title_es: (body.title_es || '').trim() || null,
      description: (body.description || '').trim() || null,
      description_es: (body.description_es || '').trim() || null,
      module_type: moduleType,
      ref_id: refId,
      completion,
      required: body.required !== false,
      sort_order: Number(body.sort_order) || 100,
    });
    if (error) return NextResponse.json({ error: `${error.message} (created ${created} before failing)` }, { status: 500 });
    created++;
  }
  return NextResponse.json({ success: true, created, skipped });
}

/** PATCH /api/training/builder/modules?id=… — edit one module row. */
export async function PATCH(req: NextRequest) {
  const auth = await ensureAdmin();
  if (auth.error) return auth.error;

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const body = await req.json();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.title !== undefined) {
    if (!body.title?.trim()) return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 });
    updates.title = body.title.trim();
  }
  for (const f of ['title_es', 'description', 'description_es'] as const) {
    if (body[f] !== undefined) updates[f] = (body[f] || '').trim() || null;
  }
  if (body.completion !== undefined && COMPLETIONS.includes(body.completion)) updates.completion = body.completion;
  if (body.required !== undefined) updates.required = !!body.required;
  if (body.sort_order !== undefined) updates.sort_order = Number(body.sort_order) || 100;
  if (body.active !== undefined) updates.active = !!body.active;

  const { error } = await getAdminClient().from('track_modules').update(updates).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}

/** DELETE /api/training/builder/modules?id=… — removes the block from
 *  that track. NOTE: staff completion records for this module go with it. */
export async function DELETE(req: NextRequest) {
  const auth = await ensureAdmin();
  if (auth.error) return auth.error;

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const { error } = await getAdminClient().from('track_modules').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
