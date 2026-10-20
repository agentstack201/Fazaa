# فزعة — FAZA'A: Road Assistance & Car Delivery

Mobile-sized bilingual (Arabic / English) PWA. When a car breaks down or has an accident anywhere in Saudi Arabia's 13 regions, FAZA'A sends a field specialist with a replacement car, keeps the damaged car safe, repairs it in partner workshops, and hands it back.

Team: Nawaf Fahad Alharbi (170490) · Abdulaziz Alfarraj (170467) · Faris Alsuhaibani (170426) · Mohammed Aljuryban (171623) · Hatim Alsubaie (170503)

## Run
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # tsc --noEmit + vite build -> dist/
```
The app works immediately on seeded local state (`src/seed.json`), persisted in the browser.

## Supabase (optional)
1. Run `supabase/schema.sql` in the Supabase SQL editor.
2. Copy `.env.example` to `.env` and set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (and `SUPABASE_SERVICE_ROLE_KEY` for seeding).
3. `npm run db:setup` seeds the 13 regions and the sample request.

All reads/writes go through `src/lib/db.ts` (PostgREST via `@supabase/supabase-js`, plus Realtime on the tracker). If the database is unreachable the app falls back to local mode.

## Deploy to Vercel
Import the repo in Vercel (framework auto-detected from `vercel.json`) and add the two `VITE_` env vars if using Supabase. The presentation QR points to `https://fazaa-app.vercel.app`; use that project name or regenerate the QR for your URL.

## Screenshot mode
Query params: `?lang=en|ar&tab=sos|tracker|plans&demo&mute&still`.
