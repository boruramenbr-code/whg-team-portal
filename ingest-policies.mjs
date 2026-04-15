// WHG Policy Ingestion Script
// Pulls every active row from the `policies` table, formats each as a single
// RAG chunk, generates embeddings, and inserts into `handbook_chunks` so the
// chatbot can retrieve them alongside the base handbook.
//
// Chunks are tagged with the prefix "[WHG POLICY v1]" so this script can
// re-run idempotently without touching the base handbook chunks.
//
// Run from the whg-team-portal directory:
//   node ingest-policies.mjs

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load .env.local (same minimal loader as ingest-handbook.mjs)
try {
  const envFile = readFileSync('.env.local', 'utf8');
  for (const line of envFile.split('\n')) {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) {
      let value = match[2];
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[match[1]] = value;
    }
  }
} catch {
  // .env.local not found — fall through to missing-var error below
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://quxvjemvcejfledjcpgh.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_SERVICE_KEY || !OPENAI_API_KEY) {
  console.error('Missing secrets. Add SUPABASE_SERVICE_ROLE_KEY and OPENAI_API_KEY to .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Prefix used to tag every chunk this script creates. The content LIKE
// pattern makes idempotent re-ingest safe without a schema change.
const POLICY_PREFIX = '[WHG POLICY v1]';

async function getEmbedding(text) {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text.slice(0, 8000),
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI error: ${err}`);
  }
  const data = await res.json();
  return data.data[0].embedding;
}

function buildChunkContent(policy) {
  // A single consolidated chunk per policy. The title is repeated in several
  // places to boost retrieval when a user asks about a topic by name (e.g.
  // "attendance policy"). The section headers (Purpose / Policy Details /
  // Consequences) keep the structure readable to the model.
  const parts = [
    `${POLICY_PREFIX} ${policy.title}`,
    '',
    `POLICY: ${policy.title} (v${policy.version})`,
    `Applies to: ${policy.role_required === 'manager' ? 'Managers' : policy.role_required === 'all' ? 'All WHG team members' : 'All employees'}`,
    '',
  ];

  if (policy.purpose) {
    parts.push('Purpose:');
    parts.push(policy.purpose.trim());
    parts.push('');
  }

  if (policy.details) {
    parts.push('Policy Details:');
    parts.push(policy.details.trim());
    parts.push('');
  }

  if (policy.consequences) {
    parts.push('Consequences:');
    parts.push(policy.consequences.trim());
    parts.push('');
  }

  if (policy.location_notes) {
    parts.push('Location Notes:');
    parts.push(policy.location_notes.trim());
    parts.push('');
  }

  if (policy.acknowledgment_text) {
    parts.push('Acknowledgment:');
    parts.push(policy.acknowledgment_text.trim());
  }

  return parts.join('\n').trim();
}

function sourceFor(policy) {
  // The chat route filters handbook_chunks by `source`. Managers can see
  // both 'employee' and 'manager' chunks; staff only see 'employee'. The
  // master handbook ack (role_required='all') becomes an 'employee' chunk
  // so everyone benefits from it.
  if (policy.role_required === 'manager') return 'manager';
  return 'employee';
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  console.log('🗑️  Clearing existing policy chunks (keeping base handbook intact)...');
  const { error: deleteError, count: deletedCount } = await supabase
    .from('handbook_chunks')
    .delete({ count: 'exact' })
    .like('content', `${POLICY_PREFIX}%`);

  if (deleteError) {
    console.error('Delete error:', deleteError);
    process.exit(1);
  }
  console.log(`   Removed ${deletedCount ?? 'unknown'} old policy chunks.\n`);

  console.log('📥 Loading active policies from the database...');
  const { data: policies, error: policyError } = await supabase
    .from('policies')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true });

  if (policyError) {
    console.error('Policy load error:', policyError);
    process.exit(1);
  }
  if (!policies || policies.length === 0) {
    console.error('No active policies found. Nothing to ingest.');
    process.exit(1);
  }
  console.log(`   Loaded ${policies.length} active policies.\n`);

  console.log('🧠 Generating embeddings and uploading chunks...\n');

  let success = 0;
  let failed = 0;

  for (let i = 0; i < policies.length; i++) {
    const policy = policies[i];
    const source = sourceFor(policy);
    const label = `[${i + 1}/${policies.length}] (${source}) ${policy.title}`;

    try {
      const content = buildChunkContent(policy);
      if (!content || content.length < 50) {
        console.log(`${label} ⚠️  Skipped (empty or near-empty body)`);
        continue;
      }

      const embedding = await getEmbedding(content);

      const { error } = await supabase.from('handbook_chunks').insert({
        content,
        embedding,
        source,
      });

      if (error) {
        console.error(`${label} ❌ DB error: ${error.message}`);
        failed++;
      } else {
        console.log(`${label} ✅`);
        success++;
      }

      await sleep(200);
    } catch (err) {
      console.error(`${label} ❌ ${err.message}`);
      failed++;
      await sleep(500);
    }
  }

  console.log(`\n✅ Done! ${success} policy chunks uploaded, ${failed} failed.`);
  console.log('\nThe chatbot will now retrieve these policies alongside the base handbook.');
  console.log('No server restart needed — embeddings are read from the database on every query.');
}

main().catch(console.error);
