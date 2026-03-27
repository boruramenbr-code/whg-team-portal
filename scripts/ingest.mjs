#!/usr/bin/env node
/**
 * WHG Handbook Ingestion Script
 * ─────────────────────────────
 * Reads a PDF handbook, splits it into chunks, generates OpenAI embeddings,
 * and stores them in Supabase so the AI can search and answer questions.
 *
 * USAGE:
 *   node scripts/ingest.mjs --file ./handbook.pdf --source employee
 *   node scripts/ingest.mjs --file ./manager-handbook.pdf --source manager --clear
 *
 * FLAGS:
 *   --file    Path to the PDF file (required)
 *   --source  "employee" or "manager" (default: employee)
 *   --clear   Delete existing chunks for this source before ingesting
 *
 * PREREQUISITES:
 *   npm install  (installs pdf-parse and other deps)
 *   .env.local must have NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { config } from 'dotenv';

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') });

// ─── Argument parsing ────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const getArg = (flag) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : null;
};

const filePath = getArg('--file');
const source   = getArg('--source') || 'employee';
const clear    = args.includes('--clear');

if (!filePath) {
  console.error('\n❌  Missing --file argument.');
  console.error('    Usage: node scripts/ingest.mjs --file ./handbook.pdf --source employee\n');
  process.exit(1);
}

if (!['employee', 'manager'].includes(source)) {
  console.error('\n❌  --source must be "employee" or "manager".\n');
  process.exit(1);
}

const absolutePath = resolve(process.cwd(), filePath);
if (!existsSync(absolutePath)) {
  console.error(`\n❌  File not found: ${absolutePath}\n`);
  process.exit(1);
}

// ─── Validate environment ────────────────────────────────────────────────────
const requiredEnv = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY',
];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`\n❌  Missing environment variable: ${key}`);
    console.error('    Make sure your .env.local is configured correctly.\n');
    process.exit(1);
  }
}

// ─── Clients ─────────────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Text chunking ───────────────────────────────────────────────────────────
/**
 * Splits text into overlapping chunks by word count.
 * ~600 words per chunk, 80-word overlap to preserve context across boundaries.
 */
function chunkText(text, chunkWords = 600, overlapWords = 80) {
  // Clean up whitespace
  const cleaned = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

  const words = cleaned.split(/\s+/);
  const chunks = [];
  const step = chunkWords - overlapWords;

  for (let i = 0; i < words.length; i += step) {
    const chunk = words.slice(i, i + chunkWords).join(' ').trim();
    if (chunk.length > 100) { // skip tiny/empty chunks
      chunks.push(chunk);
    }
  }

  return chunks;
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🚀  WHG Handbook Ingestion');
  console.log(`    File:   ${absolutePath}`);
  console.log(`    Source: ${source}`);
  console.log(`    Clear:  ${clear}\n`);

  // 1. Parse PDF
  console.log('📄  Parsing PDF...');
  // Dynamic import to handle CJS/ESM differences
  const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default;
  const buffer   = readFileSync(absolutePath);
  const pdfData  = await pdfParse(buffer);
  const text     = pdfData.text;

  console.log(`    Extracted ${text.length.toLocaleString()} characters across ${pdfData.numpages} pages.\n`);

  // 2. Clear existing chunks (if requested)
  if (clear) {
    console.log(`🗑️   Clearing existing "${source}" chunks...`);
    const { error } = await supabase
      .from('handbook_chunks')
      .delete()
      .eq('source', source);
    if (error) {
      console.error(`    ❌ Failed to clear: ${error.message}`);
      process.exit(1);
    }
    console.log('    Done.\n');
  }

  // 3. Chunk text
  const chunks = chunkText(text);
  console.log(`✂️   Split into ${chunks.length} chunks.\n`);

  // 4. Embed and insert in batches
  const BATCH_SIZE = 20; // OpenAI allows up to 100, keeping it conservative
  let inserted = 0;

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);

    // Generate embeddings
    let embeddingResponse;
    try {
      embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: batch,
      });
    } catch (err) {
      console.error(`\n❌  OpenAI error on batch ${i}: ${err.message}`);
      process.exit(1);
    }

    // Build rows
    const rows = batch.map((content, j) => ({
      content,
      embedding: embeddingResponse.data[j].embedding,
      source,
      chunk_index: i + j,
    }));

    // Insert into Supabase
    const { error } = await supabase.from('handbook_chunks').insert(rows);
    if (error) {
      console.error(`\n❌  Supabase error on batch ${i}: ${error.message}`);
      process.exit(1);
    }

    inserted += batch.length;
    const percent = Math.round((inserted / chunks.length) * 100);
    const bar = '█'.repeat(Math.floor(percent / 5)) + '░'.repeat(20 - Math.floor(percent / 5));
    process.stdout.write(`\r    [${bar}] ${percent}% (${inserted}/${chunks.length} chunks)`);

    // Brief pause to respect rate limits
    if (i + BATCH_SIZE < chunks.length) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  console.log(`\n\n✅  Done! ${inserted} chunks ingested for the "${source}" handbook.`);
  console.log('    Your app is ready to answer questions.\n');
}

main().catch((err) => {
  console.error('\n❌  Unexpected error:', err.message);
  process.exit(1);
});
