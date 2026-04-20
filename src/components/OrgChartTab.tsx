'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';

/* ───────── types ───────── */
interface Position {
  id: string;
  first_name: string;
  last_initial: string;
  title: string;
  role_level: number;
  reports_to: string | null;
  photo_url: string | null;
  sort_order: number;
  detail: string | null;
}

interface Props {
  restaurantId: string | null;
  restaurantName: string | null;
  isAdmin?: boolean;
}

interface Connector {
  path: string;
  color: string;
  opacity: number;
  dashed?: boolean;
}

/* ───────── color palette by role level ───────── */
const LEVEL_GRADIENT: Record<number, string> = {
  1: 'from-amber-500 to-yellow-600',
  2: 'from-[#1B3A6B] to-[#2E86C1]',
  3: 'from-blue-500 to-indigo-500',
  4: 'from-cyan-500 to-blue-500',
  5: 'from-teal-400 to-emerald-500',
};

// Special color overrides
const SILENT_PARTNER_GRADIENT = 'from-slate-400 to-gray-500';
const SILENT_PARTNER_RING = 'ring-slate-300/50';
const FOH_GRADIENT = 'from-teal-400 to-emerald-500';
const BOH_GRADIENT = 'from-violet-400 to-purple-500';
const FOH_RING = 'ring-teal-400/40';
const BOH_RING = 'ring-violet-400/40';

const LEVEL_RING: Record<number, string> = {
  1: 'ring-amber-400/60',
  2: 'ring-[#2E86C1]/50',
  3: 'ring-indigo-400/50',
  4: 'ring-cyan-400/50',
  5: 'ring-teal-400/40',
};

/** Resolve gradient & ring for a position, accounting for special cases. */
function getNodeColors(p: Position): { gradient: string; ring: string } {
  // Silent partners — muted silver
  if (p.title === 'Silent Partner') {
    return { gradient: SILENT_PARTNER_GRADIENT, ring: SILENT_PARTNER_RING };
  }
  // Level 5: FOH vs BOH distinct colors
  if (p.role_level === 5 && p.title === 'BOH') {
    return { gradient: BOH_GRADIENT, ring: BOH_RING };
  }
  if (p.role_level === 5 && p.title === 'FOH') {
    return { gradient: FOH_GRADIENT, ring: FOH_RING };
  }
  const level = Math.min(p.role_level, 5);
  return { gradient: LEVEL_GRADIENT[level], ring: LEVEL_RING[level] };
}

const LEVEL_LABEL: Record<number, string> = {
  1: 'OWNERSHIP',
  2: 'MANAGEMENT',
  3: 'DEPARTMENT HEADS',
  4: 'SUPERVISORS',
  5: 'STAFF',
};

const CONNECTOR_COLORS: Record<number, string> = {
  1: '#D4A853',
  2: '#2E86C1',
  3: '#6366F1',
  4: '#06B6D4',
  5: '#14B8A6',
};

/* ───────── restaurant logo mapping (black variants for light bg) ───────── */
const RESTAURANT_LOGO: Record<string, string> = {
  'ichiban sushi': '/logos/ichiban-black.png',
  'boru ramen': '/logos/boru-black.png',
  'shokudo': '/logos/shokudo-black.png',
};

function getRestaurantLogo(name: string | null): string | null {
  if (!name) return null;
  const lower = name.toLowerCase();
  for (const [key, path] of Object.entries(RESTAURANT_LOGO)) {
    if (lower.includes(key)) return path;
  }
  return null;
}

/* ───────── main component ───────── */
export default function OrgChartTab({ restaurantId, restaurantName, isAdmin }: Props) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [animateIn, setAnimateIn] = useState(false);

  // SVG connector state
  const chartRef = useRef<HTMLDivElement>(null);
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [showLines, setShowLines] = useState(false);
  const [chartHeight, setChartHeight] = useState(0);

  const currentId = restaurantId;
  const currentName = restaurantName;

  useEffect(() => {
    if (!currentId) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      setAnimateIn(false);
      setSelectedId(null);
      setShowLines(false);
      setConnectors([]);
      try {
        const res = await fetch(`/api/org-chart?restaurant_id=${currentId}`);
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error || `Request failed (${res.status})`);
        }
        const json = await res.json();
        if (!cancelled) {
          setPositions(json.positions);
          setTimeout(() => setAnimateIn(true), 100);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [currentId]);

  const handleSelect = useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  // Group positions by tier
  const tiers = useMemo(() => {
    const map = new Map<number, Position[]>();
    for (const p of positions) {
      const arr = map.get(p.role_level) || [];
      arr.push(p);
      map.set(p.role_level, arr);
    }
    for (const [, arr] of Array.from(map.entries())) {
      arr.sort((a, b) => a.sort_order - b.sort_order);
    }
    return map;
  }, [positions]);

  const tierKeys = useMemo(() => Array.from(tiers.keys()).sort((a, b) => a - b), [tiers]);

  // Group level 5 positions by title for side-by-side display
  const level5 = useMemo(() => tiers.get(5) || [], [tiers]);
  const level5Groups = useMemo(() => {
    const map = new Map<string, Position[]>();
    for (const p of level5) {
      const arr = map.get(p.title) || [];
      arr.push(p);
      map.set(p.title, arr);
    }
    return Array.from(map.entries()).map(([title, items]) => ({ title, items }));
  }, [level5]);

  // ── Compute SVG connectors from measured DOM positions ──
  useEffect(() => {
    if (!animateIn || positions.length === 0) return;

    const compute = () => {
      const container = chartRef.current;
      if (!container) return;
      const cRect = container.getBoundingClientRect();
      setChartHeight(container.scrollHeight);

      // Collect all node rects keyed by position id
      const nodeMap = new Map<string, DOMRect>();
      container.querySelectorAll<HTMLElement>('[data-node-id]').forEach((el) => {
        const id = el.dataset.nodeId;
        if (id) nodeMap.set(id, el.getBoundingClientRect());
      });

      // Build position lookup
      const posById = new Map<string, Position>();
      for (const p of positions) posById.set(p.id, p);

      // Group children by parent AND by the child's level
      // This prevents mixing level-3 and level-5 children in a single bus
      const parentChildByLevel = new Map<string, Map<number, Position[]>>();
      for (const p of positions) {
        if (!p.reports_to) continue;
        if (!parentChildByLevel.has(p.reports_to)) {
          parentChildByLevel.set(p.reports_to, new Map());
        }
        const levelMap = parentChildByLevel.get(p.reports_to)!;
        const arr = levelMap.get(p.role_level) || [];
        arr.push(p);
        levelMap.set(p.role_level, arr);
      }

      const lines: Connector[] = [];

      // Container width for routing cross-level lines along edges
      const containerW = container.scrollWidth;

      for (const [parentId, levelMap] of Array.from(parentChildByLevel.entries())) {
        const pEl = nodeMap.get(parentId);
        if (!pEl) continue;

        const parent = posById.get(parentId);
        const parentLevel = parent?.role_level || 1;

        const px = pEl.left + pEl.width / 2 - cRect.left;
        const py = pEl.bottom - cRect.top;

        for (const [childLevel, children] of Array.from(levelMap.entries())) {
          const color = CONNECTOR_COLORS[Math.min(childLevel, 5)];
          const isAdjacent = childLevel === parentLevel + 1;

          const childCoords: { x: number; y: number; id: string }[] = [];
          for (const c of children) {
            const el = nodeMap.get(c.id);
            if (!el) continue;
            childCoords.push({
              x: el.left + el.width / 2 - cRect.left,
              y: el.top - cRect.top,
              id: c.id,
            });
          }
          if (childCoords.length === 0) continue;

          const topChildY = Math.min(...childCoords.map((c) => c.y));
          const midY = py + (topChildY - py) / 2;

          if (isAdjacent) {
            // ── Adjacent level: clean bus connector ──
            if (childCoords.length === 1) {
              const c = childCoords[0];
              if (Math.abs(px - c.x) < 2) {
                lines.push({ path: `M${px},${py} L${c.x},${c.y}`, color, opacity: 0.45 });
              } else {
                lines.push({
                  path: `M${px},${py} L${px},${midY} L${c.x},${midY} L${c.x},${c.y}`,
                  color, opacity: 0.45,
                });
              }
            } else {
              const leftX = Math.min(...childCoords.map((c) => c.x));
              const rightX = Math.max(...childCoords.map((c) => c.x));
              // Parent stem down to bus
              lines.push({ path: `M${px},${py} L${px},${midY}`, color, opacity: 0.45 });
              // Horizontal bus
              lines.push({ path: `M${leftX},${midY} L${rightX},${midY}`, color, opacity: 0.35 });
              // Drops to each child
              for (const c of childCoords) {
                lines.push({ path: `M${c.x},${midY} L${c.x},${c.y}`, color, opacity: 0.45 });
              }
            }
          } else {
            // ── Cross-level: route along the edge so lines don't cut through nodes ──
            for (const c of childCoords) {
              // Decide which edge to route along based on position
              const childIsRight = c.x > containerW / 2;
              const edgeX = childIsRight ? containerW - 12 : 12;

              lines.push({
                path: `M${px},${py} L${px},${py + 12} L${edgeX},${py + 12} L${edgeX},${c.y - 12} L${c.x},${c.y - 12} L${c.x},${c.y}`,
                color,
                opacity: 0.25,
                dashed: true,
              });
            }
          }
        }
      }

      setConnectors(lines);
      setShowLines(true);
    };

    // Wait for entrance animations to finish before measuring
    const timer = setTimeout(compute, 900);

    const observer = new ResizeObserver(() => {
      setShowLines(false);
      setTimeout(compute, 150);
    });
    if (chartRef.current) observer.observe(chartRef.current);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [positions, animateIn, selectedId]);

  /* ── Loading / Error / Empty states ── */
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-gray-500">
        Loading org chart…
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-sm">
          <p className="text-sm text-red-600 font-semibold">Couldn&apos;t load org chart</p>
          <p className="text-xs text-gray-500 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-sm text-gray-500 gap-4">
        <p>No org chart set up yet.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-gradient-to-b from-[#E8EEF4] via-[#EDF2F8] to-[#F0F4F9]">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          {/* Restaurant logo */}
          {(() => {
            const logo = getRestaurantLogo(currentName);
            return logo ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={logo}
                alt={currentName || 'Restaurant'}
                className={`mx-auto mb-4 h-14 md:h-20 w-auto object-contain ${
                  currentName?.toLowerCase().includes('shokudo') ? 'scale-110' : ''
                }`}
              />
            ) : (
              /* Fallback: WHG logo for restaurants without a specific logo */
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src="/logos/whg.png"
                alt="WHG"
                className="mx-auto mb-4 h-14 md:h-20 w-auto object-contain rounded-lg"
              />
            );
          })()}
          <h1 className="text-2xl md:text-3xl font-bold text-[#1B3A6B]">Meet Your Team</h1>
          <p className="text-sm text-gray-500 mt-1">Tap anyone to learn more about their role</p>
        </div>

        {/* Scrollable chart area for mobile */}
        <div className="overflow-x-auto pb-4">
          <div ref={chartRef} className="relative" style={{ minWidth: 650 }}>
            {/* ── SVG connector overlay ── */}
            <svg
              className="absolute top-0 left-0 pointer-events-none"
              width="100%"
              height={chartHeight || '100%'}
              style={{ overflow: 'visible' }}
            >
              {showLines &&
                connectors.map((c, i) => (
                  <path
                    key={i}
                    d={c.path}
                    stroke={c.color}
                    strokeWidth={c.dashed ? 1.5 : 2}
                    fill="none"
                    opacity={c.opacity}
                    strokeDasharray={c.dashed ? '6 4' : undefined}
                    className="transition-opacity duration-500"
                  />
                ))}
            </svg>

            {/* ── Tier rows ── */}
            <div className="flex flex-col items-center gap-10 relative z-10">
              {/* Levels 1–4 */}
              {tierKeys
                .filter((k) => k <= 4)
                .map((level) => {
                  const tier = tiers.get(level) || [];
                  const delay = (level - 1) * 200;
                  return (
                    <div key={level} className="flex flex-col items-center gap-1">
                      {/* Tier label */}
                      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-300 mb-1">
                        {LEVEL_LABEL[level]}
                      </p>
                      {/* Nodes */}
                      <div className="flex flex-wrap justify-center gap-3 md:gap-6">
                        {tier.map((p, i) => (
                          <OrgNode
                            key={p.id}
                            position={p}
                            isSelected={selectedId === p.id}
                            onSelect={handleSelect}
                            animateIn={animateIn}
                            delay={delay + i * 80}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}

              {/* Level 5 — grouped by title, side-by-side */}
              {level5.length > 0 && (
                <div className="flex flex-col items-center gap-1 w-full">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-300 mb-1">
                    {LEVEL_LABEL[5]}
                  </p>

                  <div className="flex flex-col md:flex-row items-start justify-center gap-6 md:gap-0 w-full">
                    {level5Groups.map((group, gi) => {
                      let runningIdx = 0;
                      for (let g = 0; g < gi; g++) runningIdx += level5Groups[g].items.length;

                      return (
                        <div key={group.title} className="contents">
                          {/* Separator between groups */}
                          {gi > 0 && (
                            <>
                              <div className="hidden md:flex flex-col items-center justify-center self-stretch mx-3">
                                <div className="w-px flex-1 bg-gradient-to-b from-transparent via-gray-300 to-transparent" />
                              </div>
                              <div className="md:hidden w-3/4 mx-auto h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
                            </>
                          )}
                          <div className="flex-1 flex flex-col items-center">
                            <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${
                              group.title === 'BOH' ? 'text-violet-600' : 'text-teal-600'
                            }`}>
                              {group.title}
                            </p>
                            <div className="flex flex-wrap justify-center gap-2 md:gap-3">
                              {group.items.map((p, i) => (
                                <OrgNode
                                  key={p.id}
                                  position={p}
                                  isSelected={selectedId === p.id}
                                  onSelect={handleSelect}
                                  animateIn={animateIn}
                                  delay={800 + (runningIdx + i) * 60}
                                  compact
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          {[1, 2, 3, 4].map((level) => (
            <div key={level} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${LEVEL_GRADIENT[level]}`} />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                {LEVEL_LABEL[level]}
              </span>
            </div>
          ))}
          {/* Silent Partner */}
          {positions.some((p) => p.title === 'Silent Partner') && (
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${SILENT_PARTNER_GRADIENT}`} />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                SILENT PARTNER
              </span>
            </div>
          )}
          {/* FOH / BOH */}
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${FOH_GRADIENT}`} />
            <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">FOH</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${BOH_GRADIENT}`} />
            <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">BOH</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────── org node card ───────── */
function OrgNode({
  position,
  isSelected,
  onSelect,
  animateIn,
  delay,
  compact,
}: {
  position: Position;
  isSelected: boolean;
  onSelect: (id: string) => void;
  animateIn: boolean;
  delay: number;
  compact?: boolean;
}) {
  const { gradient, ring } = getNodeColors(position);
  const isSilent = position.title === 'Silent Partner';
  const isOwner = position.role_level === 1;
  const size = compact ? 'w-12 h-12 md:w-14 md:h-14' : 'w-16 h-16 md:w-20 md:h-20';
  const textSize = compact ? 'text-sm md:text-base' : 'text-lg md:text-xl';
  const nameSize = compact ? 'text-xs md:text-sm' : 'text-sm md:text-base';

  // Initials: for positions with multi-word names (e.g. "Ramen Line"), use first letters
  const initials = position.last_initial
    ? `${position.first_name[0]}${position.last_initial}`
    : position.first_name.split(' ').map((w) => w[0]).join('');

  return (
    <button
      data-node-id={position.id}
      onClick={() => onSelect(position.id)}
      className={`relative transition-all duration-500 ease-out ${
        animateIn ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-90'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div
        className={`flex flex-col items-center p-3 rounded-2xl transition-all duration-300 ${
          isSelected
            ? 'bg-white shadow-xl scale-105 ring-2 ' + ring
            : 'hover:bg-white/80 hover:shadow-md'
        }`}
      >
        {/* Avatar */}
        <div
          className={`relative ${size} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg ${
            isOwner && !isSilent ? 'ring-3 ring-amber-300/40 ring-offset-2 ring-offset-white' : ''
          }${isSilent ? ' opacity-80' : ''}`}
        >
          {position.photo_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={position.photo_url}
              alt={`${position.first_name} ${position.last_initial}`}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className={`text-white font-bold ${textSize} tracking-tight select-none`}>
              {initials}
            </span>
          )}
          {isOwner && !isSilent && (
            <div className="absolute inset-0 rounded-full bg-amber-400/20 animate-pulse" />
          )}
        </div>

        {/* Name */}
        <p className={`mt-2 font-bold ${nameSize} text-[#1B3A6B] text-center leading-tight ${compact ? 'max-w-[100px]' : ''}`}>
          {position.first_name}{position.last_initial ? ` ${position.last_initial}.` : ''}
        </p>

        {/* Title */}
        <p
          className={`text-[10px] md:text-[11px] font-semibold uppercase tracking-wider mt-0.5 text-center ${
            isSilent ? 'text-slate-400' : isOwner ? 'text-amber-600' : 'text-gray-400'
          }`}
        >
          {position.title}
        </p>

        {/* Detail card */}
        {isSelected && position.detail && (
          <div className={`mt-2 px-3 py-2 bg-gray-50 rounded-xl ${compact ? 'max-w-[180px]' : 'max-w-[200px]'} animate-fadeIn`}>
            <p className="text-xs text-gray-600 text-center leading-relaxed">{position.detail}</p>
          </div>
        )}
      </div>
    </button>
  );
}
