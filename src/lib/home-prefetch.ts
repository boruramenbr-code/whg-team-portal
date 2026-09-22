/**
 * Home's data request, started from /dashboard's HTML (Sept 2026 load-time
 * pass). HomeTab normally asks for /api/home only after every script has
 * downloaded and React has started — ~2s into an open. This tiny inline
 * script fires the same request the moment the page arrives, so the data
 * is on its way while the app boots. HomeTab picks it up if the address
 * matches (same saved-restaurant rule), and fetches normally otherwise.
 */

declare global {
  interface Window {
    __whgHome?: { url: string; res: Promise<Response> };
  }
}

/** Must build the same URL as HomeTab's loadHome. */
export const HOME_PREFETCH_SCRIPT =
  "try{var r=localStorage.getItem('whg_view_restaurant_id');" +
  "var u=r?'/api/home?restaurant_id='+encodeURIComponent(r):'/api/home';" +
  "window.__whgHome={url:u,res:fetch(u,{cache:'no-store'})}}catch(e){}";

/** The early request for this URL, once — null if there isn't a matching one. */
export function takeHomePrefetch(url: string): Promise<Response> | null {
  if (typeof window === 'undefined') return null;
  const pre = window.__whgHome;
  window.__whgHome = undefined;
  if (!pre || pre.url !== url) return null;
  return pre.res.catch(() => fetch(url, { cache: 'no-store' }));
}
