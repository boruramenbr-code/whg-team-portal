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

/* ───────── color palette by role level ───────── */
const LEVEL_COLORS: Record<number, { bg: string; text: string; border: string; gradient: string }> = {
  1: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', gradient: 'from-amber-500 to-yellow-600' },
  2: { bg: 'bg-blue-50', text: 'text-[#1B3A6B]', border: 'border-blue-200', gradient: 'from-[#1B3A6B] to-[#2E86C1]' },
  3: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', gradient: 'from-blue-500 to-indigo-500' },
  4: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', gradient: 'from-cyan-500 to-blue-500' },
  5: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', gradient: 'from-teal-400 to-emerald-500' },
};

const SPECIAL_COLORS = {
  silentPartner: { bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-200', gradient: 'from-slate-400 to-gray-500' },
  boh: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', gradient: 'from-violet-400 to-purple-500' },
  foh: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', gradient: 'from-teal-400 to-emerald-500' },
};

function getColors(p: Position) {
  if (p.title === 'Silent Partner') return SPECIAL_COLORS.silentPartner;
  if (p.role_level === 5 && p.title === 'BOH') return SPECIAL_COLORS.boh;
  if (p.role_level === 5 && p.title === 'FOH') return SPECIAL_COLORS.foh;
  return LEVEL_COLORS[Math.min(p.role_level, 5)];
}

const LEVEL_LABEL: Record<number, string> = {
  1: 'Ownership',
  2: 'Management',
  3: 'Department Heads',
  4: 'Supervisors',
  5: 'Staff',
};

const LEVEL_ICON: Record<number, string> = {
  1: '👑',
  2: '🎯',
  3: '📋',
  4: '⭐',
  5: '💪',
};

/* ───────── restaurant logo mapping ───────── */
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
export default function OrgChartTab({ restaurantId, restaurantName }: Props) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const currentId = restaurantId;
  const currentName = restaurantName;

  useEffect(() => {
    if (!currentId) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      setExpandedId(null);
      try {
        const res = await fetch(`/api/org-chart?restaurant_id=${currentId}`);
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error || `Request failed (${res.status})`);
        }
        const json = await res.json();
        if (!cancelled) setPositions(json.positions);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [currentId]);

  const handleToggle = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  // Build position lookup and group by tier
  const posById = useMemo(() => {
    const map = new Map<string, Position>();
    for (const p of positions) map.set(p.id, p);
    return map;
  }, [positions]);

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

  // Find who a person reports to
  const getReportsToName = useCallback((p: Position): string | null => {
    if (!p.reports_to) return null;
    const boss = posById.get(p.reports_to);
    if (!boss) return null;
    return `${boss.first_name}${boss.last_initial ? ` ${boss.last_initial}.` : ''}`;
  }, [posById]);

  // Find direct reports
  const getDirectReports = useCallback((id: string): Position[] => {
    return positions.filter((p) => p.reports_to === id).sort((a, b) => a.sort_order - b.sort_order);
  }, [positions]);

  /* ── Loading / Error / Empty states ── */
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-gray-500">
        Loading team…
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-sm">
          <p className="text-sm text-red-600 font-semibold">Couldn&apos;t load team</p>
          <p className="text-xs text-gray-500 mt-1">{error}</p>
        </div>
      </div>
    );
  }
  if (positions.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-sm text-gray-500 gap-4">
        <p>No team set up yet.</p>
      </div>
    );
  }

  const logo = getRestaurantLogo(currentName);

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden bg-gradient-to-b from-[#C5D3E2] via-[#CDDAE7] to-[#D5E0EB]">
      <div className="max-w-2xl mx-auto px-4 py-6 md:py-8">
        {/* Header */}
        <div className="text-center mb-6">
          {logo ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={logo}
              alt={currentName || 'Restaurant'}
              className="mx-auto mb-3 h-10 md:h-16 w-auto object-contain"
            />
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src="/logos/whg.png"
              alt="WHG"
              className="mx-auto mb-3 h-10 md:h-16 w-auto object-contain rounded-lg"
            />
          )}
          <h1 className="text-xl md:text-2xl font-bold text-[#1B3A6B]">Meet Your Team</h1>
          <p className="text-sm text-gray-500 mt-1">Tap anyone to see their role and who they manage</p>
        </div>

        {/* ── Tier sections ── */}
        <div className="space-y-5">
          {tierKeys.map((level) => {
            const tier = tiers.get(level) || [];
            const levelColors = LEVEL_COLORS[Math.min(level, 5)];

            // Group level 5 by FOH/BOH
            if (level === 5) {
              const foh = tier.filter((p) => p.title === 'FOH');
              const boh = tier.filter((p) => p.title === 'BOH');
              const other = tier.filter((p) => p.title !== 'FOH' && p.title !== 'BOH');

              return (
                <div key={level}>
                  <TierHeader level={level} />

                  {foh.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-bold text-teal-600 uppercase tracking-wider px-1 mb-2">Front of House</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {foh.map((p) => (
                          <TeamCard
                            key={p.id}
                            position={p}
                            expanded={expandedId === p.id}
                            onToggle={handleToggle}
                            reportsToName={getReportsToName(p)}
                            directReports={getDirectReports(p.id)}
                            compact
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {boh.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-bold text-purple-600 uppercase tracking-wider px-1 mb-2">Back of House</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {boh.map((p) => (
                          <TeamCard
                            key={p.id}
                            position={p}
                            expanded={expandedId === p.id}
                            onToggle={handleToggle}
                            reportsToName={getReportsToName(p)}
                            directReports={getDirectReports(p.id)}
                            compact
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {other.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {other.map((p) => (
                        <TeamCard
                          key={p.id}
                          position={p}
                          expanded={expandedId === p.id}
                          onToggle={handleToggle}
                          reportsToName={getReportsToName(p)}
                          directReports={getDirectReports(p.id)}
                          compact
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div key={level}>
                <TierHeader level={level} />
                <div className="space-y-2">
                  {tier.map((p) => (
                    <TeamCard
                      key={p.id}
                      position={p}
                      expanded={expandedId === p.id}
                      onToggle={handleToggle}
                      reportsToName={getReportsToName(p)}
                      directReports={getDirectReports(p.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom padding for bottom nav */}
        <div className="h-4" />
      </div>
    </div>
  );
}

/* ───────── tier header ───────── */
function TierHeader({ level }: { level: number }) {
  const colors = LEVEL_COLORS[Math.min(level, 5)];
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-lg">{LEVEL_ICON[Math.min(level, 5)]}</span>
      <h2 className={`text-sm font-bold uppercase tracking-wider ${colors.text}`}>
        {LEVEL_LABEL[Math.min(level, 5)]}
      </h2>
      <div className={`flex-1 h-px ${colors.border} border-t`} />
    </div>
  );
}

/* ───────── team member card ───────── */
function TeamCard({
  position,
  expanded,
  onToggle,
  reportsToName,
  directReports,
  compact,
}: {
  position: Position;
  expanded: boolean;
  onToggle: (id: string) => void;
  reportsToName: string | null;
  directReports: Position[];
  compact?: boolean;
}) {
  const colors = getColors(position);
  const isSilent = position.title === 'Silent Partner';
  const isOwner = position.role_level === 1;

  const initials = position.last_initial
    ? `${position.first_name[0]}${position.last_initial}`
    : position.first_name.split(' ').map((w) => w[0]).join('');

  const fullName = `${position.first_name}${position.last_initial ? ` ${position.last_initial}.` : ''}`;

  if (compact) {
    // Compact card for staff level — smaller, grid layout
    return (
      <button
        onClick={() => onToggle(position.id)}
        className={`tap-highlight text-left w-full rounded-xl p-3 transition-all ${
          expanded
            ? `bg-white shadow-lg border-2 ${colors.border} col-span-2 md:col-span-1`
            : 'bg-white/80 shadow-sm border border-gray-100 hover:shadow-md hover:bg-white'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${colors.gradient} flex items-center justify-center flex-shrink-0`}>
            <span className="text-white font-bold text-xs">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#1B3A6B] truncate">{fullName}</p>
            <p className={`text-[10px] font-medium ${colors.text} opacity-70`}>{position.title}</p>
          </div>
        </div>

        {expanded && (
          <div className="mt-3 pt-2.5 border-t border-gray-100 animate-fadeIn">
            {reportsToName && (
              <div className="flex items-center gap-1.5 mb-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 flex-shrink-0">
                  <polyline points="18 15 12 9 6 15" />
                </svg>
                <p className="text-xs text-gray-500">Reports to <span className="font-semibold text-[#1B3A6B]">{reportsToName}</span></p>
              </div>
            )}
            {position.detail && (
              <p className="text-xs text-gray-500 leading-relaxed">{position.detail}</p>
            )}
          </div>
        )}
      </button>
    );
  }

  // Full card for leadership levels
  return (
    <button
      onClick={() => onToggle(position.id)}
      className={`tap-highlight text-left w-full rounded-xl p-4 transition-all ${
        expanded
          ? `bg-white shadow-lg border-2 ${colors.border}`
          : 'bg-white/80 shadow-sm border border-gray-100 hover:shadow-md hover:bg-white'
      }`}
    >
      <div className="flex items-center gap-3.5">
        {/* Avatar */}
        <div className={`relative w-12 h-12 rounded-full bg-gradient-to-br ${colors.gradient} flex items-center justify-center flex-shrink-0 shadow-md ${
          isOwner && !isSilent ? 'ring-2 ring-amber-300/50 ring-offset-2 ring-offset-white' : ''
        }`}>
          {position.photo_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={position.photo_url}
              alt={fullName}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-white font-bold text-base">{initials}</span>
          )}
        </div>

        {/* Name + Title */}
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-[#1B3A6B]">{fullName}</p>
          <p className={`text-xs font-semibold ${isSilent ? 'text-slate-400' : isOwner ? 'text-amber-600' : colors.text} ${isSilent ? '' : 'opacity-80'}`}>
            {position.title}
          </p>
        </div>

        {/* Expand indicator */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`text-gray-300 flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-100 animate-fadeIn space-y-2">
          {reportsToName && (
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 flex-shrink-0">
                <polyline points="18 15 12 9 6 15" />
              </svg>
              <p className="text-sm text-gray-500">Reports to <span className="font-semibold text-[#1B3A6B]">{reportsToName}</span></p>
            </div>
          )}

          {directReports.length > 0 && (
            <div className="flex items-start gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 flex-shrink-0 mt-0.5">
                <polyline points="6 9 12 15 18 9" />
              </svg>
              <div>
                <p className="text-sm text-gray-500 mb-1">
                  Manages <span className="font-semibold text-[#1B3A6B]">{directReports.length}</span> {directReports.length === 1 ? 'person' : 'people'}:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {directReports.map((dr) => {
                    const drColors = getColors(dr);
                    return (
                      <span
                        key={dr.id}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${drColors.bg} ${drColors.text}`}
                      >
                        {dr.first_name}{dr.last_initial ? ` ${dr.last_initial}.` : ''}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {position.detail && (
            <p className="text-sm text-gray-500 leading-relaxed pl-6">{position.detail}</p>
          )}
        </div>
      )}
    </button>
  );
}
