'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

interface HandbookMedia {
  id: string;
  sort_order: number;
  caption: string | null;
  alt_text: string;
  url: string;
}

interface HandbookSection {
  id: string;
  sort_order: number;
  title: string;
  body: string;
  handbook_version: number;
  language: string;
  role_visibility: 'employee' | 'manager' | 'all';
  media?: HandbookMedia[];
}

interface Props {
  language: 'en' | 'es';
  /**
   * Which handbook to render:
   *   • 'employee' (default) → staff handbook + 'all'-visibility sections
   *   • 'manager'            → Manager Bible content (manager + 'all')
   */
  audience?: 'employee' | 'manager';
}

/**
 * Responsive handbook reading view with a sticky TOC sidebar on desktop
 * and a collapsible section list on mobile. Includes in-document search
 * that jumps to matching sections.
 */
export default function HandbookReaderTab({ language, audience = 'employee' }: Props) {
  const [sections, setSections] = useState<HandbookSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<HandbookMedia | null>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Close lightbox on Escape
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/handbook/sections?language=${language}&audience=${audience}`);
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error || `Request failed (${res.status})`);
        }
        const json = await res.json();
        if (!cancelled) {
          setSections(json.sections);
          if (json.sections.length > 0) setActiveId(json.sections[0].id);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [language, audience]);

  // Which sections contain the search term (case-insensitive)
  const matchedIds = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return null;
    const ids = new Set<string>();
    for (const s of sections) {
      if (s.title.toLowerCase().includes(q) || s.body.toLowerCase().includes(q)) {
        ids.add(s.id);
      }
    }
    return ids;
  }, [search, sections]);

  const scrollToSection = (id: string) => {
    const el = sectionRefs.current[id];
    if (el && scrollContainerRef.current) {
      // Offset for the sticky top bar so the heading isn't hidden
      const top = el.offsetTop - 16;
      scrollContainerRef.current.scrollTo({ top, behavior: 'smooth' });
      setActiveId(id);
      setMobileTocOpen(false);
    }
  };

  // Track which section is currently in view for the TOC highlight
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = (entry.target as HTMLElement).dataset.sectionId;
            if (id) setActiveId(id);
          }
        }
      },
      { root: container, rootMargin: '-20% 0px -70% 0px', threshold: 0 }
    );
    for (const s of sections) {
      const el = sectionRefs.current[s.id];
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [sections]);

  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-sm text-gray-500">Loading handbook…</div>;
  }
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-sm">
          <p className="text-sm text-red-600 font-semibold">Couldn&apos;t load handbook</p>
          <p className="text-xs text-gray-500 mt-1">{error}</p>
        </div>
      </div>
    );
  }
  if (sections.length === 0) {
    return <div className="flex-1 flex items-center justify-center text-sm text-gray-500">No handbook content yet.</div>;
  }

  const filteredToc = matchedIds
    ? sections.filter((s) => matchedIds.has(s.id))
    : sections;

  return (
    <div className="flex-1 flex overflow-hidden bg-gradient-to-b from-[#C5D3E2] to-[#D5E0EB]">
      {/* Desktop TOC sidebar */}
      <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 border-r border-gray-200 bg-white">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-xs font-bold uppercase tracking-wide text-gray-500">Contents</h2>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {filteredToc.map((s) => (
            <button
              key={s.id}
              onClick={() => scrollToSection(s.id)}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                activeId === s.id
                  ? 'bg-[#EBF3FB] text-[#1B3A6B] font-semibold border-l-2 border-[#1B3A6B]'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-[#1B3A6B]'
              }`}
            >
              <span className="text-[10px] font-bold text-gray-400 mr-2">{s.sort_order}</span>
              {s.title}
            </button>
          ))}
          {matchedIds && filteredToc.length === 0 && (
            <div className="px-4 py-6 text-xs text-gray-500 text-center">No matches.</div>
          )}
        </nav>
      </aside>

      {/* Main reading column */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar: search + mobile TOC button */}
        <div className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setMobileTocOpen(true)}
            className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-[#1B3A6B]"
            aria-label="Open table of contents"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="flex-1 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search the handbook…"
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#2E86C1]"
            />
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          {search && (
            <span className="text-[11px] text-gray-500 flex-shrink-0 hidden sm:inline">
              {matchedIds?.size ?? 0} matches
            </span>
          )}
        </div>

        {/* Content — responsive typography per spec:
            mobile 18px, tablet 17px, desktop 16px, capped at ~700px width */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden">
          <article className="max-w-[700px] mx-auto px-4 md:px-8 py-6 md:py-8 text-gray-800 text-base md:text-[17px] lg:text-[16px] leading-relaxed">
            <header className="mb-8 pb-6 border-b border-gray-200">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#2E86C1] mb-1">
                WHG Team Handbook
              </p>
              <h1 className="text-3xl font-bold text-[#1B3A6B]">Wong Hospitality Group</h1>
              <p className="text-sm text-gray-500 mt-1">
                Version {sections[0].handbook_version}.0 · Read on any device
              </p>
            </header>

            {sections.map((s) => {
              const dimmed = matchedIds !== null && !matchedIds.has(s.id);
              return (
                <section
                  key={s.id}
                  ref={(el) => { sectionRefs.current[s.id] = el; }}
                  data-section-id={s.id}
                  className={`mb-10 scroll-mt-4 transition-opacity ${dimmed ? 'opacity-30' : 'opacity-100'}`}
                >
                  <h2 className="text-xl md:text-2xl font-bold text-[#1B3A6B] mb-4">
                    <span className="text-[#2E86C1] mr-2">{s.sort_order}.</span>
                    {s.title}
                  </h2>
                  {renderBody(s.body, search)}
                  {s.media && s.media.length > 0 && (
                    <div className="mt-6 pt-5 border-t border-gray-100">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3">
                        Visual Reference
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {s.media.map((m) => (
                          <button
                            key={m.id}
                            onClick={() => setLightbox(m)}
                            className="group block text-left rounded-lg border border-gray-200 bg-white overflow-hidden hover:border-[#2E86C1] hover:shadow-sm transition-all"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={m.url}
                              alt={m.alt_text}
                              loading="lazy"
                              className="w-full h-28 object-cover bg-gray-50 group-hover:opacity-95"
                            />
                            {m.caption && (
                              <div className="px-2 py-1.5 text-[11px] font-medium text-gray-600 group-hover:text-[#1B3A6B] line-clamp-2">
                                {m.caption}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              );
            })}

            <footer className="mt-12 pt-6 border-t border-gray-200 text-center">
              <p className="text-xs text-gray-400">
                End of handbook · WHG Team Portal
              </p>
            </footer>
          </article>
        </div>
      </div>

      {/* Infographic lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white text-2xl leading-none p-2"
            aria-label="Close"
          >
            ✕
          </button>
          <div
            className="max-w-4xl max-h-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightbox.url}
              alt={lightbox.alt_text}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
            {lightbox.caption && (
              <p className="mt-3 text-sm text-white/90 text-center font-medium">
                {lightbox.caption}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Mobile TOC sheet */}
      {mobileTocOpen && (
        <>
          <div className="lg:hidden fixed inset-0 bg-black/40 z-30" onClick={() => setMobileTocOpen(false)} />
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white rounded-t-2xl shadow-2xl max-h-[75vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
              <h3 className="font-semibold text-[#1B3A6B] text-sm">Contents</h3>
              <button
                onClick={() => setMobileTocOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>
            <nav className="overflow-y-auto flex-1 py-2">
              {filteredToc.map((s) => (
                <button
                  key={s.id}
                  onClick={() => scrollToSection(s.id)}
                  className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                    activeId === s.id
                      ? 'bg-[#EBF3FB] text-[#1B3A6B] font-semibold'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-[10px] font-bold text-gray-400 mr-2">{s.sort_order}</span>
                  {s.title}
                </button>
              ))}
            </nav>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Parse the handbook body, which is stored as a simple markdown dialect:
 *   ## Heading        (level 2 — major heading, navy)
 *   ### Heading       (level 3 — sub-heading)
 *   - Bullet item
 *   plain paragraph text (blank line between paragraphs)
 *
 * The body text is produced by scripts/extract-handbook-pdf.py +
 * build-handbook-reseed.mjs, so the structure matches the original PDF.
 */
type Block =
  | { kind: 'heading'; level: 2 | 3; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'paragraph'; text: string };

function parseBody(body: string): Block[] {
  const lines = body.split('\n');
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: string[] = [];

  const flushPara = () => {
    if (para.length) {
      const text = para.join(' ').replace(/\s+/g, ' ').trim();
      if (text) blocks.push({ kind: 'paragraph', text });
      para = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      blocks.push({ kind: 'list', items: list.slice() });
      list = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trim();

    if (!line) {
      flushList();
      flushPara();
      continue;
    }

    const h3 = line.match(/^###\s+(.*)$/);
    if (h3) {
      flushList();
      flushPara();
      blocks.push({ kind: 'heading', level: 3, text: h3[1].trim() });
      continue;
    }

    const h2 = line.match(/^##\s+(.*)$/);
    if (h2) {
      flushList();
      flushPara();
      blocks.push({ kind: 'heading', level: 2, text: h2[1].trim() });
      continue;
    }

    const bullet = line.match(/^-\s+(.*)$/);
    if (bullet) {
      flushPara();
      list.push(bullet[1].trim());
      continue;
    }

    flushList();
    para.push(line);
  }
  flushList();
  flushPara();

  return blocks;
}

/**
 * Render parsed blocks with consistent spacing. Reads uniformly on any
 * screen size — paragraphs flow naturally, headings stand out, bullets
 * render as real lists.
 */
function renderBody(body: string, search: string) {
  const blocks = parseBody(body);
  const q = search.trim();
  const maybeHighlight = (text: string) => (q ? highlight(text, q) : text);

  return (
    <div className="space-y-4">
      {blocks.map((b, idx) => {
        if (b.kind === 'heading') {
          if (b.level === 2) {
            return (
              <h3
                key={idx}
                className="text-lg md:text-xl font-bold text-[#1B3A6B] mt-8 mb-2 pb-1 border-b border-gray-100"
              >
                {maybeHighlight(b.text)}
              </h3>
            );
          }
          return (
            <h4
              key={idx}
              className="text-sm md:text-base font-semibold text-[#2E86C1] mt-5 mb-1 uppercase tracking-wide"
            >
              {maybeHighlight(b.text)}
            </h4>
          );
        }
        if (b.kind === 'list') {
          return (
            <ul key={idx} className="list-disc pl-6 space-y-1.5 marker:text-[#2E86C1]">
              {b.items.map((item, i) => (
                <li key={i} className="leading-relaxed">
                  {maybeHighlight(item)}
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={idx} className="leading-relaxed">
            {maybeHighlight(b.text)}
          </p>
        );
      })}
    </div>
  );
}

function highlight(text: string, query: string) {
  if (!query) return text;
  const re = new RegExp(`(${escapeRegex(query)})`, 'ig');
  const parts = text.split(re);
  return parts.map((part, i) =>
    re.test(part) && part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="bg-yellow-200 text-gray-900 px-0.5 rounded">{part}</mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
