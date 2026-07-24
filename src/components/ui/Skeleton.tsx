/* ───────── Skeleton ─────────
 *
 * Loading placeholders shaped like the content they replace, so grids
 * don't reflow on arrival (the social-feed loading pattern — no
 * spinners on content surfaces).
 */

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-gray-200/60 rounded animate-pulse ${className}`} />;
}

/** Photo-tile grid placeholder (menu/systems browse screens). */
export function SkeletonTileGrid({ count = 6, cols = 'grid-cols-2 md:grid-cols-3' }: { count?: number; cols?: string }) {
  return (
    <div className={`grid ${cols} gap-3`}>
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-white/60 rounded-2xl overflow-hidden animate-pulse">
          <div className="aspect-square bg-gray-200/60" />
          <div className="p-3 space-y-2">
            <div className="h-3 bg-gray-200/60 rounded w-3/4" />
            <div className="h-2.5 bg-gray-200/60 rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Feed-card stack placeholder (Home and list screens). */
export function SkeletonCards({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-white/60 rounded-2xl p-4 animate-pulse space-y-2.5">
          <div className="h-3 bg-gray-200/60 rounded w-1/3" />
          <div className="h-2.5 bg-gray-200/60 rounded w-full" />
          <div className="h-2.5 bg-gray-200/60 rounded w-2/3" />
        </div>
      ))}
    </div>
  );
}
