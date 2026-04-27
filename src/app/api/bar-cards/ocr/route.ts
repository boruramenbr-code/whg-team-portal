import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const MANAGER_ROLES = ['admin', 'manager', 'assistant_manager'];

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * POST /api/bar-cards/ocr
 * Analyze a bar card image using OpenAI Vision to extract name + expiration date.
 * Body: FormData with field "file" (the card image).
 * Returns: { employee_name, expiration_date } or error.
 */
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .single();

  if (!profile || profile.status === 'archived' || !MANAGER_ROLES.includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'File is required' }, { status: 400 });
  }

  try {
    // Convert file to base64 data URL
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    // low detail keeps payload small and fast — only extracting text
    const dataUrl = `data:${file.type};base64,${base64}`;

    console.log(`OCR request: file=${file.name}, size=${file.size}, type=${file.type}, base64len=${base64.length}`);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0,
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: dataUrl, detail: 'low' },
            },
            {
              type: 'text',
              text: `This is a photo of an alcohol service certification card (bar card, RBS card, ATC card, or similar).

These cards typically have MULTIPLE dates on them:
- An issue date or completion date (when the person earned or received the card)
- An EXPIRATION date (when the card expires and must be renewed)

I need ONLY the EXPIRATION date — this is the LATEST/FURTHEST date on the card, usually labeled "Exp", "Expires", "Expiration", or "Valid Through". It is always later than the issue date. Do NOT return the issue date, completion date, date of birth, or any other date.

Extract:
1. The cardholder's full name
2. The EXPIRATION date only (the latest date on the card)

Respond ONLY with valid JSON:
{"employee_name": "First Last", "expiration_date": "YYYY-MM-DD"}

If you cannot read the name, use "Unknown".
If you cannot determine which date is the expiration, use null.
No other text.`,
            },
          ],
        },
      ],
    });

    const content = response.choices[0]?.message?.content?.trim();
    console.log('OCR response:', content);

    if (!content) {
      return NextResponse.json({ error: 'Could not read card. Please enter details manually.' }, { status: 422 });
    }

    // Strip markdown code fence if GPT wraps the JSON
    const jsonStr = content.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim();

    const parsed = JSON.parse(jsonStr);
    return NextResponse.json({
      employee_name: parsed.employee_name || 'Unknown',
      expiration_date: parsed.expiration_date || null,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('OCR failed:', msg);
    return NextResponse.json({ error: `OCR failed: ${msg}` }, { status: 422 });
  }
}
