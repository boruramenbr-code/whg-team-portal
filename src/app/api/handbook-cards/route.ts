import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const CARD_COLUMNS =
  'id, section_id, sort_order, headline, headline_es, points, points_es, callout, callout_es, quick_question, quick_question_es, image_url, reviewed_at';

type BookletRow = { id: string; title: string; sort_order: number; updated_at: string };

/**
 * GET /api/handbook-cards — the Handbook Quick Guide.
 *
 * Returns card sections with their cards, in order. Everyone sees
 * published sections; admins also see drafts (published = false) so
 * sections can be previewed before staff get them. Each card links to
 * its booklet source (its own, else its section's). For admins each
 * section carries needs_review: true when any card's source booklet
 * section was edited after that card was last reviewed.
 */
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: me } = await supabase
    .from('profiles').select('role, status').eq('id', user.id).single();
  if (!me || me.status === 'archived') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const isAdmin = me.role === 'admin';

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  let sectionQuery = adminClient
    .from('handbook_card_sections')
    .select('id, title, title_es, blurb, blurb_es, emoji, cover_url, booklet_section_id, sort_order, published')
    .eq('active', true)
    .order('sort_order', { ascending: true });
  if (!isAdmin) sectionQuery = sectionQuery.eq('published', true);
  const { data: sections, error } = await sectionQuery;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!sections || sections.length === 0) {
    return NextResponse.json({ sections: [], is_admin: isAdmin });
  }

  // Per-card source column arrived in migration 079 — fall back cleanly
  // if it hasn't been run yet.
  const sectionIds = sections.map((s) => s.id);
  const cardsQuery = (columns: string) => adminClient
    .from('handbook_cards')
    .select(columns)
    .in('section_id', sectionIds)
    .eq('active', true)
    .order('sort_order', { ascending: true });
  let cardsResult = await cardsQuery(`${CARD_COLUMNS}, booklet_section_id`);
  if (cardsResult.error) cardsResult = await cardsQuery(CARD_COLUMNS);
  const cards = (cardsResult.data ?? []) as unknown as Array<{
    id: string; section_id: string; reviewed_at: string; booklet_section_id?: string | null;
    [key: string]: unknown;
  }>;

  const bookletIds = Array.from(new Set([
    ...sections.map((s) => s.booklet_section_id),
    ...cards.map((c) => c.booklet_section_id),
  ].filter(Boolean) as string[]));
  const { data: booklet } = bookletIds.length
    ? await adminClient.from('handbook_sections').select('id, title, sort_order, updated_at').in('id', bookletIds)
    : { data: [] as BookletRow[] };
  const sourceById = new Map((booklet ?? []).map((b: BookletRow) => [b.id, b]));

  const result = sections.map((s) => {
    const sectionSource = s.booklet_section_id ? sourceById.get(s.booklet_section_id) || null : null;
    const sectionCards = cards.filter((c) => c.section_id === s.id);
    const needsReview = sectionCards.some((c) => {
      const src = (c.booklet_section_id && sourceById.get(c.booklet_section_id)) || sectionSource;
      return !!src && src.updated_at > c.reviewed_at;
    });
    return {
      id: s.id,
      title: s.title,
      title_es: s.title_es,
      blurb: s.blurb,
      blurb_es: s.blurb_es,
      emoji: s.emoji,
      cover_url: s.cover_url,
      published: s.published,
      // Booklet deep link: sort_order matches across languages.
      booklet: sectionSource ? { title: sectionSource.title, sort_order: sectionSource.sort_order } : null,
      ...(isAdmin ? { needs_review: needsReview } : {}),
      cards: sectionCards.map(({ section_id: _s, reviewed_at: _r, booklet_section_id: cardSourceId, ...card }) => {
        const src = cardSourceId ? sourceById.get(cardSourceId) : null;
        return { ...card, booklet: src ? { title: src.title, sort_order: src.sort_order } : null };
      }),
    };
  });

  return NextResponse.json(
    { sections: result, is_admin: isAdmin },
    { headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=300' } }
  );
}
