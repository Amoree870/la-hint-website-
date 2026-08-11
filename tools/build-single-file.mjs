/* ==========================================================================
   يبني نسخة من صفحة المزاد في ملف HTML واحد مكتفٍ بذاته:
   يدمج الأنماط والسكربت ويحوّل الخطوط إلى data: URI، فيصلح للفتح مباشرة
   من الجوال أو للنشر على أي مستضيف ثابت.

   الاستخدام: npm run build && node tools/build-single-file.mjs
   ========================================================================== */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const out = process.argv[2] || join(dist, 'auction-single.html');

if (!existsSync(join(dist, 'auction.html'))) {
  console.error('لم يُعثر على dist/auction.html — شغّل npm run build أولًا.');
  process.exit(1);
}

const html = readFileSync(join(dist, 'auction.html'), 'utf8');

// قد يقسم Vite الأنماط إلى أكثر من ملف (أجزاء مشتركة مع الصفحة الأخرى)
const cssHrefs = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)].map(
  (m) => m[1]
);
const jsSrc = html.match(/<script[^>]+type="module"[^>]+src="([^"]+)"/)?.[1];

if (!cssHrefs.length || !jsSrc) {
  console.error('تعذّر العثور على وسمي الأنماط والسكربت في dist/auction.html');
  process.exit(1);
}

const assetPath = (href) => join(dist, href.replace(/^\.?\//, ''));

let css = cssHrefs.map((href) => readFileSync(assetPath(href), 'utf8')).join('\n');

// الجزء المستورد ليس إلا مُهيّئ modulepreload، ولا لزوم له بعد الدمج
const js = readFileSync(assetPath(jsSrc), 'utf8').replace(
  /^\s*import\s*["'][^"']+["']\s*;?/gm,
  ''
);

/* ------- إسقاط صيغة woff (يكفي woff2) ثم تضمين الخطوط كـ data: URI ------- */

css = css.replace(/,?\s*url\([^)]+\.woff\)\s*format\("woff"\)/g, '');

const fontDir = dirname(assetPath(cssHrefs[0]));
let embedded = 0;

css = css.replace(/url\(([^)]+\.woff2)\)/g, (match, url) => {
  const file = join(fontDir, url.replace(/^\.?\//, '').replace(/['"]/g, ''));
  if (!existsSync(file)) return match;
  embedded += 1;
  return `url(data:font/woff2;base64,${readFileSync(file).toString('base64')})`;
});

/* --------- الصفحة تُغلَّف في <div> فلا نملك <body>: نقل المحددات --------- */

css = css
  .replace(/body\.auction-page/g, '.auction-page')
  .concat(
    '\nbody{margin:0;background:var(--bg);}\n' +
      '.auction-page{min-height:100vh;background-attachment:scroll;}\n'
  );

const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/)?.[1] ?? '';
const content = body
  .replace(/<script[\s\S]*?<\/script>/g, '')
  .replace(/<link[^>]*>/g, '')
  .trim();

const page = `<title>مزاد اللوحات — لوحات سيارات مميزة</title>
<style>
${css}
</style>

<div class="auction-page" dir="rtl" lang="ar">
${content}
</div>

<script type="module">
${js}
</script>
`;

writeFileSync(out, page, 'utf8');

const kb = (Buffer.byteLength(page) / 1024).toFixed(0);
console.log(`تم إنشاء ${out} — ${kb}KB، خطوط مضمّنة: ${embedded}`);
