'use server';

import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';

export async function loginAction(
  email: string,
  password: string
): Promise<{ error?: string }> {
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return {
      error:
        error.message === 'Invalid login credentials'
          ? 'Incorrect email or password. Please try again.'
          : error.message,
    };
  }

  redirect('/dashboard');
}
