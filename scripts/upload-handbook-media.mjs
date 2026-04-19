#!/usr/bin/env node
/**
 * Upload handbook infographics to Supabase Storage + seed handbook_media rows.
 *
 * Run from whg-team-portal directory:
 *   node scripts/upload-handbook-media.mjs
 *
 * Requires .env.local with:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Prerequisites:
 *   - Migration 007 has been run (handbook_media table + bucket + policies)
 *   - PNG files exist in whg-team-portal/handbook-media/
 *   - English handbook (version 4) has been seeded via migration 006
 *
 * Idempotent — safe to re-run. Uploads use upsert; rows are cleared for
 * each section before inserting to keep ordering clean.
 */

import { readFileSync, readdirSync } from 'fs';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const BUCKET = 'handbook-media';
const MEDIA_DIR = resolve(process.cwd(), 'handbook-media');

// Map: filename → { section sort_order, caption, alt_text, position within section }
// Section numbers match handbook_sections.sort_order for language='en', version=4.
const MAPPING = [
  { file: '90day.png',                 section: 2,  order: 1, caption: '90-Day Introductory Period',            alt: 'Infographic explaining the 90-day introductory employment period.' },
  { file: 'Audio.png',                 section: 3,  order: 1, caption: 'Audio & Headphone Policy',              alt: 'Infographic showing the policy on headphones and audio devices during shift.' },
  { file: 'Time Keeping.png',          section: 4,  order: 1, caption: 'Timekeeping Rules',                     alt: 'Infographic summarizing clock-in and clock-out procedures.' },
  { file: 'Shift Swap.png',            section: 4,  order: 2, caption: 'How to Swap a Shift',                   alt: 'Infographic showing the approved process for swapping shifts.' },
  { file: 'Pay Calendar.png',          section: 5,  order: 1, caption: 'Pay Period Calendar',                   alt: 'Infographic showing the pay period and payday schedule.' },
  { file: 'Injury.png',                section: 6,  order: 1, caption: 'Injury Reporting',                      alt: 'Infographic on what to do if injured at work.' },
  { file: 'Emergency.png',             section: 6,  order: 2, caption: 'Emergency Procedures',                  alt: 'Infographic covering emergency response procedures.' },
  { file: '18+.png',                   section: 6,  order: 3, caption: '18+ Restricted Tasks',                  alt: 'Infographic listing tasks restricted to employees 18 and older.' },
  { file: 'The 5 Pillars.png',         section: 7,  order: 1, caption: 'The 5 Pillars of Performance',          alt: 'Infographic of the five performance evaluation pillars.' },
  { file: 'The rules of the table.png',section: 9,  order: 1, caption: 'Rules of the Table (Meal Policy)',      alt: 'Infographic showing the staff meal policy rules.' },
  { file: 'Hygiene.png',               section: 10, order: 1, caption: 'Hygiene & Uniform Standards',           alt: 'Infographic on personal hygiene and uniform standards.' },
  { file: 'Concern.png',               section: 11, order: 1, caption: 'How to Raise a Concern',                alt: 'Infographic on reporting harassment, discrimination, or other concerns.' },
];

async function main() {
  // Sanity-check all files exist
  const existing = new Set(readdirSync(MEDIA_DIR));
  const missing = MAPPING.filter((m) => !existing.has(m.file));
  if (missing.length) {
    console.error('Missing files in handbook-media/:', missing.map((m) => m.file));
    process.exit(1);
  }

  // Look up section UUIDs by sort_order (English, version 4)
  const { data: sections, error: secErr } = await supabase
    .from('handbook_sections')
    .select('id, sort_order')
    .eq('language', 'en')
    .eq('handbook_version', 4)
    .eq('active', true);
  if (secErr) {
    console.error('Failed to load sections:', secErr.message);
    process.exit(1);
  }
  const byOrder = new Map(sections.map((s) => [s.sort_order, s.id]));

  // 1) Upload every file to the bucket (upsert — idempotent)
  console.log(`Uploading ${MAPPING.length} files to bucket "${BUCKET}"…`);
  for (const m of MAPPING) {
    const bytes = readFileSync(resolve(MEDIA_DIR, m.file));
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(m.file, bytes, {
        contentType: 'image/png',
        upsert: true,
        cacheControl: '3600',
      });
    if (error) {
      console.error(`  ✗ ${m.file}: ${error.message}`);
      process.exit(1);
    }
    console.log(`  ✓ ${m.file}`);
  }

  // 2) Clear existing handbook_media rows for the affected sections, then
  //    insert fresh rows. This keeps ordering clean across re-runs.
  const affectedSectionIds = [...new Set(MAPPING.map((m) => byOrder.get(m.section)).filter(Boolean))];
  if (affectedSectionIds.length) {
    const { error: delErr } = await supabase
      .from('handbook_media')
      .delete()
      .in('section_id', affectedSectionIds);
    if (delErr) {
      console.error('Failed to clear old media rows:', delErr.message);
      process.exit(1);
    }
  }

  const rows = MAPPING.map((m) => {
    const sectionId = byOrder.get(m.section);
    if (!sectionId) {
      console.error(`No section with sort_order=${m.section} found.`);
      process.exit(1);
    }
    return {
      section_id: sectionId,
      sort_order: m.order,
      storage_path: m.file,
      caption: m.caption,
      alt_text: m.alt,
      active: true,
    };
  });

  const { error: insErr } = await supabase.from('handbook_media').insert(rows);
  if (insErr) {
    console.error('Failed to insert media rows:', insErr.message);
    process.exit(1);
  }

  console.log(`\nInserted ${rows.length} handbook_media rows across ${affectedSectionIds.length} sections.`);
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
