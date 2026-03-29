import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
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
}
