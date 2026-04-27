'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';

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

/* ───────── gradient palette by role level ───────── */
const LEVEL_GRADIENT: Record<number, string> = {
  1: 'from-violet-400 to-purple-600',
  2: 'from-blue-400 to-blue-700',
  3: 'from-indigo-400 to-indigo-600',
  4: 'from-cyan-400 to-blue-500',
  5: 'from-teal-400 to-emerald-600',
};

const SPECIAL_GRADIENT: Record<string, string> = {
  silentPartner: 'from-slate-300 to-gray-500',
  boh: 'from-violet-400 to-purple-500',
  foh: 'from-teal-400 to-emerald-500',
};

function getGradient(p: Position): string {
  if (p.title === 'Silent Partner') return SPECIAL_GRADIENT.silentPartner;
  if (p.role_level === 5 && p.title === 'BOH') return SPECIAL_GRADIENT.boh;
  if (p.role_level === 5 && p.title === 'FOH') return SPECIAL_GRADIENT.foh;
  return LEVEL_GRADIENT[Math.min(p.role_level, 5)] || LEVEL_GRADIENT[5];
}

const LEVEL_LABEL: Record<number, string> = {
  1: 'Ownership',
  2: 'Management',
  3: 'Department Heads',
  4: 'Supervisors',
  5: 'Staff',
};

const LEVEL_LABEL_COLOR: Record<number, string> = {
  1: 'text-purple-700',
  2: 'text-blue-700',
  3: 'text-indigo-600',
  4: 'text-cyan-700',
  5: 'text-teal-700',
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
export default function OrgChartTab({ restaurantId, restaurantName, isAdmin }: Props) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const currentId = restaurantId;
  const currentName = restaurantName;
  const canUpload = isAdmin === true;

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

  // Photo upload handler
  const handlePhotoUpload = useCallback(async (positionId: string, file: File) => {
    setUploadingId(positionId);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('positionId', positionId);

      const res = await fetch('/api/org-chart/photo', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Upload failed');
      }

      const { photo_url } = await res.json();

      // Update position in local state
      setPositions((prev) =>
        prev.map((p) => (p.id === positionId ? { ...p, photo_url } : p))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setUploadingId(null);
    }
  }, []);

  // Photo remove handler
  const handlePhotoRemove = useCallback(async (positionId: string) => {
    if (!confirm('Remove this photo?')) return;
    setUploadingId(positionId);
    try {
      const res = await fetch(`/api/org-chart/photo?positionId=${positionId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Failed to remove');
      }
      setPositions((prev) =>
        prev.map((p) => (p.id === positionId ? { ...p, photo_url: null } : p))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove photo.');
    } finally {
      setUploadingId(null);
    }
  }, []);

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
    <div className="flex-1 overflow-y-auto overflow-x-hidden bg-[#EFF3F7]">
      <div className="max-w-lg mx-auto px-4 py-6 md:py-8">
        {/* Header */}
        <div className="text-center mb-6">
          {logo && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={logo}
              alt={currentName || 'Restaurant'}
              className="mx-auto mb-2 h-14 md:h-16 w-auto object-contain"
            />
          )}
          <p className="text-[11px] uppercase tracking-[1.5px] text-gray-400 font-medium mb-1">
            {currentName || 'Wong Hospitality Group'}
          </p>
          <h1 className="text-xl font-semibold text-[#1B3A6B]">Meet your team</h1>
          <p className="text-xs text-gray-400 mt-1">Tap anyone to learn more</p>
        </div>

        {/* ── Tier sections ── */}
        <div className="space-y-3">
          {tierKeys.map((level) => {
            const tier = tiers.get(level) || [];

            // Level 1 (Ownership): centered avatar layout
            if (level === 1) {
              return (
                <TierCard key={level} level={level}>
                  <div className="flex flex-wrap justify-center gap-6">
                    {tier.map((p) => (
                      <OwnerAvatar
                        key={p.id}
                        position={p}
                        expanded={expandedId === p.id}
                        onToggle={handleToggle}
                        directReports={getDirectReports(p.id)}
                        canUpload={canUpload}
                        uploading={uploadingId === p.id}
                        onPhotoUpload={handlePhotoUpload}
                        onPhotoRemove={handlePhotoRemove}
                      />
                    ))}
                  </div>
                </TierCard>
              );
            }

            // Level 5 (Staff): compact grid split by FOH/BOH
            if (level === 5) {
              const foh = tier.filter((p) => p.title === 'FOH');
              const boh = tier.filter((p) => p.title === 'BOH');
              const other = tier.filter((p) => p.title !== 'FOH' && p.title !== 'BOH');

              return (
                <div key={level} className="space-y-3">
                  {foh.length > 0 && (
                    <TierCard level={level} subLabel="Front of house">
                      <div className="grid grid-cols-2 gap-2">
                        {foh.map((p) => (
                          <StaffChip
                            key={p.id}
                            position={p}
                            expanded={expandedId === p.id}
                            onToggle={handleToggle}
                            reportsToName={getReportsToName(p)}
                          />
                        ))}
                      </div>
                    </TierCard>
                  )}
                  {boh.length > 0 && (
                    <TierCard level={level} subLabel="Back of house">
                      <div className="grid grid-cols-2 gap-2">
                        {boh.map((p) => (
                          <StaffChip
                            key={p.id}
                            position={p}
                            expanded={expandedId === p.id}
                            onToggle={handleToggle}
                            reportsToName={getReportsToName(p)}
                          />
                        ))}
                      </div>
                    </TierCard>
                  )}
                  {other.length > 0 && (
                    <TierCard level={level}>
                      <div className="grid grid-cols-2 gap-2">
                        {other.map((p) => (
                          <StaffChip
                            key={p.id}
                            position={p}
                            expanded={expandedId === p.id}
                            onToggle={handleToggle}
                            reportsToName={getReportsToName(p)}
                          />
                        ))}
                      </div>
                    </TierCard>
                  )}
                </div>
              );
            }

            // Levels 2-4: list layout with chevron
            return (
              <TierCard key={level} level={level}>
                <div className="space-y-2">
                  {tier.map((p) => (
                    <ListCard
                      key={p.id}
                      position={p}
                      expanded={expandedId === p.id}
                      onToggle={handleToggle}
                      reportsToName={getReportsToName(p)}
                      directReports={getDirectReports(p.id)}
                      canUpload={canUpload}
                      uploading={uploadingId === p.id}
                      onPhotoUpload={handlePhotoUpload}
                      onPhotoRemove={handlePhotoRemove}
                    />
                  ))}
                </div>
              </TierCard>
            );
          })}
        </div>

        {/* Bottom padding for bottom nav */}
        <div className="h-4" />
      </div>
    </div>
  );
}

/* ───────── tier card wrapper ───────── */
function TierCard({ level, subLabel, children }: { level: number; subLabel?: string; children: React.ReactNode }) {
  const labelColor = LEVEL_LABEL_COLOR[Math.min(level, 5)] || 'text-gray-600';
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
      <p className={`text-[11px] uppercase tracking-[1px] font-semibold ${labelColor} mb-3`}>
        {subLabel || LEVEL_LABEL[Math.min(level, 5)]}
      </p>
      {children}
    </div>
  );
}

/* ───────── photo upload button (reused across layouts) ───────── */
function PhotoUploadOverlay({
  positionId,
  hasPhoto,
  uploading,
  onUpload,
  onRemove,
  size = 'md',
}: {
  positionId: string;
  hasPhoto: boolean;
  uploading: boolean;
  onUpload: (id: string, file: File) => void;
  onRemove: (id: string) => void;
  size?: 'sm' | 'md' | 'lg';
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const sizeClasses = size === 'lg' ? 'w-7 h-7 -bottom-0.5 -right-0.5' : size === 'md' ? 'w-6 h-6 -bottom-0.5 -right-0.5' : 'w-5 h-5 -bottom-0 -right-0';
  const iconSize = size === 'sm' ? '10' : '12';

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(positionId, file);
          e.target.value = '';
        }}
      />
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (hasPhoto) {
            // Show options: replace or remove
            if (confirm('Replace photo? (Cancel to remove instead)')) {
              inputRef.current?.click();
            } else {
              onRemove(positionId);
            }
          } else {
            inputRef.current?.click();
          }
        }}
        className={`absolute ${sizeClasses} rounded-full bg-[#1B3A6B] border-2 border-white flex items-center justify-center shadow-md hover:bg-[#2E86C1] transition-colors`}
        disabled={uploading}
      >
        {uploading ? (
          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        )}
      </button>
    </>
  );
}

/* ───────── ownership avatar (centered, large) ───────── */
function OwnerAvatar({
  position,
  expanded,
  onToggle,
  directReports,
  canUpload,
  uploading,
  onPhotoUpload,
  onPhotoRemove,
}: {
  position: Position;
  expanded: boolean;
  onToggle: (id: string) => void;
  directReports: Position[];
  canUpload: boolean;
  uploading: boolean;
  onPhotoUpload: (id: string, file: File) => void;
  onPhotoRemove: (id: string) => void;
}) {
  const gradient = getGradient(position);
  const isSilent = position.title === 'Silent Partner';
  const initials = position.last_initial
    ? `${position.first_name[0]}${position.last_initial}`
    : position.first_name.split(' ').map((w) => w[0]).join('');
  const fullName = `${position.first_name}${position.last_initial ? ` ${position.last_initial}.` : ''}`;

  return (
    <button onClick={() => onToggle(position.id)} className="tap-highlight text-center group">
      <div className="relative mx-auto mb-2">
        <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center border-[3px] border-white shadow-md transition-transform group-active:scale-95 ${expanded ? 'ring-2 ring-blue-200 ring-offset-2' : ''}`}>
          {position.photo_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={position.photo_url} alt={fullName} className="w-full h-full rounded-full object-cover" />
          ) : (
            <span className="text-white font-semibold text-base">{initials}</span>
          )}
        </div>
        {canUpload && (
          <PhotoUploadOverlay
            positionId={position.id}
            hasPhoto={!!position.photo_url}
            uploading={uploading}
            onUpload={onPhotoUpload}
            onRemove={onPhotoRemove}
            size="md"
          />
        )}
      </div>
      <p className="text-sm font-semibold text-[#1B3A6B]">{fullName}</p>
      <p className={`text-[11px] ${isSilent ? 'text-slate-400' : 'text-gray-400'}`}>{position.title}</p>

      {expanded && (
        <div className="mt-2 text-left bg-gray-50 rounded-lg p-2.5 animate-fadeIn">
          {directReports.length > 0 && (
            <p className="text-xs text-gray-500">
              Manages <span className="font-semibold text-[#1B3A6B]">{directReports.length}</span> {directReports.length === 1 ? 'person' : 'people'}
            </p>
          )}
          {position.detail && (
            <p className="text-xs text-gray-400 mt-1">{position.detail}</p>
          )}
        </div>
      )}
    </button>
  );
}

/* ───────── list card (management / dept heads / supervisors) ───���───── */
function ListCard({
  position,
  expanded,
  onToggle,
  reportsToName,
  directReports,
  canUpload,
  uploading,
  onPhotoUpload,
  onPhotoRemove,
}: {
  position: Position;
  expanded: boolean;
  onToggle: (id: string) => void;
  reportsToName: string | null;
  directReports: Position[];
  canUpload: boolean;
  uploading: boolean;
  onPhotoUpload: (id: string, file: File) => void;
  onPhotoRemove: (id: string) => void;
}) {
  const gradient = getGradient(position);
  const initials = position.last_initial
    ? `${position.first_name[0]}${position.last_initial}`
    : position.first_name.split(' ').map((w) => w[0]).join('');
  const fullName = `${position.first_name}${position.last_initial ? ` ${position.last_initial}.` : ''}`;

  return (
    <button
      onClick={() => onToggle(position.id)}
      className={`tap-highlight text-left w-full rounded-xl p-3 transition-all ${
        expanded ? 'bg-blue-50/60 border border-blue-100' : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}>
            {position.photo_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={position.photo_url} alt={fullName} className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-white font-semibold text-sm">{initials}</span>
            )}
          </div>
          {canUpload && (
            <PhotoUploadOverlay
              positionId={position.id}
              hasPhoto={!!position.photo_url}
              uploading={uploading}
              onUpload={onPhotoUpload}
              onRemove={onPhotoRemove}
              size="sm"
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#1B3A6B]">{fullName}</p>
          <p className="text-xs text-gray-400">{position.title}</p>
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`text-gray-300 flex-shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>

      {expanded && (
        <div className="mt-3 pt-2.5 border-t border-gray-200/60 animate-fadeIn space-y-1.5 ml-14">
          {reportsToName && (
            <p className="text-xs text-gray-400">
              Reports to <span className="font-semibold text-[#1B3A6B]">{reportsToName}</span>
            </p>
          )}
          {directReports.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-1">
                Manages <span className="font-semibold text-[#1B3A6B]">{directReports.length}</span>:
              </p>
              <div className="flex flex-wrap gap-1">
                {directReports.map((dr) => (
                  <span key={dr.id} className="px-2 py-0.5 bg-white rounded-full text-[11px] font-medium text-[#1B3A6B] border border-gray-100 shadow-sm">
                    {dr.first_name}{dr.last_initial ? ` ${dr.last_initial}.` : ''}
                  </span>
                ))}
              </div>
            </div>
          )}
          {position.detail && (
            <p className="text-xs text-gray-400 leading-relaxed">{position.detail}</p>
          )}
        </div>
      )}
    </button>
  );
}

/* ───────── staff role icon (replaces initials for level 5) ───────── */
function StaffRoleIcon({ title }: { title: string }) {
  if (title === 'FOH') {
    // Person with tray — server/host icon
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="7" r="3" />
        <path d="M5 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2" />
      </svg>
    );
  }
  if (title === 'BOH') {
    // Chef hat icon
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6z" />
        <line x1="6" y1="17" x2="18" y2="17" />
      </svg>
    );
  }
  // Generic staff
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="7" r="3" />
      <path d="M5 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2" />
    </svg>
  );
}

/* ───────── staff chip (compact grid) ───────── */
function StaffChip({
  position,
  expanded,
  onToggle,
  reportsToName,
}: {
  position: Position;
  expanded: boolean;
  onToggle: (id: string) => void;
  reportsToName: string | null;
  canUpload?: boolean;
  uploading?: boolean;
  onPhotoUpload?: (id: string, file: File) => void;
  onPhotoRemove?: (id: string) => void;
}) {
  const gradient = getGradient(position);
  const fullName = `${position.first_name}${position.last_initial ? ` ${position.last_initial}.` : ''}`;

  return (
    <button
      onClick={() => onToggle(position.id)}
      className={`tap-highlight text-center w-full rounded-xl py-3 px-2 transition-all ${
        expanded ? 'bg-blue-50/60 border border-blue-100 col-span-2' : 'bg-gray-50 border border-transparent hover:bg-gray-100'
      }`}
    >
      <div className="relative mx-auto mb-1.5 w-10 h-10">
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}>
          <StaffRoleIcon title={position.title} />
        </div>
      </div>
      <p className="text-xs font-semibold text-[#1B3A6B] truncate">{fullName}</p>

      {expanded && reportsToName && (
        <p className="text-[11px] text-gray-400 mt-1.5 animate-fadeIn">
          Reports to <span className="font-medium text-[#1B3A6B]">{reportsToName}</span>
        </p>
      )}
    </button>
  );
}
