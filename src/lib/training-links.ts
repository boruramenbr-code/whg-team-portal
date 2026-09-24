/**
 * Shareable links into training (Manager Academy + guided training, Sept 2026).
 *
 * An Asana task, a text, or a manager at the hiring desk can point straight
 * at one lesson, one card, one video, or a new hire's first step. The app
 * reads these params once, opens the target, and cleans the address bar.
 * Logged-out visitors are sent back here after signing in (middleware adds
 * ?next=, the login page honors it).
 *
 * Staff lessons and videos open in the team app (/dashboard). Manager
 * Academy lessons and manager-only videos open in Manager Resources
 * (/resources). Older links pointing at /admin are forwarded there.
 */

export type TrainingZone = 'menu' | 'systems' | 'academy';

export type TrainingLink =
  | { kind: 'lesson'; id: string; zone: TrainingZone; card: string | null }
  | { kind: 'video'; id: string }
  | { kind: 'start' };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function buildLessonUrl(sectionId: string, zone: TrainingZone, cardId?: string | null): string {
  const q = new URLSearchParams({ lesson: sectionId, zone });
  if (cardId) q.set('card', cardId);
  return `${window.location.origin}${zone === 'academy' ? '/resources' : '/dashboard'}?${q.toString()}`;
}

export function buildVideoUrl(videoId: string, where: 'dashboard' | 'resources' = 'dashboard'): string {
  return `${window.location.origin}/${where}?video=${encodeURIComponent(videoId)}`;
}

/** The day-one link: opens the new hire's guided training (after they sign in). */
export function buildTrainingStartUrl(): string {
  return `${window.location.origin}/dashboard?training=start`;
}

export function parseTrainingLink(search: string): TrainingLink | null {
  const q = new URLSearchParams(search);
  const lesson = q.get('lesson');
  if (lesson && UUID.test(lesson)) {
    const z = q.get('zone');
    const zone: TrainingZone = z === 'systems' || z === 'academy' ? z : 'menu';
    const card = q.get('card');
    return { kind: 'lesson', id: lesson, zone, card: card && UUID.test(card) ? card : null };
  }
  const video = q.get('video');
  if (video && UUID.test(video)) return { kind: 'video', id: video };
  if (q.get('training') === 'start') return { kind: 'start' };
  return null;
}

/** Where to go after signing in — only ever our own app pages. */
export function safeNextPath(raw: string | null): string {
  return raw && /^\/(dashboard|admin|resources)(\/|\?|$)/.test(raw) ? raw : '/dashboard';
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older iOS / insecure contexts — fall back to a hidden textarea.
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}
