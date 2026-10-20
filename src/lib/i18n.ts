export type Lang = 'ar' | 'en';

const dict = {
  brand: { ar: 'فزعة', en: "FAZA'A" },
  tagline: { ar: 'مساعدة على الطريق وسيارة بديلة', en: 'Road Assistance & Car Delivery' },
  tabSos: { ar: 'الطلب', en: 'SOS' },
  tabTracker: { ar: 'تتبع سيارتي', en: 'Tracker' },
  tabPlans: { ar: 'الباقات والمناطق', en: 'Plans' },
  sosTitle: { ar: 'سيارتك تعطلت؟ نحن قادمون', en: 'Car stopped? We are on the way' },
  sosSub: { ar: 'سيارة بديلة فورًا، ونحن نتكفل بسيارتك حتى تعود سليمة.', en: 'A replacement car on the spot. We take care of yours until it is fixed.' },
  requestNow: { ar: 'اطلب فزعة الآن', en: 'Request Fazaa Now' },
  sending: { ar: 'جارٍ الإرسال...', en: 'Sending...' },
  region: { ar: 'المنطقة', en: 'Region' },
  pickRegion: { ar: 'اختر منطقتك', en: 'Choose your region' },
  incident: { ar: 'نوع الحالة', en: 'Incident type' },
  breakdown: { ar: 'عطل', en: 'Breakdown' },
  breakdownSub: { ar: 'السيارة لا تعمل', en: 'Car will not run' },
  accident: { ar: 'حادث', en: 'Accident' },
  accidentSub: { ar: 'تصادم أو أضرار', en: 'Collision or damage' },
  carChoice: { ar: 'السيارة البديلة', en: 'Replacement car' },
  plate: { ar: 'رقم اللوحة', en: 'Plate number' },
  phone: { ar: 'رقم الجوال', en: 'Mobile number' },
  eta: { ar: 'وصول متوقع', en: 'Estimated arrival' },
  min: { ar: 'دقيقة', en: 'min' },
  seats: { ar: 'مقاعد', en: 'seats' },
  done: { ar: 'تم', en: 'Done' },
  sent: { ar: 'تم إرسال طلبك', en: 'Request sent' },
  trackerTitle: { ar: 'تتبع السيارة البديلة والورشة', en: 'Replacement & Workshop Tracker' },
  request: { ar: 'رقم الطلب', en: 'Request' },
  specialist: { ar: 'المختص الميداني', en: 'Field specialist' },
  workshop: { ar: 'الورشة', en: 'Workshop' },
  simulate: { ar: 'محاكاة الخطوة التالية', en: 'Simulate Next Step' },
  reset: { ar: 'إعادة التتبع', en: 'Restart tracking' },
  completed: { ar: 'اكتملت الخدمة — سيارتك جاهزة', en: 'Service complete — your car is ready' },
  inProgress: { ar: 'جارٍ الآن', en: 'In progress' },
  pending: { ar: 'بانتظار', en: 'Pending' },
  coverage: { ar: 'التغطية في 13 منطقة', en: 'Coverage — 13 regions' },
  regionsShort: { ar: 'منطقة', en: 'regions' },
  workshopOne: { ar: 'ورشة', en: 'workshop' },
  carsShort: { ar: 'سيارة', en: 'cars' },
  workshopsShort: { ar: 'ورشة', en: 'workshops' },
  tiers: { ar: 'باقات الخدمة', en: 'Service tiers' },
  costs: { ar: 'التكاليف التشغيلية التقديرية (شهريًا)', en: 'Estimated operational costs (monthly)' },
  total: { ar: 'الإجمالي', en: 'Total' },
  sar: { ar: 'ر.س', en: 'SAR' },
  assumed: { ar: 'أرقام تقديرية لأغراض أكاديمية', en: 'Assumed figures for academic purposes' },
  about: { ar: 'عن فزعة', en: "About FAZA'A" },
  team: { ar: 'فريق المشروع', en: 'Project team' },
  aboutBody: {
    ar: 'عند تعطل سيارتك أو تعرضها لحادث في أي منطقة بالمملكة، نرسل مختصًا ميدانيًا مع سيارة بديلة تكمل بها طريقك فورًا، ويبقى المختص مع سيارتك وينقلها إلى ورشنا المتخصصة الشريكة ونتابع الإصلاح حتى التسليم.',
    en: 'When your car breaks down or has an accident anywhere in the Kingdom, we send a field specialist with a replacement car so you continue right away. The specialist stays with your car, moves it to our specialized partner workshops, and we manage the repair through to handover.',
  },
  close: { ar: 'إغلاق', en: 'Close' },
  sound: { ar: 'الصوت', en: 'Sound' },
  live: { ar: 'متصل بقاعدة البيانات', en: 'Live database' },
  local: { ar: 'وضع محلي تفاعلي', en: 'Local live mode' },
} as const;

export type Key = keyof typeof dict;
export const t = (k: Key, lang: Lang): string => dict[k][lang];

export const STEPS: { ar: string; en: string }[] = [
  { ar: 'المختص والسيارة البديلة في الطريق', en: 'Specialist & Replacement Car En Route' },
  { ar: 'تسليم السيارة البديلة والمختص يحرس سيارتك', en: 'Replacement Car Handed Over & Specialist Guarding Your Car' },
  { ar: 'سحب السيارة إلى ورشة فزعة المتخصصة', en: "Towed to FAZA'A Specialized Workshop" },
  { ar: 'الإصلاح وفحص الجودة', en: 'Repair & Quality Inspection' },
  { ar: 'جاهزة للتسليم والإرجاع', en: 'Ready for Handover & Return' },
];

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
export const num = (n: number | string, lang: Lang): string => {
  const s = typeof n === 'number' ? n.toLocaleString('en-US') : n;
  return lang === 'ar' ? s.replace(/\d/g, (d) => AR_DIGITS[+d]).replace(/,/g, '٬') : s;
};

export const fmtTime = (iso: string, lang: Lang): string =>
  new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA-u-ca-gregory-nu-arab' : 'en-GB', {
    timeZone: 'Asia/Riyadh',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso));
