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
    const dataUrl = `data:${file.type};base64,${base64}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0,
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: dataUrl, detail: 'high' },
            },
            {
              type: 'text',
              text: `This is a photo that contains an alcohol service certification card (bar card, RBS card, ATC card, or similar). The card may be sitting on a table, held in someone's hand, or photographed at an angle.

Extract the following information:
1. The cardholder's full name
2. The expiration date
3. The crop region of JUST the card within the image, as percentages of total image dimensions (top, left, width, height). Estimate where the card edges are.

Respond ONLY with valid JSON in this exact format:
{"employee_name": "First Last", "expiration_date": "YYYY-MM-DD", "crop": {"top": 10, "left": 5, "width": 90, "height": 80}}

The crop values are percentages (0-100). For example, if the card takes up the middle 80% of the image, top might be 10, left 10, width 80, height 80.

If the card fills the entire image, use {"top": 0, "left": 0, "width": 100, "height": 100}.
If you cannot read the name, use "Unknown".
If you cannot read the expiration date, use null.
Do not include any other text or explanation.`,
            },
          ],
        },
      ],
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      return NextResponse.json({ error: 'Could not read card. Please enter details manually.' }, { status: 422 });
    }

    // Parse the JSON response
    const parsed = JSON.parse(content);
    return NextResponse.json({
      employee_name: parsed.employee_name || 'Unknown',
      expiration_date: parsed.expiration_date || null,
      crop: parsed.crop || null,
    });
  } catch (err) {
    console.error('OCR failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Could not read card. Please enter details manually.' }, { status: 422 });
  }
}
