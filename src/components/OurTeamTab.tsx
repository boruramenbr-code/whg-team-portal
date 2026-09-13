'use client';

import { useEffect, useState, useCallback } from 'react';
import OrgChartTab from './OrgChartTab';

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
  const [loading, setLoading] = useState(true);

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

        if (locs.length > 0 && !activeLocationId) {
          setActiveLocationId(locs[0].id);
        }
      } catch {
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
  }, []);

  const activeLocation = locations.find((l) => l.id === activeLocationId);
  const activeLocationName = activeLocation?.name || restaurantName;
  const hasMultipleLocations = locations.length > 1;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-whg-dim bg-gradient-to-b from-whg-night via-[#101B2E] to-whg-night2">
        {isES ? 'Cargando...' : 'Loading...'}
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-whg-dim bg-gradient-to-b from-whg-night via-[#101B2E] to-whg-night2">
        {isES ? 'No hay ubicaciones asignadas.' : 'No locations assigned.'}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* ── Location switcher (only if multiple locations) ── */}
      {hasMultipleLocations && (
        <div className="border-b border-whg-line bg-whg-night px-3 md:px-4 py-2 flex-shrink-0">
          <div className="flex flex-wrap gap-2 justify-center">
            {locations.map((loc) => {
              const isActive = activeLocationId === loc.id;

              return (
                <button
                  key={loc.id}
                  onClick={() => handleLocationChange(loc.id)}
                  className={`tap-highlight px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-whg-gold text-whg-goldink shadow-md border-2 border-whg-gold'
                      : 'bg-white/10 text-whg-dim hover:bg-white/20 hover:text-whg-snow border-2 border-transparent'
                  }`}
                >
                  {loc.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Team directory content ── */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <OrgChartTab
          key={`org-${activeLocationId}`}
          restaurantId={activeLocationId}
          restaurantName={activeLocationName || null}
          isAdmin={['admin', 'manager', 'assistant_manager'].includes(role)}
        />
      </div>
    </div>
  );
}
