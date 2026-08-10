/**
 * مولّد أصول سعف النخيل — الهوية البصرية مستوحاة من نخيل القصيم.
 *
 * ينتج:
 *   public/assets/images/palm-frond-left.svg
 *   public/assets/images/palm-frond-right.svg
 *   public/assets/images/palm-pattern.svg
 *
 * التشغيل:  node tools/generate-palm-assets.mjs
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../public/assets/images'
);

const W = 62;
const H = 124;

/** منحنى تربيعي: جذع السعفة (العسيب) */
const P0 = { x: 47, y: 119 };
const P1 = { x: 41, y: 58 };
const P2 = { x: 17, y: 5 };

const at = (t) => ({
  x: (1 - t) ** 2 * P0.x + 2 * (1 - t) * t * P1.x + t ** 2 * P2.x,
  y: (1 - t) ** 2 * P0.y + 2 * (1 - t) * t * P1.y + t ** 2 * P2.y,
});

const tangentAt = (t) => {
  const x = 2 * (1 - t) * (P1.x - P0.x) + 2 * t * (P2.x - P1.x);
  const y = 2 * (1 - t) * (P1.y - P0.y) + 2 * t * (P2.y - P1.y);
  const m = Math.hypot(x, y) || 1;
  return { x: x / m, y: y / m };
};

const n = (v) => Math.round(v * 100) / 100;

/**
 * وريقة واحدة (خوصة): شكل عدسي رفيع ينطلق من العسيب إلى الخارج.
 * side = +1 يمين العسيب، -1 يساره.
 */
function leaflet(t, side, maxLen) {
  const p = at(t);
  const tg = tangentAt(t);
  const nx = -tg.y * side;
  const ny = tg.x * side;

  // أقصر عند القاعدة والقمة، أطول في الوسط
  const len = maxLen * (0.34 + 0.66 * Math.sin(Math.PI * t) ** 0.75);
  const sweep = 0.55 + 0.25 * t; // ميل الوريقة نحو رأس السعفة

  const tipX = p.x + nx * len + tg.x * len * sweep;
  const tipY = p.y + ny * len + tg.y * len * sweep;

  const belly = 0.5 + 0.18 * side;
  const c1x = p.x + nx * len * 0.45 + tg.x * len * (sweep * belly);
  const c1y = p.y + ny * len * 0.45 + tg.y * len * (sweep * belly);
  const c2x = p.x + nx * len * 0.62 + tg.x * len * (sweep * 0.15);
  const c2y = p.y + ny * len * 0.62 + tg.y * len * (sweep * 0.15);

  return (
    `M${n(p.x)} ${n(p.y)} ` +
    `Q${n(c1x)} ${n(c1y)} ${n(tipX)} ${n(tipY)} ` +
    `Q${n(c2x)} ${n(c2y)} ${n(p.x)} ${n(p.y)}Z`
  );
}

function frondSvg({ mirrored }) {
  const leaflets = [];
  const COUNT = 21;

  for (let i = 0; i < COUNT; i++) {
    const t = 0.05 + (i / (COUNT - 1)) * 0.88;
    leaflets.push(leaflet(t, 1, 16.5));
    leaflets.push(leaflet(t, -1, 14));
  }

  // رأس السعفة
  const tip = at(0.995);
  const preTip = at(0.9);

  const body = [
    `<path d="M${n(P0.x)} ${n(P0.y)} Q${n(P1.x)} ${n(P1.y)} ${n(P2.x)} ${n(P2.y)}"`,
    ` fill="none" stroke="url(#stem)" stroke-width="1.5" stroke-linecap="round"/>`,
    `\n    <path d="M${n(preTip.x)} ${n(preTip.y)} L${n(tip.x)} ${n(tip.y)}"`,
    ` fill="none" stroke="url(#stem)" stroke-width="1.1" stroke-linecap="round"/>`,
    leaflets
      .map((d) => `\n    <path d="${d}" fill="url(#leaf)"/>`)
      .join(''),
  ].join('');

  const transform = mirrored ? ` transform="translate(${W} 0) scale(-1 1)"` : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="presentation">
  <defs>
    <linearGradient id="leaf" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0" stop-color="#8a6a34"/>
      <stop offset="0.45" stop-color="#d9b874"/>
      <stop offset="1" stop-color="#f3e0b8"/>
    </linearGradient>
    <linearGradient id="stem" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="#7a5a2c"/>
      <stop offset="1" stop-color="#e8d3a6"/>
    </linearGradient>
  </defs>
  <g${transform}>
    ${body}
  </g>
</svg>
`;
}

/** نقشة خلفية: ظلال نخيل خفيفة جدًا خلف الجهاز */
function patternSvg() {
  const palm = (cx, cy, s, rot, op) => {
    const fronds = [];
    for (let i = 0; i < 9; i++) {
      const a = -170 + (i / 8) * 160;
      const rad = (a * Math.PI) / 180;
      const len = 30 + (i % 2 ? 5 : 0);
      const ex = Math.cos(rad) * len;
      const ey = Math.sin(rad) * len * 0.85;
      fronds.push(
        `<path d="M0 0 Q${n(ex * 0.55)} ${n(ey * 0.55 - 9)} ${n(ex)} ${n(ey + 6)}" fill="none" stroke="#e7c98a" stroke-width="2.4" stroke-linecap="round"/>`
      );
    }
    return `<g transform="translate(${cx} ${cy}) rotate(${rot}) scale(${s})" opacity="${op}">
      <path d="M0 0 C3 26 4 48 2 74" fill="none" stroke="#e7c98a" stroke-width="3" stroke-linecap="round"/>
      ${fronds.join('\n      ')}
    </g>`;
  };

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="320" height="320">
  <g fill="none">
    ${palm(60, 70, 1, 0, 0.5)}
    ${palm(230, 150, 0.78, 6, 0.36)}
    ${palm(140, 235, 0.62, -5, 0.3)}
  </g>
</svg>
`;
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(resolve(OUT_DIR, 'palm-frond-left.svg'), frondSvg({ mirrored: false }));
writeFileSync(resolve(OUT_DIR, 'palm-frond-right.svg'), frondSvg({ mirrored: true }));
writeFileSync(resolve(OUT_DIR, 'palm-pattern.svg'), patternSvg());

console.log('✓ تم توليد أصول النخيل في', OUT_DIR);
