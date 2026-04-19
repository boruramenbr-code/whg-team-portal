// Generates supabase/migrations/006_handbook_sections_reseed.sql from
// scripts/handbook_parsed.json (output of extract-handbook-pdf.py).
//
// Body is serialized as a simple markdown dialect the client parses:
//   ## Heading             — level 2 heading
//   ### Sub-heading        — level 3 heading
//   - Bullet item
//   plain paragraph text (blank line between paragraphs)
//
// Run from whg-team-portal directory:
//   node scripts/build-handbook-reseed.mjs

import { readFileSync, writeFileSync } from 'fs';

const DATA = JSON.parse(readFileSync('./scripts/handbook_parsed.json', 'utf8'));
const OUT = './supabase/migrations/006_handbook_sections_reseed.sql';

function blocksToMarkdown(blocks) {
  const lines = [];
  for (const b of blocks) {
    if (b.kind === 'heading') {
      const prefix = b.level === 3 ? '### ' : '## ';
      lines.push(prefix + b.text);
      lines.push('');
    } else if (b.kind === 'list') {
      for (const item of b.items) {
        lines.push('- ' + item);
      }
      lines.push('');
    } else if (b.kind === 'paragraph') {
      lines.push(b.text);
      lines.push('');
    }
  }
  return lines.join('\n').trim();
}

const sqlLines = [
  '-- ============================================================',
  '-- Handbook re-seed from PDF (scripts/extract-handbook-pdf.py)',
  '-- Replaces the RAG-chunk-based seed with clean, structured bodies',
  '-- formatted as simple markdown: ##/### headings, - bullets, blank',
  '-- lines between paragraphs.',
  '-- ============================================================',
  '',
  "delete from handbook_sections where language = 'en' and handbook_version = 4;",
  '',
];

for (const s of DATA) {
  const body = blocksToMarkdown(s.blocks);
  const tag = `BODY_${s.number}`;
  sqlLines.push(
    `insert into handbook_sections (language, handbook_version, sort_order, title, body, active)`,
  );
  sqlLines.push(
    `values ('en', 4, ${s.number}, $title$${s.title}$title$, $${tag}$${body}$${tag}$, true);`,
  );
  sqlLines.push('');
}

sqlLines.push('-- Verify');
sqlLines.push(
  "select sort_order, title, length(body) as body_len from handbook_sections where language = 'en' and handbook_version = 4 order by sort_order;",
);
sqlLines.push('');

writeFileSync(OUT, sqlLines.join('\n'), 'utf8');
console.log(`Wrote ${OUT}  (${DATA.length} sections)`);
