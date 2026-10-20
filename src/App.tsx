import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import {
  AlertTriangle, Car, CarFront, Check, ChevronDown, Clock, Database, Info, LifeBuoy, MapPin,
  Phone, Route, ShieldCheck, Siren, Truck, Volume2, VolumeX, Warehouse, Wrench, X, CreditCard,
  RotateCcw, ChevronsRight, Users, Building2, Hash,
} from 'lucide-react';
import seed from './seed.json';
import { db, type CarId, type Incident } from './lib/db';
import { STEPS, fmtTime, num, t, type Lang } from './lib/i18n';
import { setMuted, sfx } from './lib/audio';

type Tab = 'sos' | 'tracker' | 'plans';
const params = new URLSearchParams(location.search);
const regionById = (id: string) => seed.regions.find((r) => r.id === id) ?? seed.regions[0];
const carById = (id: string) => seed.cars.find((c) => c.id === id) ?? seed.cars[0];
const STEP_ICONS = [Truck, ShieldCheck, Warehouse, Wrench, CarFront];

export default function App() {
  const [lang, setLang] = useState<Lang>(params.get('lang') === 'en' ? 'en' : 'ar');
  const [tab, setTab] = useState<Tab>((params.get('tab') as Tab) || 'sos');
  const [muted, setMute] = useState(params.has('mute'));
  const [about, setAbout] = useState(false);
  const state = useSyncExternalStore(db.subscribe, db.get);

  useEffect(() => {
    void db.init();
    if (params.has('still')) document.body.style.background = 'transparent';
  }, []);
  useEffect(() => { setMuted(muted); }, [muted]);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const go = (k: Tab) => { sfx.click(); setTab(k); };
  const font = lang === 'ar' ? 'font-ar' : 'font-en';

  return (
    <div className={`backdrop ${params.has('still') ? 'no-motion' : ''}`}>
      <div className={`phone ${font} text-obsidian`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        {/* Top app bar */}
        <header className="sticky top-0 z-20 flex items-center gap-3 bg-obsidian px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))] text-white">
          <img src="/logo-shield.png" alt="FAZA'A" className="h-11 w-11 rounded-xl bg-white object-contain p-0.5" />
          <div className="min-w-0 flex-1 leading-tight">
            <div className="text-lg font-bold">{lang === 'ar' ? 'فزعة' : "FAZA'A"}</div>
            <div className="text-[10.5px] leading-snug text-silver/70">{t('tagline', lang)}</div>
          </div>
          <IconBtn label={t('sound', lang)} onClick={() => { setMute(!muted); if (muted) setTimeout(sfx.click, 0); }}>
            {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </IconBtn>
          <IconBtn label={t('about', lang)} onClick={() => { sfx.click(); setAbout(true); }}>
            <Info size={20} />
          </IconBtn>
          <button
            onClick={() => { sfx.click(); setLang(lang === 'ar' ? 'en' : 'ar'); }}
            className="h-11 min-w-[52px] rounded-xl bg-crimson px-3 text-sm font-bold active:scale-95"
            aria-label="Language"
          >
            {lang === 'ar' ? 'EN' : 'ع'}
          </button>
        </header>

        <main className="scroll bg-[#F7F7F8]">
          {tab === 'sos' && <SosTab lang={lang} onSent={() => setTab('tracker')} />}
          {tab === 'tracker' && <TrackerTab lang={lang} />}
          {tab === 'plans' && <PlansTab lang={lang} />}
          <div className="flex justify-center pb-4">
            <span className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[10px] text-obsidian/60 shadow-sm">
              <Database size={10} className={state.mode === 'live' ? 'text-emerald-600' : 'text-crimson'} />
              {t(state.mode === 'live' ? 'live' : 'local', lang)}
            </span>
          </div>
        </main>

        {/* Bottom navigation */}
        <nav className="z-20 grid grid-cols-3 border-t border-silver bg-white pb-[env(safe-area-inset-bottom)]">
          {([
            ['sos', Siren, t('tabSos', lang)],
            ['tracker', Route, t('tabTracker', lang)],
            ['plans', MapPin, t('tabPlans', lang)],
          ] as const).map(([k, Icon, label]) => (
            <button key={k} onClick={() => go(k)}
              className={`flex min-h-[64px] flex-col items-center justify-center gap-1 text-xs font-semibold ${tab === k ? 'text-crimson' : 'text-obsidian/55'}`}>
              <span className={`grid h-8 w-14 place-items-center rounded-full ${tab === k ? 'bg-crimson-soft' : ''}`}><Icon size={22} /></span>
              {label}
            </button>
          ))}
        </nav>

        {about && <AboutSheet lang={lang} onClose={() => setAbout(false)} />}
      </div>
    </div>
  );
}

function IconBtn({ children, label, onClick }: { children: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} aria-label={label} className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 active:scale-95">
      {children}
    </button>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-2 mt-5 px-1 text-sm font-bold text-obsidian/70">{children}</h2>;
}

/* ---------------- Tab 1: SOS ---------------- */
function SosTab({ lang, onSent }: { lang: Lang; onSent: () => void }) {
  const s = seed.sample_request;
  const [region, setRegion] = useState(s.region);
  const [incident, setIncident] = useState<Incident>(s.incident as Incident);
  const [car, setCar] = useState<CarId>(s.car as CarId);
  const [plate, setPlate] = useState(s.plate);
  const [phone, setPhone] = useState(s.phone);
  const [sheet, setSheet] = useState(false);
  const [busy, setBusy] = useState(false);
  const r = regionById(region);

  const submit = async () => {
    setBusy(true);
    sfx.sos();
    await db.createRequest({ region, incident, car, plate, phone });
    setTimeout(() => { setBusy(false); onSent(); }, 900);
  };

  return (
    <div className="px-4 pb-8 pt-5">
      <h1 className="text-2xl font-bold">{t('sosTitle', lang)}</h1>
      <p className="mt-1 text-sm text-obsidian/60">{t('sosSub', lang)}</p>

      <div className="my-6 grid place-items-center">
        <button onClick={submit} disabled={busy} className="relative h-48 w-48 rounded-full active:scale-95" aria-label={t('requestNow', lang)}>
          <span className="pulse-ring" />
          <span className="pulse-ring d2" />
          <span className="relative flex h-full w-full flex-col items-center justify-center gap-2 rounded-full bg-crimson text-white shadow-[0_14px_40px_rgba(158,27,32,.45)] ring-8 ring-white">
            <Siren size={44} strokeWidth={2.2} />
            <span className="px-4 text-center text-lg font-bold leading-tight">{busy ? t('sending', lang) : t('requestNow', lang)}</span>
          </span>
        </button>
        <div className="mt-4 flex items-center gap-2 text-sm text-obsidian/70">
          <Clock size={16} className="text-crimson" />
          {t('eta', lang)}: <b className="text-obsidian">{num(r.eta, lang)} {t('min', lang)}</b>
        </div>
      </div>

      <SectionTitle>{t('region', lang)}</SectionTitle>
      <button onClick={() => { sfx.click(); setSheet(true); }}
        className="flex min-h-[60px] w-full items-center gap-3 rounded-2xl border border-silver bg-white px-4 text-start shadow-sm active:scale-[.99]">
        <MapPin className="text-crimson" />
        <span className="flex-1">
          <span className="block text-base font-bold">{lang === 'ar' ? r.ar : r.en}</span>
          <span className="block text-xs text-obsidian/55">{lang === 'ar' ? r.hub_ar : r.hub_en} · {num(r.cars, lang)} {t('carsShort', lang)}</span>
        </span>
        <ChevronDown className="text-obsidian/40" />
      </button>

      <SectionTitle>{t('incident', lang)}</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        {([['breakdown', Wrench, 'breakdownSub'], ['accident', AlertTriangle, 'accidentSub']] as const).map(([k, Icon, sub]) => (
          <Choice key={k} active={incident === k} onClick={() => { sfx.click(); setIncident(k); }}>
            <Icon size={28} />
            <span className="text-base font-bold">{t(k, lang)}</span>
            <span className="text-[11px] opacity-70">{t(sub, lang)}</span>
          </Choice>
        ))}
      </div>

      <SectionTitle>{t('carChoice', lang)}</SectionTitle>
      <div className="grid grid-cols-3 gap-2">
        {seed.cars.map((c) => (
          <Choice key={c.id} active={car === c.id} onClick={() => { sfx.click(); setCar(c.id as CarId); }}>
            {c.id === 'suv' ? <Truck size={26} /> : c.id === 'sedan' ? <CarFront size={26} /> : <Car size={26} />}
            <span className="text-sm font-bold">{lang === 'ar' ? c.ar : c.en}</span>
            <span className="text-[10px] opacity-70">{num(c.seats, lang)} {t('seats', lang)}</span>
          </Choice>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Field icon={<Hash size={18} />} label={t('plate', lang)} value={plate} onChange={setPlate} />
        <Field icon={<Phone size={18} />} label={t('phone', lang)} value={phone} onChange={setPhone} type="tel" />
      </div>

      {sheet && (
        <Sheet title={t('pickRegion', lang)} lang={lang} onClose={() => setSheet(false)}>
          <div className="grid grid-cols-2 gap-2">
            {seed.regions.map((x) => (
              <button key={x.id} onClick={() => { sfx.click(); setRegion(x.id); setSheet(false); }}
                className={`flex min-h-[60px] items-center justify-between gap-2 rounded-xl border px-3 text-start text-sm font-semibold ${x.id === region ? 'border-crimson bg-crimson text-white' : 'border-silver bg-white'}`}>
                <span>{lang === 'ar' ? x.ar : x.en}</span>
                {x.id === region && <Check size={18} />}
              </button>
            ))}
          </div>
        </Sheet>
      )}
    </div>
  );
}

function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`flex min-h-[96px] flex-col items-center justify-center gap-1 rounded-2xl border-2 px-2 text-center transition active:scale-95 ${active ? 'border-crimson bg-crimson text-white shadow-[0_8px_20px_rgba(158,27,32,.3)]' : 'border-silver bg-white text-obsidian'}`}>
      {children}
    </button>
  );
}

function Field({ icon, label, value, onChange, type = 'text' }: { icon: React.ReactNode; label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block px-1 text-xs font-bold text-obsidian/60">{label}</span>
      <span className="flex min-h-[60px] items-center gap-2 rounded-2xl border border-silver bg-white px-3 focus-within:border-crimson">
        <span className="text-crimson">{icon}</span>
        <input dir="ltr" type={type} value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full min-w-0 bg-transparent text-base font-semibold outline-none" />
      </span>
    </label>
  );
}

function Sheet({ title, lang, onClose, children }: { title: string; lang: Lang; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end bg-black/50" onClick={onClose}>
      <div className="sheet max-h-[80%] overflow-y-auto rounded-t-3xl bg-[#F7F7F8] p-4 pb-8" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-silver" />
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} aria-label={t('close', lang)} className="grid h-11 w-11 place-items-center rounded-xl bg-white"><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------------- Tab 2: Tracker ---------------- */
function TrackerTab({ lang }: { lang: Lang }) {
  const { request: r } = useSyncExternalStore(db.subscribe, db.get);
  const region = regionById(r.region);
  const car = carById(r.car);
  const s = seed.sample_request;
  const doneAll = r.step > 5;

  const next = async () => { sfx.step(); await db.advance(); };

  return (
    <div className="px-4 pb-8 pt-5">
      <h1 className="text-xl font-bold">{t('trackerTitle', lang)}</h1>

      <div className="mt-4 rounded-2xl bg-obsidian p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] text-silver/60">{t('request', lang)}</div>
            <div dir="ltr" className="text-xl font-bold tracking-wide">{r.id}</div>
          </div>
          <span className="rounded-full bg-crimson px-3 py-1 text-xs font-bold">{t(r.incident, lang)}</span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
          <Info2 icon={<MapPin size={14} />} v={lang === 'ar' ? region.ar : region.en} />
          <Info2 icon={<CarFront size={14} />} v={lang === 'ar' ? car.ar : car.en} />
          <Info2 icon={<Hash size={14} />} v={r.plate} ltr />
        </div>
        <div className="mt-2 text-[11px] text-silver/70">
          {t('specialist', lang)}: <b className="text-white">{lang === 'ar' ? s.specialist_ar : s.specialist_en}</b> · {car.model}
        </div>
      </div>

      <ol className="mt-4">
        {STEPS.map((st, i) => {
          const n = i + 1;
          const done = r.step > n;
          const active = r.step === n;
          const Icon = STEP_ICONS[i];
          return (
            <li key={n} className="relative flex gap-3 pb-2 last:pb-0">
              {n < 5 && <span className={`absolute top-12 h-[calc(100%-44px)] w-1 rounded-full start-[22px] ${done ? 'bg-crimson' : 'bg-silver'}`} />}
              <span className={`relative grid h-12 w-12 shrink-0 place-items-center rounded-full border-2 ${done ? 'border-crimson bg-crimson text-white' : active ? 'border-crimson bg-white text-crimson shadow-[0_0_0_6px_rgba(158,27,32,.15)]' : 'border-silver bg-white text-obsidian/35'}`}>
                {done ? <Check size={22} strokeWidth={3} /> : <Icon size={22} />}
              </span>
              <div className={`flex-1 rounded-2xl border p-3 ${active ? 'border-crimson bg-white shadow-sm' : 'border-transparent'}`}>
                <div className={`text-[15px] font-bold leading-snug ${!done && !active ? 'text-obsidian/40' : ''}`}>
                  <span className="text-crimson">{num(n, lang)}. </span>{lang === 'ar' ? st.ar : st.en}
                </div>
                <div className="mt-1 flex items-center gap-1 text-xs text-obsidian/55">
                  <Clock size={12} />
                  {r.step_times[i] ? fmtTime(r.step_times[i]!, lang) : t('pending', lang)}
                  {active && <span className="ms-2 rounded-full bg-crimson-soft px-2 py-0.5 font-bold text-crimson">{t('inProgress', lang)}</span>}
                </div>
                {n === 3 && (done || active) && (
                  <div className="mt-1 text-[11px] text-obsidian/60">{lang === 'ar' ? s.workshop_ar : s.workshop_en}</div>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {doneAll ? (
        <div className="mt-5 flex min-h-[60px] items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 font-bold text-white">
          <ShieldCheck /> {t('completed', lang)}
        </div>
      ) : (
        <button onClick={next} className="mt-4 flex min-h-[60px] w-full items-center justify-center gap-2 rounded-2xl bg-crimson text-lg font-bold text-white shadow-lg active:scale-[.98]">
          <ChevronsRight className="rtl:rotate-180" /> {t('simulate', lang)}
        </button>
      )}
      <button onClick={() => { sfx.click(); void db.reset(); }} className="mt-3 flex min-h-[60px] w-full items-center justify-center gap-2 rounded-2xl border border-silver bg-white font-semibold text-obsidian/70 active:scale-[.98]">
        <RotateCcw size={18} /> {t('reset', lang)}
      </button>
    </div>
  );
}

function Info2({ icon, v, ltr }: { icon: React.ReactNode; v: string; ltr?: boolean }) {
  return (
    <div className="flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1.5">
      <span className="text-crimson-soft">{icon}</span>
      <span dir={ltr ? 'ltr' : undefined} className="truncate font-semibold">{v}</span>
    </div>
  );
}

/* ---------------- Tab 3: Plans ---------------- */
function PlansTab({ lang }: { lang: Lang }) {
  const [sel, setSel] = useState(params.get('region') ?? 'riyadh');
  const total = useMemo(() => seed.costs.reduce((a, c) => a + c.monthly, 0), []);
  const totalCars = seed.regions.reduce((a, r) => a + r.cars, 0);
  const totalWs = seed.regions.reduce((a, r) => a + r.workshops, 0);
  const costIcons = [Car, Users, Truck, Building2, Database];

  return (
    <div className="px-4 pb-8 pt-5">
      <h1 className="text-xl font-bold">{t('coverage', lang)}</h1>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        {[[seed.regions.length, t('regionsShort', lang)], [totalCars, t('carsShort', lang)], [totalWs, t('workshopsShort', lang)]].map(([v, l]) => (
          <div key={String(l)} className="rounded-2xl bg-obsidian py-3 text-white">
            <div className="text-2xl font-bold">{num(v as number, lang)}</div>
            <div className="text-[11px] text-silver/70">{l}</div>
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {seed.regions.map((r) => {
          const on = r.id === sel;
          return (
            <button key={r.id} onClick={() => { sfx.click(); setSel(r.id); }}
              className={`min-h-[60px] rounded-xl border px-3 py-2 text-start ${on ? 'border-crimson bg-crimson text-white' : 'border-silver bg-white'}`}>
              <div className="text-sm font-bold">{lang === 'ar' ? r.ar : r.en}</div>
              <div className={`text-[11px] ${on ? 'text-white/80' : 'text-obsidian/55'}`}>
                {num(r.cars, lang)} {t('carsShort', lang)} · {num(r.workshops, lang)} {t(r.workshops === 1 ? 'workshopOne' : 'workshopsShort', lang)} · {num(r.eta, lang)} {t('min', lang)}
              </div>
            </button>
          );
        })}
      </div>

      <SectionTitle>{t('tiers', lang)}</SectionTitle>
      <div className="space-y-2">
        {seed.tiers.map((tier, i) => (
          <div key={tier.id} className={`rounded-2xl border p-3 ${i === 1 ? 'border-crimson bg-white shadow-sm' : 'border-silver bg-white'}`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-bold"><CreditCard size={18} className="text-crimson" />{lang === 'ar' ? tier.ar : tier.en}</div>
              <div className="text-end"><span className="text-lg font-bold text-crimson">{num(tier.price, lang)}</span> <span className="text-[11px] text-obsidian/60">{lang === 'ar' ? tier.unit_ar : tier.unit_en}</span></div>
            </div>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-obsidian/65">
              {(lang === 'ar' ? tier.f_ar : tier.f_en).map((f) => <span key={f} className="flex items-center gap-1"><Check size={12} className="text-crimson" />{f}</span>)}
            </div>
          </div>
        ))}
      </div>

      <SectionTitle>{t('costs', lang)}</SectionTitle>
      <div className="overflow-hidden rounded-2xl border border-silver bg-white">
        {seed.costs.map((c, i) => {
          const Icon = costIcons[i];
          return (
            <div key={c.id} className="flex items-center gap-3 border-b border-silver px-3 py-2.5 last:border-0">
              <Icon size={18} className="shrink-0 text-crimson" />
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold">{lang === 'ar' ? c.ar : c.en}</div>
                <div className="text-[10px] text-obsidian/50">{lang === 'ar' ? c.basis_ar : c.basis_en}</div>
              </div>
              <div className="text-sm font-bold">{num(c.monthly, lang)}</div>
            </div>
          );
        })}
        <div className="flex items-center justify-between bg-obsidian px-3 py-3 text-white">
          <span className="font-bold">{t('total', lang)}</span>
          <span className="text-lg font-bold">{num(total, lang)} <span className="text-xs text-silver/70">{t('sar', lang)}</span></span>
        </div>
      </div>
      <p className="mt-2 px-1 text-[11px] text-obsidian/50">{t('assumed', lang)}</p>
    </div>
  );
}

/* ---------------- About sheet ---------------- */
function AboutSheet({ lang, onClose }: { lang: Lang; onClose: () => void }) {
  return (
    <Sheet title={t('about', lang)} lang={lang} onClose={onClose}>
      <div className="rounded-2xl bg-white p-3">
        <img src="/logo-full.png" alt="فزعة — FAZA'A Road Assistance & Car Delivery" className="mx-auto w-full max-w-[320px]" />
      </div>
      <p className="mt-3 text-sm leading-relaxed text-obsidian/75">{t('aboutBody', lang)}</p>
      <h4 className="mb-2 mt-4 flex items-center gap-2 text-sm font-bold"><LifeBuoy size={16} className="text-crimson" />{t('team', lang)}</h4>
      <div className="overflow-hidden rounded-2xl border border-silver bg-white font-en" dir="ltr">
        {seed.team.map((m) => (
          <div key={m.id} className="flex min-h-[48px] items-center justify-between border-b border-silver px-3 text-sm last:border-0">
            <span className="font-semibold">{m.name}</span>
            <span className="text-obsidian/60">{m.id}</span>
          </div>
        ))}
      </div>
    </Sheet>
  );
}
