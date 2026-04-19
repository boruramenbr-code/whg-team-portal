#!/usr/bin/env node
/**
 * Seed the Central Hub org chart.
 *
 * Run from whg-team-portal directory:
 *   node scripts/seed-org-chart-centralhub.mjs
 *
 * Idempotent — clears existing Central Hub org chart rows before inserting.
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

async function main() {
  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('id, name')
    .ilike('name', '%central%');

  if (!restaurants || restaurants.length === 0) {
    console.error('Could not find Central Hub in restaurants table');
    process.exit(1);
  }
  const restId = restaurants[0].id;
  console.log(`Found Central Hub: ${restId}`);

  // Clear existing
  const { error: delErr } = await supabase
    .from('org_chart_positions')
    .delete()
    .eq('restaurant_id', restId);
  if (delErr) {
    console.error('Failed to clear:', delErr.message);
    process.exit(1);
  }

  // ─── LEVEL 1: OWNERS ───
  const owners = [
    { first_name: 'Kit',     last_initial: 'W', title: 'Owner', role_level: 1, sort_order: 1, detail: 'Investor & Advisor' },
    { first_name: 'Randy',   last_initial: 'W', title: 'Owner', role_level: 1, sort_order: 2, detail: 'Operator & Executor' },
    { first_name: 'Eddie',   last_initial: 'W', title: 'Owner', role_level: 1, sort_order: 3, detail: 'Operator' },
    { first_name: 'Ronnie',  last_initial: 'W', title: 'Owner', role_level: 1, sort_order: 4, detail: 'Culinary Director' },
    { first_name: 'Patrick', last_initial: 'W', title: 'Owner', role_level: 1, sort_order: 5, detail: 'Culinary Director' },
  ];

  const ownerRows = owners.map((o) => ({
    restaurant_id: restId,
    reports_to: null,
    photo_url: null,
    active: true,
    ...o,
  }));

  const { data: insertedOwners, error: ownerErr } = await supabase
    .from('org_chart_positions')
    .insert(ownerRows)
    .select('id, first_name');
  if (ownerErr) { console.error('Owners insert failed:', ownerErr.message); process.exit(1); }
  console.log(`  ✓ ${insertedOwners.length} owners`);

  // ─── LEVEL 2: COMING SOON PLACEHOLDER ───
  const randyId = insertedOwners.find((o) => o.first_name === 'Randy').id;

  const { error: csErr } = await supabase
    .from('org_chart_positions')
    .insert([{
      restaurant_id: restId,
      first_name: 'Coming Soon',
      last_initial: '',
      title: 'Team',
      role_level: 2,
      sort_order: 1,
      detail: 'Management and staff positions will be added as Central Hub launches',
      reports_to: randyId,
      photo_url: null,
      active: true,
    }]);
  if (csErr) { console.error('Coming Soon insert failed:', csErr.message); process.exit(1); }
  console.log(`  ✓ 1 coming soon placeholder`);

  console.log(`\nDone. Seeded ${insertedOwners.length + 1} org chart positions for Central Hub.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
