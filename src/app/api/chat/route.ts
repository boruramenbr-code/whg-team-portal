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

  const { question, handbookSource } = await req.json();

  if (!question?.trim()) {
    return Response.json({ error: 'Question is required' }, { status: 400 });
  }

  // Determine which handbook to search based on role
  const isManagerOrAdmin = ['manager', 'admin'].includes(profile.role);
  const source = isManagerOrAdmin && handbookSource === 'manager' ? 'manager' : 'employee';

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
    match_threshold: 0.5,
    match_count: 6,
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
- If the answer is NOT in the handbook, say: "I don't have that information in the handbook. Please ask your manager directly."
- Never say anything that contradicts the handbook.
- The team member works at: ${restaurantName}
- If a policy varies by location, use the restaurant-specific version below.

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

        // Save to chat history (fire and forget)
        supabase
          .from('chat_history')
          .insert({
            user_id: user.id,
            question,
            answer: fullAnswer,
            handbook_source: source,
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
