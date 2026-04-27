import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const MANAGER_ROLES = ['admin', 'manager', 'assistant_manager'];

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * POST /api/bar-cards/ocr
 * Analyze a bar card image using OpenAI Vision to extract name + expiration date + crop region.
 * Body: FormData with field "file" (the card image).
 * Returns: { employee_name, expiration_date, crop } or error.
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

    // Use low detail mode to keep payload small and fast
    const dataUrl = `data:${file.type};base64,${base64}`;

    console.log(`OCR request: file=${file.name}, size=${file.size}, type=${file.type}, base64len=${base64.length}`);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0,
      max_tokens: 300,
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
              text: `This is a photo of an alcohol service certification card (bar card, RBS card, ATC card, or similar). The card may be on a table, held in hand, or at an angle.

Extract:
1. The cardholder's full name
2. The expiration date
3. The crop region of JUST the card as percentages of total image (top, left, width, height)

Respond ONLY with valid JSON:
{"employee_name": "First Last", "expiration_date": "YYYY-MM-DD", "crop": {"top": 10, "left": 5, "width": 90, "height": 80}}

Crop values are 0-100 percentages. If card fills the whole image: {"top": 0, "left": 0, "width": 100, "height": 100}.
If you cannot read the name, use "Unknown".
If you cannot read the expiration date, use null.
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
      crop: parsed.crop || null,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('OCR failed:', msg);
    return NextResponse.json({ error: `OCR failed: ${msg}` }, { status: 422 });
  }
}
