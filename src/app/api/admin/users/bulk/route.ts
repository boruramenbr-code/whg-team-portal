import { createClient } from '@/lib/supabase-server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';
import { randomUUID } from 'crypto';

// Extend Vercel timeout — bulk creation calls Supabase auth admin sequentially,
// which can take ~500ms per row. 60s window comfortably handles ~100 rows.
export const maxDuration = 60;

// Admin client uses service role key — SERVER ONLY
function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

const ELEVATED_ROLES = ['manager', 'assistant_manager', 'admin'];
const VALID_ROLES = ['employee', 'manager', 'assistant_manager', 'admin'];

interface BulkRow {
  full_name?: string;
  restaurant_id?: string;
  role?: string;
  pin?: string;
  email?: string;
  password?: string;
  date_of_birth?: string | null;
  preferred_language?: string;
  welcome_until?: string | null;
}

interface RowResult {
  index: number;
  full_name: string;
  success: boolean;
  error?: string;
}

/**
 * POST /api/admin/users/bulk
 *
 * Admin-only bulk creation endpoint. Accepts an array of rows; processes each
 * sequentially (Supabase auth admin API doesn't love parallel calls). Returns
 * per-row results so the UI can show row-by-row outcomes — never aborts the
 * whole batch on a single bad row.
 *
 * Body: { rows: BulkRow[] }
 * Returns: { results: RowResult[], created: number, failed: number }
 */
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: me } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!me || me.role !== 'admin') {
    return Response.json({ error: 'Bulk import is admin-only' }, { status: 403 });
  }

  const body = await req.json();
  const rows: BulkRow[] = Array.isArray(body?.rows) ? body.rows : [];

  if (rows.length === 0) {
    return Response.json({ error: 'No rows provided' }, { status: 400 });
  }

  if (rows.length > 200) {
    return Response.json({ error: 'Max 200 rows per import. Split into multiple imports.' }, { status: 400 });
  }

  const adminClient = getAdminClient();
  const results: RowResult[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowResult: RowResult = {
      index: i,
      full_name: row.full_name || `Row ${i + 1}`,
      success: false,
    };

    try {
      const fullName = (row.full_name || '').trim();
      const restaurantId = (row.restaurant_id || '').trim();
      const targetRole = (row.role || 'employee').trim();
      const language = (row.preferred_language || 'en').trim() as 'en' | 'es';
      const dob = row.date_of_birth ? row.date_of_birth.trim() : null;
      const welcomeUntil = row.welcome_until ? row.welcome_until.trim() : null;

      // Basic validation
      if (!fullName) throw new Error('Full name is required');
      if (!restaurantId) throw new Error('Restaurant is required');
      if (!VALID_ROLES.includes(targetRole)) throw new Error(`Invalid role: ${targetRole}`);
      if (dob && !/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
        throw new Error('Date of birth must be in YYYY-MM-DD format');
      }
      if (language !== 'en' && language !== 'es') {
        throw new Error('Language must be "en" or "es"');
      }

      const isElevatedRole = ELEVATED_ROLES.includes(targetRole);

      // ── EMPLOYEE: PIN-based auth ────────────────────────────────────────
      if (targetRole === 'employee') {
        const pin = (row.pin || '').trim();
        if (!/^\d{4,8}$/.test(pin)) throw new Error('PIN must be 4 to 8 digits');

        const staffId = randomUUID();
        const staffEmail = `${staffId}@whg.staff`;
        const staffPassword = `WHG${pin}!staff`;

        const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
          id: staffId,
          email: staffEmail,
          password: staffPassword,
          email_confirm: true,
          user_metadata: { full_name: fullName },
        });
        if (authError) throw new Error(authError.message);

        const profilePayload: Record<string, unknown> = {
          id: authData.user.id,
          full_name: fullName,
          restaurant_id: restaurantId,
          role: 'employee',
          status: 'active',
          employee_pin: pin,
          preferred_language: language,
        };
        if (dob) profilePayload.date_of_birth = dob;
        if (welcomeUntil) profilePayload.welcome_until = welcomeUntil;

        const { error: profileError } = await adminClient.from('profiles').insert(profilePayload);
        if (profileError) {
          await adminClient.auth.admin.deleteUser(authData.user.id);
          throw new Error(profileError.message);
        }

        rowResult.success = true;
        results.push(rowResult);
        continue;
      }

      // ── MANAGER / ASST. MANAGER / ADMIN: email + password ──────────────
      if (!isElevatedRole) throw new Error(`Unsupported role: ${targetRole}`);

      const email = (row.email || '').trim().toLowerCase();
      const password = (row.password || '').trim();

      if (!email) throw new Error('Email is required for manager-level accounts');
      if (password.length < 8) throw new Error('Password must be at least 8 characters');

      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });
      if (authError) throw new Error(authError.message);

      const profilePayload: Record<string, unknown> = {
        id: authData.user.id,
        full_name: fullName,
        restaurant_id: restaurantId,
        role: targetRole,
        status: 'active',
        preferred_language: language,
      };
      if (dob) profilePayload.date_of_birth = dob;
      if (welcomeUntil) profilePayload.welcome_until = welcomeUntil;

      const { error: profileError } = await adminClient.from('profiles').insert(profilePayload);
      if (profileError) {
        await adminClient.auth.admin.deleteUser(authData.user.id);
        throw new Error(profileError.message);
      }

      rowResult.success = true;
      results.push(rowResult);
    } catch (err) {
      rowResult.success = false;
      rowResult.error = err instanceof Error ? err.message : 'Unknown error';
      results.push(rowResult);
    }
  }

  const created = results.filter((r) => r.success).length;
  const failed = results.length - created;

  return Response.json({ results, created, failed });
}
