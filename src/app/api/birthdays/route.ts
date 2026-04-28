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

  // Fetch all active profiles with birthdays in current or next month
  // Admin sees all restaurants, others see their own
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

  // Filter by current month and next month, calculate days until birthday
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const birthdays = (profiles || [])
    .filter((p) => {
      if (!p.date_of_birth) return false;
      const dob = new Date(p.date_of_birth + 'T00:00:00');
      const birthMonth = dob.getMonth() + 1;
      return birthMonth === currentMonth || birthMonth === nextMonth;
    })
    .map((p) => {
      const dob = new Date(p.date_of_birth! + 'T00:00:00');
      const birthMonth = dob.getMonth();
      const birthDay = dob.getDate();

      // Calculate next birthday this year or next
      let nextBirthday = new Date(today.getFullYear(), birthMonth, birthDay);
      if (nextBirthday < today) {
        nextBirthday = new Date(today.getFullYear() + 1, birthMonth, birthDay);
      }

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
    .sort((a, b) => a.days_until - b.days_until);

  return NextResponse.json({
    birthdays,
    current_month: currentMonth,
    next_month: nextMonth,
  });
}
