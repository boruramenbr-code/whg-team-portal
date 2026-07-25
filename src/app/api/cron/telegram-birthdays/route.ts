import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { todayInCentralTime } from '@/lib/dates';

/**
 * GET /api/cron/telegram-birthdays
 *
 * Returns today's active-employee birthdays for the Google Apps Script
 * Telegram sender to consume. This replaces the manually-maintained
 * Google Sheet as the single source of truth for the birthday system.
 *
 * Auth: requires `Authorization: Bearer <BIRTHDAY_API_SECRET>` header.
 * Uses the Supabase service role key server-side only.
 */
export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    const expected = `Bearer ${process.env.BIRTHDAY_API_SECRET}`;
    if (!process.env.BIRTHDAY_API_SECRET || authHeader !== expected) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

  const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

  const today = todayInCentralTime(); // 'YYYY-MM-DD'
  const [, month, day] = today.split('-');

  const { data: profiles, error } = await supabase
      .from('profiles')
      .select('full_name, date_of_birth, restaurants(slug)')
      .eq('status', 'active')
      .not('date_of_birth', 'is', null);

  if (error) {
        console.error('Birthday cron fetch error:', error.message);
        return NextResponse.json({ error: 'Failed to load birthdays' }, { status: 500 });
  }

  const birthdays = (profiles || [])
      .filter((p) => {
              if (!p.date_of_birth) return false;
              const [, m, d] = p.date_of_birth.split('-');
              return m === month && d === day;
      })
      .map((p) => ({
              full_name: p.full_name,
              restaurant_slug: (p.restaurants as { slug?: string } | null)?.slug || null,
      }));

  return NextResponse.json(
    { date: today, birthdays },
    { headers: { 'Cache-Control': 'no-store' } }
      );
}
