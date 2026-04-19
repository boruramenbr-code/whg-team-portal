#!/usr/bin/env node
/**
 * Seed the Boru Ramen org chart.
 *
 * Run from whg-team-portal directory:
 *   node scripts/seed-org-chart-boru.mjs
 *
 * Idempotent — clears existing Boru org chart rows before inserting.
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
  // Look up Boru Ramen restaurant ID
  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('id, name')
    .ilike('name', '%boru%');

  if (!restaurants || restaurants.length === 0) {
    console.error('Could not find Boru Ramen in restaurants table');
    process.exit(1);
  }
  const boruId = restaurants[0].id;
  console.log(`Found Boru Ramen: ${boruId}`);

  // Clear existing org chart for Boru
  const { error: delErr } = await supabase
    .from('org_chart_positions')
    .delete()
    .eq('restaurant_id', boruId);
  if (delErr) {
    console.error('Failed to clear:', delErr.message);
    process.exit(1);
  }

  // ─── LEVEL 1: OWNERS ───
  const owners = [
    { first_name: 'Kit',     last_initial: 'W', title: 'Owner',          role_level: 1, sort_order: 1, detail: 'Investor & Advisor' },
    { first_name: 'Randy',   last_initial: 'W', title: 'Owner',          role_level: 1, sort_order: 2, detail: 'Operator & Executor' },
    { first_name: 'Patrick', last_initial: 'W', title: 'Owner',          role_level: 1, sort_order: 3, detail: 'Culinary Director' },
    { first_name: 'Ronnie',  last_initial: 'W', title: 'Silent Partner', role_level: 1, sort_order: 4, detail: 'Silent Partner · Culinary Director' },
    { first_name: 'Eddie',   last_initial: 'W', title: 'Silent Partner', role_level: 1, sort_order: 5, detail: 'Silent Partner · Operator' },
  ];

  const ownerRows = owners.map((o) => ({
    restaurant_id: boruId,
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

  const randyId = insertedOwners.find((o) => o.first_name === 'Randy').id;

  // ─── LEVEL 2: RESTAURANT MANAGER + ADMIN/HR (report to Randy) ───
  const { data: insertedRM, error: rmErr } = await supabase
    .from('org_chart_positions')
    .insert([
      {
        restaurant_id: boruId,
        first_name: 'Lorell', last_initial: 'H', title: 'Restaurant Manager',
        role_level: 2, sort_order: 1,
        detail: 'Oversees all restaurant operations',
        reports_to: randyId, photo_url: null, active: true,
      },
      {
        restaurant_id: boruId,
        first_name: 'TBD', last_initial: '', title: 'Admin / HR',
        role_level: 2, sort_order: 2,
        detail: 'Position open · Payroll, HR, onboarding & office admin for all restaurants',
        reports_to: randyId, photo_url: null, active: true,
      },
    ])
    .select('id, first_name');
  if (rmErr) { console.error('RM insert failed:', rmErr.message); process.exit(1); }
  console.log(`  ✓ ${insertedRM.length} level-2 positions (manager + admin/hr)`);
  const lorellId = insertedRM.find((r) => r.first_name === 'Lorell').id;

  // ─── LEVEL 3: KITCHEN MANAGER (reports to Lorell) ───
  const { data: insertedKM, error: kmErr } = await supabase
    .from('org_chart_positions')
    .insert([{
      restaurant_id: boruId,
      first_name: 'Alec', last_initial: 'C', title: 'Kitchen Manager',
      role_level: 3, sort_order: 2,
      detail: 'Oversees all back-of-house operations',
      reports_to: lorellId, photo_url: null, active: true,
    }])
    .select('id, first_name');
  if (kmErr) { console.error('KM insert failed:', kmErr.message); process.exit(1); }
  console.log(`  ✓ 1 kitchen manager`);
  const alecId = insertedKM[0].id;

  // ─── LEVEL 4: ASSISTANT MANAGERS (Sean under Lorell, Granger under Alec) ───
  const assistants = [
    { first_name: 'Sean',    last_initial: 'P', title: 'Asst. FOH Manager',    role_level: 4, sort_order: 1, detail: 'Part-time · Assists with front-of-house operations', reports_to: lorellId },
    { first_name: 'Granger', last_initial: 'D', title: 'Asst. Kitchen Manager', role_level: 4, sort_order: 2, detail: 'Assists with back-of-house operations', reports_to: alecId },
  ];

  const asstRows = assistants.map((a) => ({
    restaurant_id: boruId,
    photo_url: null,
    active: true,
    ...a,
  }));

  const { data: insertedAssts, error: asstErr } = await supabase
    .from('org_chart_positions')
    .insert(asstRows)
    .select('id, first_name');
  if (asstErr) { console.error('Assistants insert failed:', asstErr.message); process.exit(1); }
  console.log(`  ✓ ${insertedAssts.length} assistant managers`);

  const seanId    = insertedAssts.find((a) => a.first_name === 'Sean').id;
  const grangerId = insertedAssts.find((a) => a.first_name === 'Granger').id;

  // ─── LEVEL 5: FOH POSITIONS (report to Sean) ───
  const fohPositions = [
    { first_name: 'Hostess',    last_initial: '', title: 'FOH', role_level: 5, sort_order: 1, detail: 'Greets guests and manages seating · Reports to Sean or Lorell' },
    { first_name: 'Servers',    last_initial: '', title: 'FOH', role_level: 5, sort_order: 2, detail: 'Takes orders and serves guests · Reports to Sean or Lorell' },
    { first_name: 'Bartenders', last_initial: '', title: 'FOH', role_level: 5, sort_order: 3, detail: 'Prepares drinks and manages bar area · Reports to Sean or Lorell' },
    { first_name: 'Busser',     last_initial: '', title: 'FOH', role_level: 5, sort_order: 4, detail: 'Clears and resets tables · Reports to Sean or Lorell' },
  ];

  const fohRows = fohPositions.map((p) => ({
    restaurant_id: boruId,
    reports_to: seanId,
    photo_url: null,
    active: true,
    ...p,
  }));

  const { data: insertedFoh, error: fohErr } = await supabase
    .from('org_chart_positions')
    .insert(fohRows)
    .select('id, first_name');
  if (fohErr) { console.error('FOH insert failed:', fohErr.message); process.exit(1); }
  console.log(`  ✓ ${insertedFoh.length} FOH positions`);

  // ─── LEVEL 5: BOH POSITIONS (report to Granger) ───
  const bohPositions = [
    { first_name: 'Ramen Line',              last_initial: '', title: 'BOH', role_level: 5, sort_order: 1, detail: 'Prepares and assembles ramen orders · Reports to Granger or Alec' },
    { first_name: 'Fry Line',                last_initial: '', title: 'BOH', role_level: 5, sort_order: 2, detail: 'Manages fried items and appetizers · Reports to Granger or Alec' },
    { first_name: 'Prep',                    last_initial: '', title: 'BOH', role_level: 5, sort_order: 3, detail: 'Daily food preparation and mise en place · Reports to Granger or Alec' },
    { first_name: 'Cleaning Crew', last_initial: '', title: 'BOH', role_level: 5, sort_order: 4, detail: 'Maintains cleanliness and dish sanitation · Reports to Granger or Alec' },
  ];

  const bohRows = bohPositions.map((p) => ({
    restaurant_id: boruId,
    reports_to: grangerId,
    photo_url: null,
    active: true,
    ...p,
  }));

  const { data: insertedBoh, error: bohErr } = await supabase
    .from('org_chart_positions')
    .insert(bohRows)
    .select('id, first_name');
  if (bohErr) { console.error('BOH insert failed:', bohErr.message); process.exit(1); }
  console.log(`  ✓ ${insertedBoh.length} BOH positions`);

  const total = insertedOwners.length + insertedRM.length + insertedKM.length + insertedAssts.length + insertedFoh.length + insertedBoh.length;
  console.log(`\nDone. Seeded ${total} org chart positions for Boru Ramen.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
