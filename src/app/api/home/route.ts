import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { GET as preshiftGET } from '../preshift-notes/route';
import { GET as ownerMessagesGET } from '../owner-messages/route';
import { GET as birthdaysGET } from '../birthdays/route';
import { GET as holidaysGET } from '../holidays/route';
import { GET as trainingLatestGET } from '../training/latest/route';
import { GET as trainingGuideGET } from '../training/guide/route';
import { GET as newHiresGET } from '../new-hires/route';
import { GET as memoriesGET } from '../memories/route';

export const dynamic = 'force-dynamic';

/**
 * GET /api/home?restaurant_id=… — everything Home needs for first paint,
 * in one request.
 *
 * Runs the existing routes' GET handlers side by side on the server
 * instead of the phone making eight separate trips over cellular. Each
 * feature's logic (and its permission checks) still lives in exactly
 * one place — its own route. Sections fail independently: a broken one
 * comes back null and Home simply hides that card.
 */
export async function GET(req: NextRequest) {
  const rid = req.nextUrl.searchParams.get('restaurant_id');
  const ridQuery = rid ? `restaurant_id=${encodeURIComponent(rid)}` : '';
  const sub = (path: string) => new NextRequest(new URL(path, req.url), { headers: req.headers });
  const json = async (res: Promise<Response>) => {
    try {
      const r = await res;
      return r.ok ? await r.json() : null;
    } catch {
      return null;
    }
  };

  // Per-section timings ride back in a Server-Timing header (browser dev
  // tools → Network → Timing), so a slow open can be pinned on one section.
  const started = Date.now();
  const timings: string[] = [];
  const timed = <T,>(name: string, p: Promise<T>) =>
    p.finally(() => timings.push(`${name};dur=${Date.now() - started}`));

  const supabase = createClient();
  const [auth, preshift, ownerMessages, birthdays, holidays, trainingLatest, trainingGuide, newHires, memories] =
    await Promise.all([
      timed('auth', supabase.auth.getUser()),
      timed('preshift', json(preshiftGET(sub(`/api/preshift-notes?${ridQuery}`)))),
      timed('messages', json(ownerMessagesGET(sub('/api/owner-messages?audience=staff')))),
      timed('birthdays', json(birthdaysGET())),
      timed('holidays', json(holidaysGET(sub('/api/holidays')))),
      timed('latest', json(trainingLatestGET())),
      // Ladder for everyone; guided stages only while someone's in training.
      timed('training', json(trainingGuideGET(sub('/api/training/guide')))),
      timed('newhires', json(newHiresGET())),
      timed('memories', json(memoriesGET(sub(rid ? `/api/memories?limit=6&${ridQuery}` : '/api/memories?limit=6&scope=own')))),
    ]);

  if (!auth.data.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  return NextResponse.json(
    {
      preshift,
      owner_messages: ownerMessages,
      birthdays,
      holidays,
      training_latest: trainingLatest,
      training_path: trainingGuide,
      new_hires: newHires,
      memories,
    },
    // Pre-shift (86'd items) rides in this bundle — never serve it stale.
    { headers: { 'Cache-Control': 'private, no-store', 'Server-Timing': timings.join(', ') } }
  );
}
