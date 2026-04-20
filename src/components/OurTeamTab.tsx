'use client';

import { useEffect, useState, useCallback } from 'react';
import OrgChartTab from './OrgChartTab';
import PreshiftTab from './PreshiftTab';

/* ───────── types ───────── */
interface Location {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  restaurantId: string | null;
  restaurantName: string | null;
  role: string;
  language: 'en' | 'es';
}

type SubTab = 'team' | 'preshift';

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
export default function OurTeamTab({ restaurantId, restaurantName, role, language }: Props) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [activeLocationId, setActiveLocationId] = useState<string | null>(restaurantId);
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('team');
  const [loading, setLoading] = useState(true);

  const isAdmin = role === 'admin';
  const isManager = ['manager', 'assistant_manager', 'admin'].includes(role);
  const isES = language === 'es';

  // Fetch accessible locations
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/my-locations');
        const json = await res.json();
        const locs: Location[] = json.locations || [];
        setLocations(locs);

        // Default to first location if none selected
        if (locs.length > 0 && !activeLocationId) {
          setActiveLocationId(locs[0].id);
        }
      } catch {
        // fallback — use the profile's own restaurant
        if (restaurantId && restaurantName) {
          setLocations([{ id: restaurantId, name: restaurantName, slug: '' }]);
          setActiveLocationId(restaurantId);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLocationChange = useCallback((locId: string) => {
    setActiveLocationId(locId);
    // Keep current sub-tab when switching locations
  }, []);

  const activeLocation = locations.find((l) => l.id === activeLocationId);
  const activeLocationName = activeLocation?.name || restaurantName;
  const hasMultipleLocations = locations.length > 1;
  const logo = getRestaurantLogo(activeLocationName);

  const subTabs: { key: SubTab; label: string; labelEs: string; emoji: string }[] = [
    { key: 'team', label: 'Team Members', labelEs: 'Miembros del Equipo', emoji: '👥' },
    { key: 'preshift', label: 'Pre-Shift Notes', labelEs: 'Notas Pre-Turno', emoji: '📋' },
  ];

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-gray-500">
        {isES ? 'Cargando...' : 'Loading...'}
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-gray-500">
        {isES ? 'No hay ubicaciones asignadas.' : 'No locations assigned.'}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* ── Location tabs (only if multiple locations) ── */}
      {hasMultipleLocations && (
        <div className="flex items-center border-b border-[#D6DEE8]/60 bg-[#ECF0F6] px-2 md:px-4 flex-shrink-0">
          <div className="flex gap-0.5 overflow-x-auto py-1 scrollbar-hide">
            {locations.map((loc) => {
              const isActive = activeLocationId === loc.id;
              const locLogo = getRestaurantLogo(loc.name);

              return (
                <button
                  key={loc.id}
                  onClick={() => handleLocationChange(loc.id)}
                  className={`relative flex items-center gap-1.5 px-3 md:px-4 py-2 text-xs md:text-sm font-semibold transition-all whitespace-nowrap rounded-t-lg ${
                    isActive
                      ? 'text-[#1B3A6B] bg-white/70 shadow-sm'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-white/30'
                  }`}
                >
                  {locLogo ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={locLogo}
                      alt={loc.name}
                      className="h-4 md:h-5 w-auto object-contain"
                    />
                  ) : (
                    <span className="text-sm">🏪</span>
                  )}
                  <span className="hidden md:inline">{loc.name}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#1B3A6B] rounded-t-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Sub-tab bar (Team Members / Pre-Shift Notes) ── */}
      {isManager && (
        <div className="flex items-center border-b border-[#D6DEE8]/40 bg-[#F0F4F9] px-2 md:px-4 flex-shrink-0">
          <div className="flex gap-1">
            {subTabs.map((t) => {
              const isActive = activeSubTab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveSubTab(t.key)}
                  className={`relative flex items-center gap-1.5 px-3 md:px-4 py-2 text-[11px] md:text-xs font-semibold transition-colors ${
                    isActive
                      ? 'text-[#2E86C1]'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <span className="text-sm">{t.emoji}</span>
                  <span>{isES ? t.labelEs : t.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2E86C1] rounded-t-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Current location indicator (if single location) */}
          {!hasMultipleLocations && activeLocationName && (
            <div className="ml-auto flex items-center gap-1.5 text-[10px] text-gray-400">
              {logo && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={logo} alt="" className="h-3.5 w-auto object-contain opacity-40" />
              )}
              <span>{activeLocationName}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Tab content ── */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeSubTab === 'team' ? (
          <OrgChartTab
            key={`org-${activeLocationId}`}
            restaurantId={activeLocationId}
            restaurantName={activeLocationName || null}
            isAdmin={false}
          />
        ) : (
          <PreshiftTab
            key={`preshift-${activeLocationId}`}
            language={language}
            restaurantName={activeLocationName || null}
            restaurantId={activeLocationId}
          />
        )}
      </div>
    </div>
  );
}
