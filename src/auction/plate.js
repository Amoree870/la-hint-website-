/* ==========================================================================
   رسم اللوحة السعودية بالـ HTML/CSS (بدون صور)
   التخطيط الحقيقي: شريط جانبي أزرق يسارًا، ثم الأرقام، ثم الحروف يمينًا.
   في كل نصف: السطر العلوي عربي والسفلي لاتيني.
   ========================================================================== */

import { LETTER_MAP, toArabicDigits } from './data.js';

/** شعار المملكة المبسّط: سيفان ونخلة */
const EMBLEM = `
<svg class="plate-emblem" viewBox="0 0 24 26" aria-hidden="true">
  <path d="M3 18.5c3.4 1.9 14.6 1.9 18 0" fill="none" stroke="currentColor"
        stroke-width="1.5" stroke-linecap="round"/>
  <path d="M2.6 17.2c3.3 2 15.5 2 18.8 0" fill="none" stroke="currentColor"
        stroke-width="1.1" stroke-linecap="round" opacity=".7"/>
  <path d="M12 16V8.6" fill="none" stroke="currentColor" stroke-width="1.4"
        stroke-linecap="round"/>
  <path d="M12 9.2C10.6 6.9 8.4 5.6 5.7 5.2 7.5 7 9 8.2 12 9.2Z" fill="currentColor"/>
  <path d="M12 9.2c1.4-2.3 3.6-3.6 6.3-4-1.8 1.8-3.3 3-6.3 4Z" fill="currentColor"/>
  <path d="M12 8.1C11.2 6 9.9 4.5 8 3.4c.9 2.3 1.8 3.7 4 4.7Z" fill="currentColor"/>
  <path d="M12 8.1c.8-2.1 2.1-3.6 4-4.7-.9 2.3-1.8 3.7-4 4.7Z" fill="currentColor"/>
  <path d="M12 7.4c-.3-2 0-3.7 1-5.4 1 1.7 1.3 3.4 1 5.4Z" fill="currentColor"
        transform="translate(-1 0)"/>
</svg>`;

/**
 * ينشئ عنصر اللوحة.
 * @param {{ar:string[], num:string}} plate
 * @param {'sm'|'md'|'lg'} size
 */
export function renderPlate(plate, size = 'md') {
  const latin = plate.ar.map((ch) => LETTER_MAP[ch] || ch);

  const el = document.createElement('div');
  el.className = `plate plate--${size}`;
  el.setAttribute('role', 'img');
  el.setAttribute(
    'aria-label',
    `لوحة ${plate.ar.join(' ')} ${toArabicDigits(plate.num)}`
  );

  el.innerHTML = `
    <div class="plate-band">
      ${EMBLEM}
      <span class="plate-band-ksa">KSA</span>
      <span class="plate-band-ar">السعودية</span>
    </div>

    <div class="plate-field">
      <div class="plate-cell plate-cell--num">
        <span class="plate-ar">${toArabicDigits(plate.num)}</span>
        <span class="plate-en">${plate.num}</span>
      </div>

      <span class="plate-divider" aria-hidden="true"></span>

      <div class="plate-cell plate-cell--ltr">
        <span class="plate-ar" dir="rtl">${plate.ar.join(' ')}</span>
        <span class="plate-en">${latin.join(' ')}</span>
      </div>
    </div>

    <span class="plate-shine" aria-hidden="true"></span>
  `;

  return el;
}
