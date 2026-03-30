import { createClient } from '@/lib/supabase-server';
import { NextRequest } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const supabase = createClient();

  // Verify authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Load user profile + restaurant
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, restaurants(*)')
    .eq('id', user.id)
    .single();

  if (!profile || profile.status === 'archived') {
    return Response.json({ error: 'Account inactive' }, { status: 403 });
  }

  const { question, handbookSource, language } = await req.json();

  if (!question?.trim()) {
    return Response.json({ error: 'Question is required' }, { status: 400 });
  }

  // Language: use the in-session toggle value if sent, otherwise fall back to profile preference
  const isManagerOrAdmin = ['manager', 'assistant_manager', 'admin'].includes(profile.role);
  const effectiveLanguage: 'en' | 'es' = language === 'es' || language === 'en'
    ? language
    : (profile.preferred_language || 'en');
  const isSpanish = effectiveLanguage === 'es';

  // Determine which handbook source to search
  const source = isManagerOrAdmin && handbookSource === 'manager'
    ? 'manager'
    : isSpanish
    ? 'employee-es'
    : 'employee';

  // Generate embedding for the question
  let embedding: number[];
  try {
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: question.trim(),
    });
    embedding = embeddingResponse.data[0].embedding;
  } catch {
    return Response.json({ error: 'AI service unavailable' }, { status: 503 });
  }

  // Search handbook for relevant chunks via vector similarity
  const { data: chunks } = await supabase.rpc('match_handbook_chunks', {
    query_embedding: embedding,
    match_threshold: 0.2,
    match_count: 8,
    source_filter: source,
  });

  // Get restaurant-specific policy overrides
  const { data: policies } = await supabase
    .from('restaurant_policies')
    .select('policy_key, policy_value')
    .eq('restaurant_id', profile.restaurant_id);

  // Build context strings
  const handbookContext = chunks?.map((c: { content: string }) => c.content).join('\n\n---\n\n') || '';
  const restaurantName = (profile.restaurants as { name?: string } | null)?.name || 'your restaurant';
  const policyContext = policies?.length
    ? policies.map((p: { policy_key: string; policy_value: string }) => `• ${p.policy_key}: ${p.policy_value}`).join('\n')
    : 'No location-specific overrides on file.';

  const systemPrompt = `You are the WHG Team Assistant — the official AI handbook assistant for Wong Hospitality Group.

Your job is to answer team member questions clearly and accurately, based ONLY on the handbook content provided below. Do not guess or make up policies.

GUIDELINES:
- Answer in plain, friendly language. Be direct and helpful.
- If the answer is in the handbook, give it clearly. You can quote directly if helpful.
- LANGUAGE: ${isSpanish ? 'This team member prefers Español. Respond ENTIRELY in Spanish (Español) regardless of what language they typed their question in. Every word of your response must be in Spanish.' : 'Respond in English only. Never include any Spanish words or phrases in your response.'}
- This team member works at ${restaurantName}. Always refer to their location by name (e.g., "at ${restaurantName}" or "here at ${restaurantName}") rather than saying "your restaurant" or "your location." Make every answer feel like it's specifically for ${restaurantName}.
- If a policy varies by location, use the restaurant-specific version below.

WHEN THE HANDBOOK DOESN'T COVER THE QUESTION:
Do NOT give a flat "I don't have that information" response. Instead:
1. Start your response with exactly: "That's not something I have in the handbook —"
2. Acknowledge what they were asking about specifically
3. If there's a related topic you CAN help with, offer it (e.g. "I do have info on X — want me to cover that?")
4. Suggest a slightly different way they could ask the question to get a useful answer
5. Give a warm, specific redirect — not just "ask your manager"
Keep the response under 3 sentences. Sound like a helpful coworker, not a system error.

Example BAD response: "I don't have that information in the handbook. Please ask your manager directly."
Example GOOD response: "That's not something I have in the handbook — vacation accrual specifics aren't covered here. I do have details on our time-off request process though — want me to walk you through that? For accrual rates, your manager can pull that up for you directly."

LOCATION-SPECIFIC POLICIES FOR ${restaurantName.toUpperCase()}:
${policyContext}

HANDBOOK CONTENT:
${handbookContext || 'No relevant handbook sections found for this question.'}`;

  // Stream the answer
  const stream = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: question },
    ],
    stream: true,
    temperature: 0.2,
    max_tokens: 600,
  });

  const encoder = new TextEncoder();
  let fullAnswer = '';

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || '';
          if (text) {
            fullAnswer += text;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
            );
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();

        // Flag questions the handbook couldn't answer
        const isUnanswered = fullAnswer.includes("That's not something I have in the handbook");

        // Save to chat history (fire and forget)
        supabase
          .from('chat_history')
          .insert({
            user_id: user.id,
            question,
            answer: fullAnswer,
            handbook_source: source,
            is_unanswered: isUnanswered,
          })
          .then(() => {});
      } catch {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ text: "\n\nSomething went wrong. Please try again." })}\n\n`
          )
        );
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
