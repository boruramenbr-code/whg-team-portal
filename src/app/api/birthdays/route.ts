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

  // Window: 7 days BACK through end of next month.
  // Recent past birthdays stay visible for a week so we can still celebrate
  // people who had a birthday yesterday/this week. days_until is signed:
  //   positive = future ("in 5 days")
  //   0        = today
  //   negative = past   ("yesterday" / "3 days ago")
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const windowStart = new Date(today);
  windowStart.setDate(today.getDate() - 7); // 7 days ago
  // new Date(year, monthIndex + 2, 0) → last day of next month. Year rollover handled.
  const windowEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);
  windowEnd.setHours(23, 59, 59, 999);

  const birthdays = (profiles || [])
    .map((p) => {
      if (!p.date_of_birth) return null;
      const dob = new Date(p.date_of_birth + 'T00:00:00');
      const birthMonth = dob.getMonth();
      const birthDay = dob.getDate();

      // The closest occurrence of this birthday — could be earlier this year
      // (recently passed) or later this year (upcoming) or next year (year rollover).
      // We pick whichever falls inside the [windowStart, windowEnd] window.
      const candidates = [
        new Date(today.getFullYear() - 1, birthMonth, birthDay),
        new Date(today.getFullYear(), birthMonth, birthDay),
        new Date(today.getFullYear() + 1, birthMonth, birthDay),
      ];

      const occurrence = candidates.find(
        (d) => d >= windowStart && d <= windowEnd
      );
      if (!occurrence) return null;

      const diffMs = occurrence.getTime() - today.getTime();
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
    .sort((a, b) => {
      // Today + future first (ascending), then past (most recent first at bottom)
      const aPast = a.days_until < 0;
      const bPast = b.days_until < 0;
      if (aPast !== bPast) return aPast ? 1 : -1;
      if (aPast) return b.days_until - a.days_until; // -1 before -3 before -7
      return a.days_until - b.days_until;            // 0, 1, 2, ...
    });

  return NextResponse.json({
    birthdays,
    current_month: currentMonth,
    next_month: nextMonth,
  });
}
