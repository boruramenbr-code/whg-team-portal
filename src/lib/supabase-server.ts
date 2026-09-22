import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

type ServerClient = ReturnType<typeof createServerClient>;
type UserCheck = ReturnType<ServerClient['auth']['getUser']>;

// ── Once per request (Sept 2026 load-time pass) ──
// Home's bundle runs eight routes' handlers in-process, and each one asked
// Supabase Auth to verify the same cookie and re-read the same profile row
// — ~16 round trips to a small free-tier database for two answers.
// cookies() is the same object for the whole request (and a new one for
// the next), so it keys these per-request memos. Every request still
// verifies with Supabase Auth; routes that sign in or out don't re-check
// within the same request.
const userChecks = new WeakMap<object, UserCheck>();
const profileLoads = new WeakMap<object, Promise<MyProfile | null>>();
const locationLoads = new WeakMap<object, Promise<string[]>>();

export function createClient() {
  const cookieStore = cookies();
  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll().map((cookie) => {
            // The browser Supabase client (createBrowserClient) URL-encodes cookie
            // values via the `cookie` package, but the Node.js serverless runtime
            // does NOT auto-decode them. Decode here so JSON.parse succeeds.
            let value = cookie.value;
            if (value.includes('%')) {
              try { value = decodeURIComponent(value); } catch { /* use raw */ }
            }
            return { name: cookie.name, value };
          });
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — middleware handles session refresh
          }
        },
      },
    }
  );

  const checkWithAuth = client.auth.getUser.bind(client.auth);
  client.auth.getUser = ((jwt?: string) => {
    if (jwt) return checkWithAuth(jwt);
    let check = userChecks.get(cookieStore);
    if (!check) {
      check = checkWithAuth();
      userChecks.set(cookieStore, check);
    }
    return check;
  }) as ServerClient['auth']['getUser'];

  return client;
}

/** The signed-in person's own profile basics. */
export interface MyProfile {
  id: string;
  role: string;
  restaurant_id: string | null;
  status: string;
  onboarding_category: string | null;
}

/**
 * The signed-in person's profile basics, read once per request. Null when
 * signed out or the row is missing — callers treat that like before.
 */
export function getMyProfile(): Promise<MyProfile | null> {
  const cookieStore = cookies();
  let load = profileLoads.get(cookieStore);
  if (!load) {
    load = (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('id, role, restaurant_id, status, onboarding_category')
        .eq('id', user.id)
        .single();
      return (data as MyProfile | null) ?? null;
    })();
    profileLoads.set(cookieStore, load);
  }
  return load;
}

/** Restaurant ids from the signed-in person's extra location assignments, read once per request. */
export function getMyExtraLocationIds(): Promise<string[]> {
  const cookieStore = cookies();
  let load = locationLoads.get(cookieStore);
  if (!load) {
    load = (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase
        .from('user_locations')
        .select('restaurant_id')
        .eq('profile_id', user.id);
      return (data ?? []).map((l) => l.restaurant_id as string);
    })();
    locationLoads.set(cookieStore, load);
  }
  return load;
}
