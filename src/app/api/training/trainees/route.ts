import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { resolveTrainingPath } from '@/lib/training-path';

export const dynamic = 'force-dynamic';

const ROLE_LEVELS = new Set(['department', 'position', 'certification']);

/**
 * GET /api/training/trainees
 *
 * For trainers: the new hires assigned to you, with their hands-on floor
 * steps so you can mark each shadow shift done. Steps a manager must sign
 * are listed too (so the trainer knows what's left) but aren't theirs to mark.
 */
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: assignments, error } = await admin
    .from('trainee_assignments')
    .select('user_id, start_date')
    .eq('trainer_id', user.id);
  if (error || !assignments || assignments.length === 0) {
    return NextResponse.json({ trainees: [] }, { headers: { 'Cache-Control': 'private, no-store' } });
  }

  const trainees = (await Promise.all(assignments.map(async (a) => {
    const path = await resolveTrainingPath(admin, a.user_id);
    if (!path || path.floor_ready.ready) return null;
    const { data: position } = path.user.position_slug
      ? await admin.from('positions').select('name').eq('slug', path.user.position_slug).maybeSingle()
      : { data: null };
    const steps = path.tracks
      .filter((t) => ROLE_LEVELS.has(t.level))
      .flatMap((t) => t.modules.filter((m) => m.module_type === 'skill'))
      .map((m) => ({
        id: m.id,
        title: m.title,
        title_es: m.title_es,
        completion: m.completion,
        required: m.required,
        done: m.done,
      }));
    return {
      id: path.user.id,
      full_name: path.user.full_name,
      position_name: (position as { name?: string } | null)?.name ?? null,
      start_date: a.start_date,
      steps,
    };
  }))).filter(Boolean);

  return NextResponse.json({ trainees }, { headers: { 'Cache-Control': 'private, no-store' } });
}
