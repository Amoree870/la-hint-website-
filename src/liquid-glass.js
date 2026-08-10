/**
 * Liquid Glass — انكسار زجاجي حقيقي على الخلفية.
 *
 * لكل عنصر يحمل [data-liquid] نُولّد خريطة إزاحة (displacement map) على
 * <canvas> اعتمادًا على أبعاد العنصر ونصف قطر حوافه، باستخدام دالة المسافة
 * الموقّعة (SDF) لمستطيل مُدوّر الأركان: كل بكسل يُخزّن متجه الانكسار في
 * القناتين R و G، ثم يُمرَّر عبر <feDisplacementMap> ويُطبَّق كـ backdrop-filter.
 *
 * إن لم يدعم المتصفح مرشحات SVG داخل backdrop-filter نُبقي التمويه العادي
 * المعرّف في CSS (fallback).
 */

const NS = 'http://www.w3.org/2000/svg';
const XLINK = 'http://www.w3.org/1999/xlink';

const DEFAULTS = {
  /** سماكة شريط الانكسار عند الحافة (بكسل) */
  edge: 14,
  /** حِدّة تركّز الانكسار عند الحافة */
  falloff: 2.3,
  /** أقصى إزاحة بالبكسل */
  scale: 22,
  /** تمويه إضافي فوق الانكسار */
  blur: 0.3,
  /** تشبّع اللون خلف الزجاج */
  saturate: 1.3,
};

let uid = 0;
let defsHost = null;

/* -------------------------------------------------------------------------- */

function supportsBackdropFilterUrl() {
  if (typeof CSS === 'undefined' || !CSS.supports) return false;

  const ok =
    CSS.supports('backdrop-filter', 'url(#liquid-probe)') ||
    CSS.supports('-webkit-backdrop-filter', 'url(#liquid-probe)');

  if (!ok) return false;

  // فايرفوكس وسفاري يقبلان الخاصية لكنهما لا يطبّقان مرشح SVG على الخلفية.
  const ua = navigator.userAgent;
  const isFirefox = /Firefox\//.test(ua);
  const isSafari = /Safari\//.test(ua) && !/Chrome|Chromium|Edg\//.test(ua);

  return !isFirefox && !isSafari;
}

function svgHost() {
  if (defsHost) return defsHost;

  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.style.cssText =
    'position:fixed;top:0;left:0;width:0;height:0;pointer-events:none;opacity:0';
  document.body.appendChild(svg);

  defsHost = svg;
  return svg;
}

/* ------------------------------- الهندسة -------------------------------- */

/** دالة المسافة الموقّعة لمستطيل مُدوّر (سالبة داخل الشكل) */
function sdRoundRect(px, py, halfW, halfH, r) {
  const qx = Math.abs(px) - (halfW - r);
  const qy = Math.abs(py) - (halfH - r);
  const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0));
  return outside + Math.min(Math.max(qx, qy), 0) - r;
}

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * يبني خريطة الإزاحة ويعيدها كـ data URL.
 * القناة R = الإزاحة الأفقية، G = الرأسية (0.5 = بلا إزاحة).
 */
function buildDisplacementMap(width, height, radius, opts) {
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  const halfW = w / 2;
  const halfH = h / 2;
  const r = Math.max(0, Math.min(radius, Math.min(halfW, halfH)));
  const edge = Math.max(1, Math.min(opts.edge, Math.min(halfW, halfH)));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const image = ctx.createImageData(w, h);
  const data = image.data;

  const EPS = 1;

  for (let y = 0; y < h; y++) {
    const py = y + 0.5 - halfH;

    for (let x = 0; x < w; x++) {
      const px = x + 0.5 - halfW;
      const i = (y * w + x) * 4;

      const d = sdRoundRect(px, py, halfW, halfH, r);

      let dx = 0;
      let dy = 0;

      if (d < 0) {
        // تدرّج المسافة = العمود العمودي على الحافة
        const gx =
          sdRoundRect(px + EPS, py, halfW, halfH, r) -
          sdRoundRect(px - EPS, py, halfW, halfH, r);
        const gy =
          sdRoundRect(px, py + EPS, halfW, halfH, r) -
          sdRoundRect(px, py - EPS, halfW, halfH, r);
        const len = Math.hypot(gx, gy) || 1;

        // 1 عند الحافة تمامًا، 0 عند العمق edge
        const t = clamp01(1 + d / edge);
        const amount = Math.pow(t, opts.falloff);

        // الانكسار يسحب العيّنة نحو الداخل فتتكوّن عدسة عند الأطراف
        dx = (-gx / len) * amount;
        dy = (-gy / len) * amount;
      }

      data[i] = Math.round(clamp01(0.5 + dx * 0.5) * 255);
      data[i + 1] = Math.round(clamp01(0.5 + dy * 0.5) * 255);
      data[i + 2] = 128;
      data[i + 3] = 255;
    }
  }

  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL('image/png');
}

/* -------------------------------- المرشّح -------------------------------- */

function createFilter(id, href, w, h, scale) {
  const filter = document.createElementNS(NS, 'filter');
  filter.setAttribute('id', id);
  filter.setAttribute('filterUnits', 'objectBoundingBox');
  filter.setAttribute('primitiveUnits', 'userSpaceOnUse');
  filter.setAttribute('x', '0');
  filter.setAttribute('y', '0');
  filter.setAttribute('width', '100%');
  filter.setAttribute('height', '100%');
  filter.setAttribute('color-interpolation-filters', 'sRGB');

  const feImage = document.createElementNS(NS, 'feImage');
  feImage.setAttribute('x', '0');
  feImage.setAttribute('y', '0');
  feImage.setAttribute('width', String(w));
  feImage.setAttribute('height', String(h));
  feImage.setAttribute('preserveAspectRatio', 'none');
  feImage.setAttribute('result', 'map');
  feImage.setAttribute('href', href);
  feImage.setAttributeNS(XLINK, 'xlink:href', href);

  const feDisp = document.createElementNS(NS, 'feDisplacementMap');
  feDisp.setAttribute('in', 'SourceGraphic');
  feDisp.setAttribute('in2', 'map');
  feDisp.setAttribute('scale', String(scale));
  feDisp.setAttribute('xChannelSelector', 'R');
  feDisp.setAttribute('yChannelSelector', 'G');

  filter.append(feImage, feDisp);
  return filter;
}

function readRadius(el, rect) {
  const raw = getComputedStyle(el).borderTopLeftRadius || '0';
  const value = parseFloat(raw);

  if (Number.isNaN(value)) return 0;
  if (raw.includes('%')) return (value / 100) * Math.min(rect.width, rect.height);

  return value;
}

/* --------------------------------- التطبيق -------------------------------- */

function applyTo(el, options) {
  const opts = { ...DEFAULTS, ...options };
  const id = `liquid-${++uid}`;
  const host = svgHost();

  let filterEl = null;
  let lastKey = '';

  const render = () => {
    const rect = el.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return;

    const w = Math.round(rect.width);
    const h = Math.round(rect.height);
    const radius = readRadius(el, rect);
    const key = `${w}x${h}x${Math.round(radius)}`;

    if (key === lastKey) return;
    lastKey = key;

    const href = buildDisplacementMap(w, h, radius, opts);
    const next = createFilter(id, href, w, h, opts.scale);

    if (filterEl) filterEl.replaceWith(next);
    else host.appendChild(next);

    filterEl = next;

    const value = `url(#${id}) blur(${opts.blur}px) saturate(${opts.saturate})`;
    el.style.backdropFilter = value;
    el.style.webkitBackdropFilter = value;
  };

  render();

  if (typeof ResizeObserver !== 'undefined') {
    let frame = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(render);
    });
    ro.observe(el);
  }
}

/**
 * يفعّل تأثير الزجاج السائل على كل العناصر المطابقة.
 * @param {string} selector
 * @param {Partial<typeof DEFAULTS>} [options]
 * @returns {boolean} هل طُبّق التأثير أم اكتُفي بالبديل؟
 */
export function initLiquidGlass(selector = '[data-liquid]', options = {}) {
  const elements = Array.from(document.querySelectorAll(selector));
  if (!elements.length) return false;

  if (!supportsBackdropFilterUrl()) {
    document.documentElement.classList.add('no-liquid-glass');
    return false;
  }

  document.documentElement.classList.add('has-liquid-glass');
  elements.forEach((el) => {
    const scale = el.dataset.liquidScale
      ? Number(el.dataset.liquidScale)
      : undefined;

    applyTo(el, scale ? { ...options, scale } : options);
  });

  return true;
}
