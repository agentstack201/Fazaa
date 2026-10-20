/**
 * Unified data service. Local reactive state is the source the UI renders from;
 * when VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are present every write is
 * mirrored to Supabase PostgreSQL through PostgREST and remote rows are pulled
 * on start. Without credentials the app keeps working on its seeded state.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import seed from '../seed.json';

export type Incident = 'breakdown' | 'accident';
export type CarId = 'economy' | 'sedan' | 'suv';

export interface FazaaRequest {
  id: string;
  region: string;
  incident: Incident;
  car: CarId;
  plate: string;
  phone: string;
  /** 1..5 = active step, 6 = completed */
  step: number;
  step_times: (string | null)[];
  created_at: string;
}

export type Mode = 'live' | 'local';
interface State { request: FazaaRequest; mode: Mode }

const KEY = 'fazaa.request.v1';
const S = seed.sample_request;

export const sampleRequest = (): FazaaRequest => ({
  id: S.id,
  region: S.region,
  incident: S.incident as Incident,
  car: S.car as CarId,
  plate: S.plate,
  phone: S.phone,
  step: S.current_step,
  step_times: S.step_times.map((t, i) => (i < S.current_step ? t : null)),
  created_at: S.base_time,
});

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const sb: SupabaseClient | null = url && anon ? createClient(url, anon) : null;

function loadLocal(): FazaaRequest {
  try {
    if (new URLSearchParams(location.search).has('demo')) return sampleRequest();
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as FazaaRequest;
  } catch { /* storage unavailable */ }
  return sampleRequest();
}

let state: State = { request: loadLocal(), mode: sb ? 'live' : 'local' };
const listeners = new Set<(s: State) => void>();

function set(request: FazaaRequest) {
  state = { ...state, request };
  try { localStorage.setItem(KEY, JSON.stringify(request)); } catch { /* ignore */ }
  listeners.forEach((l) => l(state));
}

async function push(r: FazaaRequest, step?: number) {
  if (!sb) return;
  const { error } = await sb.from('fazaa_requests').upsert(r);
  if (!error && step) await sb.from('fazaa_events').insert({ request_id: r.id, step, at: r.step_times[step - 1] });
  if (error) { state = { ...state, mode: 'local' }; listeners.forEach((l) => l(state)); }
}

export const db = {
  get: () => state,
  subscribe(fn: (s: State) => void) {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  },

  async init() {
    if (!sb) return;
    const { data, error } = await sb
      .from('fazaa_requests').select('*').eq('id', state.request.id).maybeSingle();
    if (error) { state = { ...state, mode: 'local' }; listeners.forEach((l) => l(state)); return; }
    if (data) set(data as FazaaRequest); else await push(state.request);
    sb.channel('fazaa').on('postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'fazaa_requests' },
      (p) => { const r = p.new as FazaaRequest; if (r.id === state.request.id) set(r); }).subscribe();
  },

  async createRequest(input: Pick<FazaaRequest, 'region' | 'incident' | 'car' | 'plate' | 'phone'>) {
    const now = new Date();
    const id = `FZ-${String(now.getFullYear()).slice(2)}-${String(Math.floor(1000 + Math.random() * 9000))}`;
    const r: FazaaRequest = { ...input, id, step: 1, step_times: [now.toISOString(), null, null, null, null], created_at: now.toISOString() };
    set(r);
    await push(r, 1);
    return r;
  },

  async advance() {
    const r = state.request;
    if (r.step > 5) return;
    const next = r.step + 1;
    const times = [...r.step_times];
    if (next <= 5) {
      // The seeded demo request follows its fixed Asia/Riyadh timeline; live requests use the real clock.
      const fixed = r.id === S.id ? S.step_times[next - 1] : null;
      const prev = new Date(times[r.step - 1] ?? Date.now()).getTime();
      times[next - 1] = fixed ?? new Date(Math.max(Date.now(), prev + 60_000)).toISOString();
    }
    const updated = { ...r, step: next, step_times: times };
    set(updated);
    await push(updated, next <= 5 ? next : undefined);
  },

  async reset() {
    const r = sampleRequest();
    set(r);
    await push(r);
  },
};
