// Reconstructs the readable handbook from the RAG chunk source
// (handbook_chunks_raw.json) into clean, section-based rows for the
// handbook_sections table.
//
// Output: supabase/migrations/005_handbook_sections_seed.sql
//
// Run from the whg-team-portal directory:
//   node scripts/build-handbook-sections.mjs
//
// The RAG chunk file is split by ~300-word overlapping windows and is
// not suitable for display. This script:
//   1. Detects "SECTION N: TITLE" markers in English employee chunks
//   2. Concatenates chunks between markers into a single body
//   3. Strips the repeating page header ("Wong Hospitality Group — Team
//      HandbookVersion 4.0 | Confidential") and page-number trailers
//   4. De-duplicates overlapping text between adjacent chunks

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

const RAW = JSON.parse(readFileSync('./handbook_chunks_raw.json', 'utf8'));
const OUT = './supabase/migrations/005_handbook_sections_seed.sql';

const HEADER_NOISE =
  /Wong Hospitality Group\s+[—-]+\s+Team HandbookVersion 4\.0\s*\|\s*Confidential/gi;
const PAGE_TRAILER = /Section\s+\d+:\s*[A-Z][\w &'\-,]*\bPage\b/gi;
// Matches just the "SECTION N:" opener. Title is extracted line-by-line
// below so multi-line all-caps titles are handled reliably.
const SECTION_START_RE = /^\s*SECTION\s+(\d+)\s*:\s*(.*)$/m;

// A line counts as "still the title" if it's mostly uppercase and has no
// trailing lowercase word (prose).
function looksLikeTitleLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (trimmed.length > 80) return false;
  // Must start with a capital letter or ampersand
  if (!/^[&A-Z0-9]/.test(trimmed)) return false;
  // Must contain no lowercase letters
  if (/[a-z]/.test(trimmed)) return false;
  return true;
}

function extractSectionHeader(blockText) {
  const match = blockText.match(SECTION_START_RE);
  if (!match) return null;

  const number = parseInt(match[1], 10);
  const afterMarker = match[2] ?? '';
  const rest = blockText.slice(match.index + match[0].length).split('\n');

  const titleParts = [];
  if (afterMarker.trim()) titleParts.push(afterMarker.trim());
  for (const line of rest) {
    if (!line.trim()) continue; // skip blank lines between title fragments
    if (looksLikeTitleLine(line)) {
      titleParts.push(line.trim());
    } else {
      break;
    }
  }
  return {
    number,
    rawTitle: titleParts.join(' ').replace(/\s+/g, ' ').trim(),
  };
}

// Chunks to the English employee handbook stop before the Spanish section
// starts. We hard-cap at the index of the first Spanish chunk to be safe.
const SPANISH_START_MARKER = 'UN MENSAJE DE LA DIRECCI';

function clean(text) {
  // Kill repeating page headers and "Section X: TitlePage" trailers
  let t = text.replace(HEADER_NOISE, '');
  t = t.replace(PAGE_TRAILER, '');
  // Collapse 3+ newlines into 2
  t = t.replace(/\n{3,}/g, '\n\n');
  // Normalize whitespace on each line
  t = t.split('\n').map((l) => l.replace(/\s+$/g, '')).join('\n');
  return t.trim();
}

// Concat two chunk bodies, removing overlapping suffix/prefix text if any.
// RAG chunks overlap by a sentence or two — a simple longest-common-suffix/
// prefix trim handles it cleanly.
function smartConcat(a, b) {
  if (!a) return b;
  if (!b) return a;
  const maxOverlap = Math.min(a.length, b.length, 300);
  for (let len = maxOverlap; len > 30; len--) {
    if (a.slice(-len) === b.slice(0, len)) {
      return a + b.slice(len);
    }
  }
  return a + '\n\n' + b;
}

// Pretty-cased title: "WELCOME & OUR CULTURE" → "Welcome & Our Culture"
function titleCase(s) {
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w.length <= 2 && w !== 'we' ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ')
    .replace(/\bAnd\b/g, 'and')
    .replace(/\bOf\b/g, 'of')
    .replace(/\bThe\b/g, 'the')
    .replace(/^./, (c) => c.toUpperCase());
}

function buildSections() {
  const chunks = RAW.filter((c) => c.source === 'employee');

  // Cut off once Spanish content begins
  const englishEnd = chunks.findIndex((c) => c.content.includes(SPANISH_START_MARKER));
  const englishChunks = englishEnd === -1 ? chunks : chunks.slice(0, englishEnd);

  const sections = [];
  let current = null;

  for (const ch of englishChunks) {
    const header = extractSectionHeader(ch.content);
    if (header) {
      if (current) sections.push(current);
      current = {
        number: header.number,
        rawTitle: header.rawTitle,
        body: ch.content,
      };
    } else if (current) {
      current.body = smartConcat(current.body, ch.content);
    }
    // Chunks before the first SECTION marker (the cover page) are dropped.
  }
  if (current) sections.push(current);

  // Clean + finalize
  return sections.map((s) => {
    let body = clean(s.body);
    // Remove the "SECTION N: TITLE ..." heading block from the body — it'll
    // be rendered as an <h1> by the UI. Strip everything up to the first
    // prose line (line containing any lowercase letter).
    const lines = body.split('\n');
    let firstProse = lines.findIndex((l) => /[a-z]/.test(l));
    if (firstProse === -1) firstProse = 0;
    body = lines.slice(firstProse).join('\n').trim();
    return {
      number: s.number,
      title: titleCase(s.rawTitle),
      body,
    };
  }).sort((a, b) => a.number - b.number);
}

function sqlEscape(s) {
  // Use dollar-quoting to sidestep any embedded single-quotes
  return `$BODY_${Math.random().toString(36).slice(2, 8)}$${s}$BODY_${Math.random().toString(36).slice(2, 8)}$`;
}

function toSQL(sections) {
  const lines = [
    '-- ============================================================',
    '-- Handbook sections seed — generated by scripts/build-handbook-sections.mjs',
    '-- Do not edit by hand. Re-run the script to regenerate.',
    '-- ============================================================',
    '',
    "-- Clear any prior English v4 sections and re-seed.",
    "delete from handbook_sections where language = 'en' and handbook_version = 4;",
    '',
  ];

  for (const s of sections) {
    const tag = `BODY_${s.number}`;
    lines.push(
      `insert into handbook_sections (language, handbook_version, sort_order, title, body, active)`,
    );
    lines.push(
      `values ('en', 4, ${s.number}, $title$${s.title}$title$, $${tag}$${s.body}$${tag}$, true);`,
    );
    lines.push('');
  }

  lines.push('-- Verify');
  lines.push(
    "select sort_order, title, length(body) as body_len from handbook_sections where language = 'en' and handbook_version = 4 order by sort_order;",
  );
  lines.push('');
  return lines.join('\n');
}

const sections = buildSections();
console.log(`Reconstructed ${sections.length} sections:`);
for (const s of sections) {
  console.log(`  ${s.number}. ${s.title} (${s.body.length} chars)`);
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, toSQL(sections), 'utf8');
console.log(`\nWrote ${OUT}`);
