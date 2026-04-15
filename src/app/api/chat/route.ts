import { createClient } from '@/lib/supabase-server';
import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { checkRateLimit } from '@/lib/rate-limit';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Rate limit: 50 questions per user per hour (protects OpenAI costs)
const CHAT_LIMIT = { maxAttempts: 50, windowSeconds: 3600 };

export async function POST(req: NextRequest) {
  const supabase = createClient();

  // Verify authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── Rate limiting (per user) ──────────────────────────────────────────
  const rateCheck = checkRateLimit(`chat:${user.id}`, CHAT_LIMIT);
  if (!rateCheck.allowed) {
    return Response.json(
      { error: `You've reached the question limit. Please wait a bit before asking more.` },
      { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfterSeconds) } }
    );
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

  const { question, handbookSource, language, history } = await req.json();

  if (!question?.trim()) {
    return Response.json({ error: 'Question is required' }, { status: 400 });
  }

  // Limit question length to prevent abuse and keep embedding costs low
  if (question.trim().length > 500) {
    return Response.json({ error: 'Question is too long. Please keep it under 500 characters.' }, { status: 400 });
  }

  // Accept conversation history from the client: last N turns of { role, content }.
  // We cap at 10 messages (5 turn pairs) — anything beyond that is rarely
  // load-bearing for intent and drives token cost up unnecessarily.
  type Turn = { role: 'user' | 'assistant'; content: string };
  const rawHistory: unknown[] = Array.isArray(history) ? history : [];
  const recentHistory: Turn[] = rawHistory
    .filter((t): t is Turn =>
      !!t &&
      typeof t === 'object' &&
      (('role' in t && (t as { role: unknown }).role === 'user') || ('role' in t && (t as { role: unknown }).role === 'assistant')) &&
      'content' in t &&
      typeof (t as { content: unknown }).content === 'string' &&
      ((t as { content: string }).content.trim().length > 0)
    )
    .slice(-10);

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

  // History-aware retrieval: if we have prior turns, rewrite the question into
  // a standalone query before embedding/searching. This fixes the "Yes" and
  // "what happens after?" cases where the user's message is meaningless on its own.
  // For a first-turn question (no history), we skip the rewrite to save a call.
  let searchQuery = question.trim();
  if (recentHistory.length > 0) {
    try {
      const rewriteResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0,
        max_tokens: 120,
        messages: [
          {
            role: 'system',
            content: `You rewrite a user's latest message into a standalone question that can be understood without the prior conversation. Use the conversation history to fill in missing subject/context. Rules:
- Output ONLY the rewritten question. No preamble, no quotes, no explanation.
- If the latest message is already a complete standalone question, output it unchanged.
- If the latest message is a short confirmation ("yes", "ok", "sure", "tell me more") or a vague follow-up ("what happens after?", "and then?"), combine it with the prior user question so the rewritten version asks the full thing.
- Keep the same language as the user (English or Spanish).
- Keep it under 30 words.`,
          },
          ...recentHistory.map((t) => ({ role: t.role, content: t.content })),
          { role: 'user', content: `Latest message to rewrite: "${question.trim()}"` },
        ],
      });
      const rewritten = rewriteResponse.choices[0]?.message?.content?.trim();
      if (rewritten && rewritten.length > 0 && rewritten.length < 500) {
        searchQuery = rewritten;
      }
    } catch {
      // Rewrite is best-effort. If it fails, fall back to the raw question.
    }
  }

  // Generate embedding for the (possibly rewritten) search query
  let embedding: number[];
  try {
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: searchQuery,
    });
    embedding = embeddingResponse.data[0].embedding;
  } catch {
    return Response.json({ error: 'AI service unavailable' }, { status: 503 });
  }

  // Search handbook for relevant chunks via vector similarity
  const { data: chunks, error: rpcError } = await supabase.rpc('match_handbook_chunks', {
    query_embedding: embedding,
    match_threshold: 0.2,
    match_count: 8,
    source_filter: source,
  });

  // If the source-specific search returns nothing (e.g. 'employee-es' chunks
  // don't exist yet), fall back to the base 'employee' source so Spanish
  // users still get answers. The system prompt will translate the content.
  let finalChunks = chunks;
  if ((!chunks || chunks.length === 0) && source === 'employee-es') {
    const { data: fallbackChunks } = await supabase.rpc('match_handbook_chunks', {
      query_embedding: embedding,
      match_threshold: 0.2,
      match_count: 8,
      source_filter: 'employee',
    });
    finalChunks = fallbackChunks;
  }

  if (rpcError) {
    console.error('Vector search failed:', rpcError.message);
    // Don't block the user — continue with empty context
  }

  // Get restaurant-specific policy overrides
  const { data: policies } = await supabase
    .from('restaurant_policies')
    .select('policy_key, policy_value')
    .eq('restaurant_id', profile.restaurant_id);

  // Build context strings
  const handbookContext = finalChunks?.map((c: { content: string }) => c.content).join('\n\n---\n\n') || '';
  const restaurantName = (profile.restaurants as { name?: string } | null)?.name || 'your restaurant';
  const firstName = (profile.full_name || '').split(' ')[0] || '';
  const policyContext = policies?.length
    ? policies.map((p: { policy_key: string; policy_value: string }) => `• ${p.policy_key}: ${p.policy_value}`).join('\n')
    : 'No location-specific overrides on file.';

  // Manager-specific leadership coaching block. Used when the user is a manager
  // so that the assistant reinforces WHG's leadership-tone principles whenever
  // a manager asks about feedback, complaints, discipline, or team dynamics.
  const managerLeadershipBlock = isManagerOrAdmin ? `

MANAGER LEADERSHIP CONTEXT:
${firstName || 'This manager'} is a ${profile.role} at ${restaurantName}. When a manager asks about handling feedback, complaints, anonymous comments, discipline, team conflict, or how to respond to something a team member did, you are not just answering a policy question — you are coaching a leader. Reinforce these WHG principles naturally in your answer:
- Feedback (including anonymous or critical feedback) is a learning tool, never a personal attack.
- Managers never retaliate, get defensive, vent publicly, or make sarcastic or passive-aggressive remarks about feedback.
- Respect is given constantly and first — an employee's poor attitude never excuses the manager's.
- Correct in private, train in public.
- Lead by example: the team watches how the manager reacts more than it listens to what they say.
- For complaints involving harassment, discrimination, safety, wages, or illegal activity — escalate to ownership within 24 hours.
Do not lecture. Weave the relevant principle into the answer as practical guidance, not a speech.` : '';

  const systemPrompt = `${isSpanish ? '🔴 LANGUAGE REQUIREMENT (HIGHEST PRIORITY): You MUST respond entirely in Spanish (Español). This applies to every word of your response. The handbook content may be in English — read it, understand it, then answer in Spanish. Do not write a single word in English under any circumstances.\n\n' : ''}You are the WHG Team Assistant — the in-app helper for Wong Hospitality Group team members. You sound like a knowledgeable coworker who happens to know the handbook cold. You are NOT a robotic FAQ.

WHO YOU'RE TALKING TO:
- Name: ${firstName || 'team member'}
- Role: ${profile.role}
- Location: ${restaurantName}

HOW YOU TALK:
- Address ${firstName ? firstName : 'them'} by first name naturally — not in every sentence, but warmly when it fits (a greeting, a clarification, a nudge).
- Rephrase handbook content in your own words. Do not copy-paste sentences from the handbook. Think of the handbook as your source of truth, not your script.
- Keep it conversational, direct, and human. Short paragraphs. No bureaucratic language.
- When the question is ambiguous or could go several directions, ask ONE short follow-up question before answering — e.g., "Are you asking about scheduled shifts or a day off?" Don't pile on multiple questions.
- If the answer is simple, just answer. Don't pad.
- Offer to go deeper at the end when it's useful ("Want me to walk through the call-out process?") — but only when it actually helps, not on every turn.
- Mention the location by name when it makes the answer more concrete: "here at ${restaurantName}".

ACCURACY RULES (non-negotiable):
- Only state policies that are supported by the handbook content below or the location overrides.
- Do not invent rules, numbers, deadlines, or consequences.
- If the handbook and a location override conflict, the location override wins for this user.
- If a policy varies by location, use the ${restaurantName} version.

POLICY AUTHORITY (CRITICAL — read before answering):
- Any handbook chunk that begins with "[WHG POLICY v1]" is a locked, current WHG policy. These policies are AUTHORITATIVE and OVERRIDE anything in the base handbook that conflicts with them.
- If a base handbook section and a "[WHG POLICY v1]" section disagree on any number, deadline, window, consequence, or process step, the "[WHG POLICY v1]" version is correct and the base handbook version is OUTDATED. Use the policy version and ignore the older rule completely. Do not blend the two.
- Examples of things where the policy wins: attendance windows (e.g. rolling 90 days vs. 30 days), number of strikes before termination, grace periods, notice requirements, consequence ladders.
- Do NOT mention the "[WHG POLICY v1]" tag itself to the user. It's an internal marker. Just speak in plain language.

WHEN THE HANDBOOK DOESN'T COVER THE QUESTION:
Do NOT give a flat "I don't have that information." Instead:
1. Start your response with exactly: ${isSpanish ? '"Eso no está en el manual —"' : '"That\'s not something I have in the handbook —"'}
2. Name what they were asking about so they know you understood.
3. Offer a related topic you CAN help with, OR suggest a better-phrased version of their question.
4. Give a warm, specific redirect — not just "ask your manager."
Keep the response under 3 sentences.
${managerLeadershipBlock}
LOCATION-SPECIFIC POLICIES FOR ${restaurantName.toUpperCase()}:
${policyContext}

HANDBOOK CONTENT:
${handbookContext || 'No relevant handbook sections found for this question.'}

${isSpanish ? '🔴 REMINDER: Your entire response must be in Spanish (Español). Every word. No exceptions.' : ''}`;

  // Stream the answer
  // When Spanish is selected, prime the conversation so the model is already
  // committed to responding in Spanish before it sees the question or handbook content.
  const primedMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { role: 'system', content: systemPrompt },
    ...(isSpanish
      ? [
          { role: 'user' as const, content: 'Por favor responde todas mis preguntas en español.' },
          { role: 'assistant' as const, content: 'Entendido. Responderé todas tus preguntas completamente en español.' },
        ]
      : []),
    // Prior conversation turns so the model can follow "Yes", "what happens
    // after?", and other context-dependent follow-ups coherently.
    ...recentHistory.map((t) => ({ role: t.role, content: t.content })),
    { role: 'user', content: question },
  ];

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: primedMessages,
    stream: true,
    temperature: 0.5,
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
        const isUnanswered =
          fullAnswer.includes("That's not something I have in the handbook") ||
          fullAnswer.includes("Eso no está en el manual");

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
