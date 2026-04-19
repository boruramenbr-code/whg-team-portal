#!/usr/bin/env node
/**
 * Seed the Ichiban Sushi org chart.
 *
 * Run from whg-team-portal directory:
 *   node scripts/seed-org-chart-ichiban.mjs
 *
 * Idempotent — clears existing Ichiban org chart rows before inserting.
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
    .ilike('name', '%ichiban%');

  if (!restaurants || restaurants.length === 0) {
    console.error('Could not find Ichiban Sushi in restaurants table');
    process.exit(1);
  }
  const restId = restaurants[0].id;
  console.log(`Found Ichiban Sushi: ${restId}`);

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
    { first_name: 'Kit',     last_initial: 'W', title: 'Silent Partner', role_level: 1, sort_order: 1, detail: 'Silent Partner · Investor & Advisor' },
    { first_name: 'Randy',   last_initial: 'W', title: 'Owner',          role_level: 1, sort_order: 2, detail: 'Operator & Executor' },
    { first_name: 'Eddie',   last_initial: 'W', title: 'Owner',          role_level: 1, sort_order: 3, detail: 'Operator' },
    { first_name: 'Ronnie',  last_initial: 'W', title: 'Owner',          role_level: 1, sort_order: 4, detail: 'Culinary Director' },
    { first_name: 'Patrick', last_initial: 'W', title: 'Silent Partner', role_level: 1, sort_order: 5, detail: 'Silent Partner · Culinary Director' },
  ];

  const ownerRows = owners.map((o) => ({
    restaurant_id: restId, reports_to: null, photo_url: null, active: true, ...o,
  }));

  const { data: insertedOwners, error: ownerErr } = await supabase
    .from('org_chart_positions')
    .insert(ownerRows)
    .select('id, first_name');
  if (ownerErr) { console.error('Owners insert failed:', ownerErr.message); process.exit(1); }
  console.log(`  ✓ ${insertedOwners.length} owners`);

  const randyId = insertedOwners.find((o) => o.first_name === 'Randy').id;

  // ─── LEVEL 2: OFFICE MANAGER + RESTAURANT MANAGER ───
  const level2 = [
    {
      first_name: 'TBD', last_initial: '', title: 'Office Manager',
      role_level: 2, sort_order: 1,
      detail: 'Payroll, HR, onboarding & office admin for all restaurants',
      reports_to: randyId,
    },
    {
      first_name: 'Bryan', last_initial: 'L', title: 'Restaurant Manager',
      role_level: 2, sort_order: 2,
      detail: 'Oversees all restaurant operations',
      reports_to: randyId,
    },
  ];

  const level2Rows = level2.map((p) => ({
    restaurant_id: restId, photo_url: null, active: true, ...p,
  }));

  const { data: insertedL2, error: l2Err } = await supabase
    .from('org_chart_positions')
    .insert(level2Rows)
    .select('id, title');
  if (l2Err) { console.error('Level 2 insert failed:', l2Err.message); process.exit(1); }
  console.log(`  ✓ ${insertedL2.length} level-2 positions`);

  const bryanId = insertedL2.find((p) => p.title === 'Restaurant Manager').id;

  // ─── LEVEL 3: DEPARTMENT HEADS (report to Bryan) ───
  const level3 = [
    { first_name: 'Assistant Manager', last_initial: '', title: 'FOH',             role_level: 3, sort_order: 1, detail: 'Assists Restaurant Manager with front-of-house operations' },
    { first_name: 'Marshall',          last_initial: 'P', title: 'Bar Manager',    role_level: 3, sort_order: 2, detail: 'Oversees bar operations' },
    { first_name: 'Johnny',            last_initial: 'F', title: 'Sushi Manager',  role_level: 3, sort_order: 3, detail: 'Oversees sushi bar operations' },
    { first_name: 'Raf',               last_initial: 'C', title: 'Kitchen Manager', role_level: 3, sort_order: 4, detail: 'Oversees all back-of-house kitchen operations' },
  ];

  const level3Rows = level3.map((p) => ({
    restaurant_id: restId, reports_to: bryanId, photo_url: null, active: true, ...p,
  }));

  const { data: insertedL3, error: l3Err } = await supabase
    .from('org_chart_positions')
    .insert(level3Rows)
    .select('id, first_name, title');
  if (l3Err) { console.error('Level 3 insert failed:', l3Err.message); process.exit(1); }
  console.log(`  ✓ ${insertedL3.length} department heads`);

  const asstMgrId  = insertedL3.find((p) => p.first_name === 'Assistant Manager').id;
  const marshallId = insertedL3.find((p) => p.first_name === 'Marshall').id;
  const johnnyId   = insertedL3.find((p) => p.first_name === 'Johnny').id;
  const rafId      = insertedL3.find((p) => p.first_name === 'Raf').id;

  // ─── LEVEL 4: SUPERVISORS / LEADS ───
  const level4 = [
    // FOH leads — report to Assistant Manager
    { first_name: 'Server Lead',  last_initial: '', title: 'FOH',     role_level: 4, sort_order: 1, detail: 'Trainer · Leads server team · Reports to Assistant Manager',   reports_to: asstMgrId },
    { first_name: 'Host Lead',    last_initial: '', title: 'FOH',     role_level: 4, sort_order: 2, detail: 'Trainer · Leads host team · Reports to Assistant Manager',     reports_to: asstMgrId },

    // BOH leads
    { first_name: 'Sushi Lead',   last_initial: '', title: 'Sushi',   role_level: 4, sort_order: 3, detail: 'Trainer · Leads sushi prep team · Reports to Johnny',          reports_to: johnnyId },
    { first_name: 'Kitchen Lead', last_initial: '', title: 'Kitchen', role_level: 4, sort_order: 4, detail: 'Trainer · Leads kitchen line team · Reports to Raf',           reports_to: rafId },
  ];

  const level4Rows = level4.map((p) => ({
    restaurant_id: restId, photo_url: null, active: true, ...p,
  }));

  const { data: insertedL4, error: l4Err } = await supabase
    .from('org_chart_positions')
    .insert(level4Rows)
    .select('id, first_name');
  if (l4Err) { console.error('Level 4 insert failed:', l4Err.message); process.exit(1); }
  console.log(`  ✓ ${insertedL4.length} supervisors`);

  const serverLeadId  = insertedL4.find((p) => p.first_name === 'Server Lead').id;
  const hostLeadId    = insertedL4.find((p) => p.first_name === 'Host Lead').id;
  const sushiLeadId   = insertedL4.find((p) => p.first_name === 'Sushi Lead').id;
  const kitchenLeadId = insertedL4.find((p) => p.first_name === 'Kitchen Lead').id;

  // ─── LEVEL 5: STAFF POSITIONS ───
  const level5 = [
    // FOH — report to respective leads or Bar Manager
    { first_name: 'Hostess',              last_initial: '', title: 'FOH', role_level: 5, sort_order: 1,  detail: 'Greets guests and manages seating · Reports to Host Lead',               reports_to: hostLeadId },
    { first_name: 'Servers',              last_initial: '', title: 'FOH', role_level: 5, sort_order: 2,  detail: 'Takes orders and serves guests · Reports to Server Lead',                 reports_to: serverLeadId },
    { first_name: 'Takeout Station',      last_initial: '', title: 'FOH', role_level: 5, sort_order: 3,  detail: 'Manages takeout and to-go orders · Reports to Server Lead',              reports_to: serverLeadId },
    { first_name: 'Busser',               last_initial: '', title: 'FOH', role_level: 5, sort_order: 4,  detail: 'Clears and resets tables · Reports to Host Lead',                        reports_to: hostLeadId },
    { first_name: 'Expeditor',            last_initial: '', title: 'FOH', role_level: 5, sort_order: 5,  detail: 'Coordinates orders between kitchen and servers · Reports to Server Lead', reports_to: serverLeadId },
    { first_name: 'Bar Back / Bartender', last_initial: '', title: 'FOH', role_level: 5, sort_order: 6,  detail: 'Supports bar operations · Reports to Marshall',                          reports_to: marshallId },

    // BOH — report to Kitchen Lead or Sushi Lead
    { first_name: 'Sushi Chefs',      last_initial: '', title: 'BOH', role_level: 5, sort_order: 7,  detail: 'Prepares sushi orders · Reports to Sushi Lead or Johnny',             reports_to: sushiLeadId },
    { first_name: 'Line Chef',        last_initial: '', title: 'BOH', role_level: 5, sort_order: 8,  detail: 'Manages kitchen line · Reports to Kitchen Lead or Raf',                reports_to: kitchenLeadId },
    { first_name: 'Prep Chef',        last_initial: '', title: 'BOH', role_level: 5, sort_order: 9,  detail: 'Daily food preparation · Reports to Kitchen Lead or Raf',              reports_to: kitchenLeadId },
    { first_name: 'Cleaning Crew',    last_initial: '', title: 'BOH', role_level: 5, sort_order: 10, detail: 'Maintains cleanliness and dish sanitation · Reports to Kitchen Lead',  reports_to: kitchenLeadId },

    // Hibachi — reports directly to Restaurant Manager
    { first_name: 'Hibachi Chefs',    last_initial: '', title: 'BOH', role_level: 5, sort_order: 11, detail: 'Hibachi grill chefs · Reports to Restaurant Manager',                 reports_to: bryanId },
  ];

  const level5Rows = level5.map((p) => ({
    restaurant_id: restId, photo_url: null, active: true, ...p,
  }));

  const { data: insertedL5, error: l5Err } = await supabase
    .from('org_chart_positions')
    .insert(level5Rows)
    .select('id, first_name');
  if (l5Err) { console.error('Level 5 insert failed:', l5Err.message); process.exit(1); }
  console.log(`  ✓ ${insertedL5.length} staff positions`);

  const total = insertedOwners.length + insertedL2.length + insertedL3.length + insertedL4.length + insertedL5.length;
  console.log(`\nDone. Seeded ${total} org chart positions for Ichiban Sushi.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
