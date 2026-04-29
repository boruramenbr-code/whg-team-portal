import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

/**
 * GET /api/birthdays
 * Returns upcoming birthdays for the current + next month.
 * Active profiles only. Sorted by next occurrence.
 */
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, restaurant_id, status')
    .eq('id', user.id)
    .single();

  if (!profile || profile.status === 'archived') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;

  // Fetch all active profiles with non-null birthdays.
  // Admin sees all restaurants, others see their own.
  let query = supabase
    .from('profiles')
    .select('id, full_name, date_of_birth, restaurant_id, restaurants(name)')
    .eq('status', 'active')
    .not('date_of_birth', 'is', null);

  if (profile.role !== 'admin') {
    query = query.eq('restaurant_id', profile.restaurant_id);
  }

  const { data: profiles, error } = await query;

  if (error) {
    console.error('Birthday fetch error:', error.message);
    return NextResponse.json({ error: 'Failed to load birthdays' }, { status: 500 });
  }

  // Window: today through last day of next month.
  // Birthdays already passed this month are EXCLUDED — their next occurrence is
  // next year and falls outside the window. This avoids the "in 338 days" entries.
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  // new Date(year, monthIndex + 2, 0) → day 0 of the month after next = last day of next month.
  // Correctly handles year rollover (e.g. Dec → Jan of next year).
  const windowEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);
  windowEnd.setHours(23, 59, 59, 999);

  const birthdays = (profiles || [])
    .map((p) => {
      if (!p.date_of_birth) return null;
      const dob = new Date(p.date_of_birth + 'T00:00:00');
      const birthMonth = dob.getMonth();
      const birthDay = dob.getDate();

      // Compute the next occurrence (this year if still upcoming, else next year).
      let nextBirthday = new Date(today.getFullYear(), birthMonth, birthDay);
      if (nextBirthday < today) {
        nextBirthday = new Date(today.getFullYear() + 1, birthMonth, birthDay);
      }

      // Drop anything whose next occurrence is past the end of next month.
      if (nextBirthday > windowEnd) return null;

      const diffMs = nextBirthday.getTime() - today.getTime();
      const daysUntil = Math.round(diffMs / (1000 * 60 * 60 * 24));

      return {
        id: p.id,
        full_name: p.full_name,
        date_of_birth: p.date_of_birth,
        birth_month: birthMonth + 1, // back to 1-12
        birth_day: birthDay,
        days_until: daysUntil,
        restaurant_name: (p.restaurants as { name?: string } | null)?.name || null,
      };
    })
    .filter((b): b is NonNullable<typeof b> => b !== null)
    .sort((a, b) => a.days_until - b.days_until);

  return NextResponse.json({
    birthdays,
    current_month: currentMonth,
    next_month: nextMonth,
  });
}
