/**
 * ترتيب مجلد dist بعد بناء Vite.
 *
 * المستودع يستضيف صفحتين مستقلّتين على نفس موقع GitHub Pages:
 *
 *   /              → موقع BREZZA  (الصفحة الرئيسية)
 *   /brezza/       → نفس موقع BREZZA (رابط بديل يبقى شغّالًا)
 *   /la-hint.html  → شاشة الملف الشخصي La Hint (تطبيق Vite)
 *
 * تطبيق La Hint مبنيّ بـ `base: './'` فأصوله مرتبطة بموقع ملف HTML نفسه.
 * لذلك يبقى ملفه في جذر dist (باسم la-hint.html) ولا يُنقل إلى مجلد فرعي —
 * نقله كان يكسر مسارات ./assets.
 *
 * وموقع BREZZA ملف واحد مكتفٍ ذاتيًا (CSS و JS و SVG بداخله)، فينسخ كما هو.
 */
import { copyFileSync, existsSync, renameSync } from 'node:fs';
import { resolve } from 'node:path';

const dist = resolve('dist');
const laHint = resolve(dist, 'index.html');
const brezza = resolve(dist, 'brezza/index.html');

if (!existsSync(laHint)) {
  throw new Error('dist/index.html غير موجود — هل نجح بناء Vite؟');
}
if (!existsSync(brezza)) {
  throw new Error('dist/brezza/index.html غير موجود — تحقّق من public/brezza/');
}

// La Hint: من الجذر إلى la-hint.html (يبقى في نفس المستوى فتظل ./assets صحيحة)
renameSync(laHint, resolve(dist, 'la-hint.html'));

// BREZZA: نسخة في الجذر، مع بقاء الأصل في /brezza/
copyFileSync(brezza, laHint);

console.log('تم ترتيب dist:  /  → BREZZA   |   /la-hint.html → La Hint');
