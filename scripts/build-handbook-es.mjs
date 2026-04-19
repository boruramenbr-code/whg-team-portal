// Generates supabase/migrations/010_handbook_sections_es.sql from
// scripts/handbook_parsed_es.json (Spanish translation of the handbook).
//
// Same markdown format as the English reseed (006):
//   ## Heading             — level 2 heading
//   ### Sub-heading        — level 3 heading
//   - Bullet item
//   plain paragraph text (blank line between paragraphs)
//
// Run from whg-team-portal directory:
//   node scripts/build-handbook-es.mjs

import { readFileSync, writeFileSync } from 'fs';

const DATA = JSON.parse(readFileSync('./scripts/handbook_parsed_es.json', 'utf8'));
const OUT = './supabase/migrations/010_handbook_sections_es.sql';

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
  '-- Spanish Handbook seed (scripts/handbook_parsed_es.json)',
  '-- Inserts all 13 sections with language = \'es\', handbook_version = 4',
  '-- matching the English reseed (006).',
  '-- ============================================================',
  '',
  "-- Remove any prior Spanish seed so this is idempotent",
  "delete from handbook_sections where language = 'es' and handbook_version = 4;",
  '',
];

for (const s of DATA) {
  const body = blocksToMarkdown(s.blocks);
  const tag = `BODY_ES_${s.number}`;
  sqlLines.push(
    `insert into handbook_sections (language, handbook_version, sort_order, title, body, active)`,
  );
  sqlLines.push(
    `values ('es', 4, ${s.number}, $title_es$${s.title}$title_es$, $${tag}$${body}$${tag}$, true);`,
  );
  sqlLines.push('');
}

sqlLines.push('-- Verify');
sqlLines.push(
  "select sort_order, title, length(body) as body_len from handbook_sections where language = 'es' and handbook_version = 4 order by sort_order;",
);
sqlLines.push('');

writeFileSync(OUT, sqlLines.join('\n'), 'utf8');
console.log(`Wrote ${OUT}  (${DATA.length} sections)`);
