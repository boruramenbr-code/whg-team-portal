// WHG Handbook Ingestion Script
// Loads secrets from .env.local (gitignored) at the project root.
// Run from the whg-team-portal directory:
//   node ingest-handbook.mjs

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Minimal .env.local loader (no extra dependency needed)
try {
  const envFile = readFileSync('.env.local', 'utf8');
  for (const line of envFile.split('\n')) {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) {
      let value = match[2];
      // Strip optional surrounding quotes
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[match[1]] = value;
    }
  }
} catch {
  // .env.local not found — will fall through to missing-var error below
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://quxvjemvcejfledjcpgh.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_SERVICE_KEY || !OPENAI_API_KEY) {
  console.error('Missing secrets. Add SUPABASE_SERVICE_ROLE_KEY and OPENAI_API_KEY to .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function getEmbedding(text) {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text.slice(0, 8000), // max safe input
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI error: ${err}`);
  }
  const data = await res.json();
  return data.data[0].embedding;
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  console.log('🗑️  Clearing existing handbook chunks...');
  const { error: deleteError } = await supabase
    .from('handbook_chunks')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // delete all rows

  if (deleteError) {
    console.error('Delete error:', deleteError);
    process.exit(1);
  }
  console.log('   Done.\n');

  const chunks = JSON.parse(readFileSync('./handbook_chunks_raw.json', 'utf8'));
  console.log(`📚 Loaded ${chunks.length} chunks. Generating embeddings and uploading...\n`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const label = `[${i + 1}/${chunks.length}] (${chunk.source})`;

    try {
      const embedding = await getEmbedding(chunk.content);

      const { error } = await supabase.from('handbook_chunks').insert({
        content: chunk.content,
        embedding,
        source: chunk.source,
      });

      if (error) {
        console.error(`${label} ❌ DB error: ${error.message}`);
        failed++;
      } else {
        console.log(`${label} ✅`);
        success++;
      }

      // Small delay to avoid rate limits
      await sleep(200);
    } catch (err) {
      console.error(`${label} ❌ ${err.message}`);
      failed++;
      await sleep(500);
    }
  }

  console.log(`\n✅ Done! ${success} chunks uploaded, ${failed} failed.`);
}

main().catch(console.error);
