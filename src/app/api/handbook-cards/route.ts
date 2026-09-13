import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * GET /api/handbook-cards — the Handbook Quick Guide.
 *
 * Returns card sections with their cards, in order. Everyone sees
 * published sections; admins also see drafts (published = false) so
 * sections can be previewed before staff get them. For admins each
 * section also carries needs_review: true when its booklet section was
 * edited after the cards were last reviewed.
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

  const bookletIds = sections.map((s) => s.booklet_section_id).filter(Boolean) as string[];
  const [{ data: cards }, { data: booklet }] = await Promise.all([
    adminClient
      .from('handbook_cards')
      .select('id, section_id, sort_order, headline, headline_es, points, points_es, callout, callout_es, quick_question, quick_question_es, image_url, reviewed_at')
      .in('section_id', sections.map((s) => s.id))
      .eq('active', true)
      .order('sort_order', { ascending: true }),
    bookletIds.length
      ? adminClient.from('handbook_sections').select('id, title, sort_order, updated_at').in('id', bookletIds)
      : Promise.resolve({ data: [] as { id: string; title: string; sort_order: number; updated_at: string }[] }),
  ]);

  const result = sections.map((s) => {
    const sectionCards = (cards ?? []).filter((c) => c.section_id === s.id);
    const source = (booklet ?? []).find((b) => b.id === s.booklet_section_id) || null;
    const lastReviewed = sectionCards.reduce((max, c) => (c.reviewed_at > max ? c.reviewed_at : max), '');
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
      booklet: source ? { title: source.title, sort_order: source.sort_order } : null,
      ...(isAdmin && source ? { needs_review: !!lastReviewed && source.updated_at > lastReviewed } : {}),
      cards: sectionCards.map(({ section_id: _s, reviewed_at: _r, ...card }) => card),
    };
  });

  return NextResponse.json(
    { sections: result, is_admin: isAdmin },
    { headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=300' } }
  );
}
