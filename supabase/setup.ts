/**
 * Seeds Supabase after supabase/schema.sql has been run in the SQL editor.
 *   VITE_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run db:setup
 */
import { createClient } from '@supabase/supabase-js';
import seed from '../src/seed.json';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;

async function main() {
  if (!url || !key) {
    console.log('No Supabase credentials set — the app will run in local live mode. Nothing to seed.');
    return;
  }
  const sb = createClient(url, key);
  const probe = await sb.from('fazaa_requests').select('id').limit(1);
  if (probe.error) {
    console.error('Tables missing. Run supabase/schema.sql in the Supabase SQL editor first.\n', probe.error.message);
    process.exit(1);
  }

  const regions = seed.regions.map((r) => ({
    id: r.id, name_ar: r.ar, name_en: r.en, hub_en: r.hub_en, cars: r.cars, workshops: r.workshops, eta_min: r.eta,
  }));
  const s = seed.sample_request;
  const request = {
    id: s.id, region: s.region, incident: s.incident, car: s.car, plate: s.plate, phone: s.phone,
    step: s.current_step,
    step_times: s.step_times.map((t, i) => (i < s.current_step ? t : null)),
    created_at: s.base_time,
  };

  for (const [table, rows] of [['fazaa_regions', regions], ['fazaa_requests', [request]]] as const) {
    const { error } = await sb.from(table).upsert(rows as object[]);
    if (error) throw new Error(`${table}: ${error.message}`);
    console.log(`seeded ${table}: ${rows.length}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
