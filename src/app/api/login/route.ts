import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  const supabase = createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.json(
      {
        error:
          error.message === 'Invalid login credentials'
            ? 'Incorrect email or password. Please try again.'
            : error.message,
      },
      { status: 401 }
    );
  }

  return NextResponse.json({ success: true });
}
