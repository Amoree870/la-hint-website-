/* ==========================================================================
   بيانات مزاد اللوحات — لوحات سيارات مميزة (بيانات تجريبية للعرض فقط)
   ========================================================================== */

/** خريطة الحروف العربية المعتمدة على اللوحات السعودية ومقابلها اللاتيني */
export const LETTER_MAP = {
  أ: 'A',
  ب: 'B',
  ح: 'J',
  د: 'D',
  ر: 'R',
  س: 'S',
  ص: 'X',
  ط: 'T',
  ع: 'E',
  ق: 'G',
  ك: 'K',
  ل: 'L',
  م: 'Z',
  ن: 'N',
  ه: 'H',
  و: 'U',
  ى: 'V',
};

/** تحويل رقم إلى أرقام عربية هندية مع فاصل الآلاف */
const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';

export const toArabicDigits = (value) =>
  String(value).replace(/\d/g, (d) => AR_DIGITS[Number(d)]);

export const toLatinDigits = (value) =>
  String(value).replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)));

/** تنسيق مبلغ: ١٢٤٬٥٠٠ */
export const formatMoney = (value) =>
  toArabicDigits(Math.round(value).toLocaleString('en-US')).replace(/,/g, '٬');

/** تصنيف اللوحة حسب عدد الخانات */
export const classOf = (num) =>
  ({ 1: 'أحادية', 2: 'ثنائية', 3: 'ثلاثية', 4: 'رباعية', 5: 'خماسية' })[
    String(num).length
  ] || 'رباعية';

/** هل الرقم «مميز»؟ (متكرر أو متناظر أو أصفار) */
export const isFancy = (num) => {
  const s = String(num);
  const same = /^(\d)\1+$/.test(s);
  const mirror = s.length > 2 && s === [...s].reverse().join('');
  const zeros = /^[1-9]0+$/.test(s);
  const pair = s.length === 4 && s.slice(0, 2) === s.slice(2);
  return same || mirror || zeros || pair;
};

const m = (minutes) => Date.now() + minutes * 60_000;

/**
 * قائمة اللوحات المعروضة في المزاد.
 * ar: الحروف بالترتيب المنطقي (تُقرأ من اليمين على اللوحة)
 */
export const PLATES = [
  { id: 'p01', ar: ['أ', 'أ', 'أ'], num: '1',    price: 2_450_000, bids: 63, ends: m(41),      type: 'خصوصي' },
  { id: 'p02', ar: ['أ', 'ل', 'ى'], num: '3',    price: 1_180_000, bids: 47, ends: m(9),       type: 'خصوصي' },
  { id: 'p03', ar: ['ط', 'ه', 'م'], num: '8',    price: 735_000,   bids: 38, ends: m(3),       type: 'خصوصي' },
  { id: 'p04', ar: ['أ', 'ب', 'ح'], num: '55',   price: 615_000,   bids: 52, ends: m(28),      type: 'خصوصي' },
  { id: 'p05', ar: ['ر', 'س', 'ص'], num: '40',   price: 388_000,   bids: 31, ends: m(120),     type: 'نقل خاص' },
  { id: 'p06', ar: ['ك', 'ك', 'ك'], num: '11',   price: 895_000,   bids: 44, ends: m(17),      type: 'خصوصي' },
  { id: 'p07', ar: ['ح', 'م', 'د'], num: '100',  price: 342_000,   bids: 29, ends: m(76),      type: 'خصوصي' },
  { id: 'p08', ar: ['م', 'م', 'م'], num: '707',  price: 424_000,   bids: 36, ends: m(52),      type: 'خصوصي' },
  { id: 'p09', ar: ['س', 'ع', 'د'], num: '999',  price: 158_000,   bids: 27, ends: m(6),       type: 'خصوصي' },
  { id: 'p10', ar: ['ب', 'ح', 'د'], num: '202',  price: 146_000,   bids: 22, ends: m(190),     type: 'دراجة' },
  { id: 'p11', ar: ['د', 'ر', 'س'], num: '500',  price: 129_000,   bids: 19, ends: m(240),     type: 'خصوصي' },
  { id: 'p12', ar: ['س', 'ص', 'ط'], num: '250',  price: 118_000,   bids: 16, ends: m(310),     type: 'نقل خاص' },
  { id: 'p13', ar: ['ر', 'ر', 'ر'], num: '1000', price: 312_000,   bids: 33, ends: m(64),      type: 'خصوصي' },
  { id: 'p14', ar: ['ب', 'ب', 'ب'], num: '5555', price: 268_000,   bids: 41, ends: m(35),      type: 'خصوصي' },
  { id: 'p15', ar: ['ع', 'ق', 'ك'], num: '7777', price: 212_000,   bids: 25, ends: m(88),      type: 'خصوصي' },
  { id: 'p16', ar: ['ن', 'ن', 'ن'], num: '4004', price: 183_000,   bids: 21, ends: m(145),     type: 'خصوصي' },
  { id: 'p17', ar: ['ه', 'و', 'ى'], num: '9009', price: 89_000,    bids: 14, ends: m(420),     type: 'نقل خاص' },
  { id: 'p18', ar: ['ل', 'م', 'ن'], num: '1234', price: 97_500,    bids: 18, ends: m(1_600),   type: 'خصوصي' },
  { id: 'p19', ar: ['ك', 'ل', 'م'], num: '6006', price: 76_000,    bids: 12, ends: m(2_100),   type: 'دراجة' },
  { id: 'p20', ar: ['ص', 'ق', 'ك'], num: '3003', price: 72_500,    bids: 11, ends: m(2_880),   type: 'خصوصي' },
  { id: 'p21', ar: ['م', 'ن', 'ه'], num: '1212', price: 64_000,    bids: 9,  ends: m(3_300),   type: 'خصوصي' },
  { id: 'p22', ar: ['ط', 'ع', 'ق'], num: '1441', price: 92_000,    bids: 15, ends: m(1_020),   type: 'خصوصي' },
  { id: 'p23', ar: ['ن', 'ه', 'و'], num: '8080', price: 81_000,    bids: 13, ends: m(4_320),   type: 'نقل خاص' },
  { id: 'p24', ar: ['و', 'ى', 'د'], num: '2020', price: 58_000,    bids: 8,  ends: m(5_760),   type: 'خصوصي' },
];

/** أسماء المزايدين في البث المباشر */
export const BIDDERS = [
  'مزايد ٤٢٩١',
  'مزايد ١١٧٠',
  'مزايد ٨٣٣٤',
  'مزايد ٦٥٠٢',
  'مزايد ٢٧٤٨',
  'مزايد ٩٠١٦',
  'مزايد ٣٥٥٢',
  'مزايد ٧٢٢٩',
];

/** خطوة المزايدة حسب السعر الحالي */
export const stepOf = (price) => {
  if (price < 100_000) return 1_000;
  if (price < 500_000) return 5_000;
  if (price < 1_000_000) return 10_000;
  return 25_000;
};
