/* ==========================================================================
   مزاد اللوحات — المنطق التفاعلي
   مزايدة لحظية، عدّاد تنازلي، مزايدون آليون، مفضلة محفوظة محليًا.
   ========================================================================== */

import '@fontsource/ibm-plex-sans-arabic/arabic-300.css';
import '@fontsource/ibm-plex-sans-arabic/arabic-400.css';
import '@fontsource/ibm-plex-sans-arabic/arabic-500.css';
import '@fontsource/ibm-plex-sans-arabic/arabic-600.css';
import '@fontsource/ibm-plex-sans-arabic/arabic-700.css';
import '@fontsource/ibm-plex-sans-arabic/latin-500.css';
import '@fontsource/ibm-plex-sans-arabic/latin-600.css';

import './style.css';
import { renderPlate } from './plate.js';
import {
  PLATES,
  BIDDERS,
  LETTER_MAP,
  stepOf,
  classOf,
  isFancy,
  formatMoney,
  toArabicDigits,
  toLatinDigits,
} from './data.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ----------------------------- حالة التطبيق ----------------------------- */

const WATCH_KEY = 'plates.watchlist';
const THEME_KEY = 'plates.theme';

const state = {
  plates: PLATES.map((p) => ({
    ...p,
    cls: classOf(p.num),
    fancy: isFancy(p.num),
    latin: p.ar.map((c) => LETTER_MAP[c] || c).join(''),
    leader: BIDDERS[Math.floor(Math.random() * BIDDERS.length)],
    mine: false,
    history: [],
  })),
  query: '',
  filter: 'all',
  sort: 'ending',
  watch: new Set(JSON.parse(localStorage.getItem(WATCH_KEY) || '[]')),
  wallet: 5_000_000,
};

const byId = new Map(state.plates.map((p) => [p.id, p]));
const cardOf = new Map(); // id -> عنصر البطاقة

/* ------------------------------- المظهر ------------------------------- */

const savedTheme = localStorage.getItem(THEME_KEY);
if (savedTheme) document.documentElement.dataset.theme = savedTheme;

$('#themeBtn').addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  document.documentElement.dataset.theme = next;
  localStorage.setItem(THEME_KEY, next);
});

/* ------------------------------ أدوات وقت ------------------------------ */

const remaining = (plate) => Math.max(0, plate.ends - Date.now());

function formatLeft(ms) {
  if (ms <= 0) return 'انتهى المزاد';
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const mi = Math.floor((s % 3600) / 60);
  const se = s % 60;
  const pad = (n) => toArabicDigits(String(n).padStart(2, '0'));

  if (d > 0) return `${toArabicDigits(d)} يوم و ${toArabicDigits(h)} ساعة`;
  return `${pad(h)}:${pad(mi)}:${pad(se)}`;
}

const urgency = (ms) => (ms <= 0 ? 'over' : ms < 5 * 60_000 ? 'hot' : ms < 60 * 60_000 ? 'soon' : '');

/* ------------------------------ البطاقات ------------------------------ */

function buildCard(plate) {
  const el = document.createElement('article');
  el.className = 'card';
  el.dataset.id = plate.id;

  el.innerHTML = `
    <div class="card-top">
      <span class="tag">${plate.cls}${plate.fancy ? ' · مميزة' : ''}</span>
      <span class="mine-badge">أنت الأعلى</span>
      <button class="watch" type="button" aria-label="إضافة إلى المفضلة" aria-pressed="false">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path d="M12 20.2 4.6 13a4.6 4.6 0 0 1 6.5-6.5l.9.9.9-.9A4.6 4.6 0 1 1 19.4 13Z"
                fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>

    <div class="card-plate"></div>

    <div class="card-rows">
      <div class="row">
        <span class="k">أعلى مزايدة</span>
        <strong class="price">٠ <small>ريال</small></strong>
      </div>
      <div class="row">
        <span class="k">المزايدات</span>
        <span class="bids">٠</span>
      </div>
      <div class="row">
        <span class="k">المتبقي</span>
        <span class="time" dir="ltr">--:--:--</span>
      </div>
    </div>

    <div class="card-foot">
      <span class="lead-badge">المتصدر: <b class="leader">—</b></span>
      <button class="btn btn-primary btn-sm bid" type="button">زايد</button>
    </div>

    <span class="card-glow" aria-hidden="true"></span>
  `;

  $('.card-plate', el).append(renderPlate(plate, 'md'));

  $('.bid', el).addEventListener('click', () => openModal(plate.id));
  $('.card-plate', el).addEventListener('click', () => openModal(plate.id));
  $('.watch', el).addEventListener('click', (e) => {
    e.stopPropagation();
    toggleWatch(plate.id);
  });

  cardOf.set(plate.id, el);
  paintCard(plate);
  return el;
}

/** تحديث القيم المتغيّرة داخل البطاقة */
function paintCard(plate, flash = false) {
  const el = cardOf.get(plate.id);
  if (!el) return;

  const ms = remaining(plate);
  const price = $('.price', el);

  price.innerHTML = `${formatMoney(plate.price)} <small>ريال</small>`;
  $('.bids', el).textContent = toArabicDigits(plate.bids);
  $('.time', el).textContent = formatLeft(ms);
  $('.leader', el).textContent = plate.mine ? 'أنت' : plate.leader;

  el.dataset.state = urgency(ms);
  el.classList.toggle('is-mine', plate.mine);
  el.classList.toggle('is-over', ms <= 0);

  const watched = state.watch.has(plate.id);
  const watchBtn = $('.watch', el);
  watchBtn.classList.toggle('is-on', watched);
  watchBtn.setAttribute('aria-pressed', String(watched));

  $('.bid', el).disabled = ms <= 0;
  $('.bid', el).textContent = ms <= 0 ? 'انتهى' : plate.mine ? 'ارفع مزايدتك' : 'زايد';

  if (flash && !reduceMotion) {
    price.classList.remove('bump');
    void price.offsetWidth;
    price.classList.add('bump');
  }
}

/* ------------------------------ التصفية ------------------------------ */

function visiblePlates() {
  const q = state.query.trim();
  const qNum = toLatinDigits(q).replace(/[^\d]/g, '');
  const qLetters = q.replace(/[^ء-ي]/g, '');
  const qLatin = q.replace(/[^a-zA-Z]/g, '').toUpperCase();

  let list = state.plates.filter((p) => {
    if (state.filter === 'fancy' && !p.fancy) return false;
    if (state.filter === 'ending' && remaining(p) > 60 * 60_000) return false;
    if (state.filter === 'watch' && !state.watch.has(p.id)) return false;
    if (['أحادية', 'ثنائية', 'ثلاثية', 'رباعية', 'خماسية'].includes(state.filter)
        && p.cls !== state.filter) return false;

    if (!q) return true;
    const letters = p.ar.join('');
    return (
      (qNum && p.num.includes(qNum)) ||
      (qLetters && [...qLetters].every((c) => letters.includes(c))) ||
      (qLatin && [...qLatin].every((c) => p.latin.includes(c)))
    );
  });

  const cmp = {
    ending: (a, b) => remaining(a) - remaining(b),
    'price-desc': (a, b) => b.price - a.price,
    'price-asc': (a, b) => a.price - b.price,
    bids: (a, b) => b.bids - a.bids,
  }[state.sort];

  return list.sort(cmp);
}

function render() {
  const list = visiblePlates();
  const grid = $('#cards');
  const frag = document.createDocumentFragment();

  list.forEach((p, i) => {
    const el = cardOf.get(p.id) || buildCard(p);
    el.style.setProperty('--i', String(Math.min(i, 12)));
    frag.append(el);
  });

  grid.replaceChildren(frag);
  $('#empty').hidden = list.length > 0;
  $('#resultCount').textContent = toArabicDigits(list.length);
  $('#watchCount').textContent = toArabicDigits(state.watch.size);
}

/* ------------------------------ المفضلة ------------------------------ */

function toggleWatch(id) {
  const on = state.watch.has(id);
  on ? state.watch.delete(id) : state.watch.add(id);
  localStorage.setItem(WATCH_KEY, JSON.stringify([...state.watch]));

  paintCard(byId.get(id));
  $('#watchCount').textContent = toArabicDigits(state.watch.size);
  toast(on ? 'أُزيلت من المفضلة' : 'أُضيفت إلى المفضلة', on ? '' : 'ok');

  if (state.filter === 'watch') render();
}

/* ------------------------------ المزايدة ------------------------------ */

let activeId = null;

function openModal(id) {
  const plate = byId.get(id);
  if (!plate || remaining(plate) <= 0) return;

  activeId = id;
  $('#modalPlate').replaceChildren(renderPlate(plate, 'lg'));
  syncModal();

  const modal = $('#modal');
  modal.hidden = false;
  requestAnimationFrame(() => modal.classList.add('is-open'));
  $('#bidInput').focus({ preventScroll: true });
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const modal = $('#modal');
  modal.classList.remove('is-open');
  document.body.style.overflow = '';
  activeId = null;
  setTimeout(() => (modal.hidden = true), 180);
}

function minNext(plate) {
  return plate.price + stepOf(plate.price);
}

function syncModal(keepInput = false) {
  const plate = byId.get(activeId);
  if (!plate) return;

  const step = stepOf(plate.price);
  const min = minNext(plate);

  $('#mPrice').textContent = `${formatMoney(plate.price)} ريال`;
  $('#mBids').textContent = toArabicDigits(plate.bids);
  $('#mTime').textContent = formatLeft(remaining(plate));
  $('#mHint').textContent =
    `الحد الأدنى ${formatMoney(min)} ريال · خطوة المزايدة ${formatMoney(step)} ريال`;

  if (!keepInput) $('#bidInput').value = min.toLocaleString('en-US');

  $('#quick').replaceChildren(
    ...[1, 2, 5].map((mult) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'quick-btn';
      b.textContent = `+ ${formatMoney(step * mult)}`;
      b.addEventListener('click', () => {
        const cur = readBid() || plate.price;
        $('#bidInput').value = (cur + step * mult).toLocaleString('en-US');
      });
      return b;
    })
  );

  const list = $('#historyList');
  list.replaceChildren(
    ...(plate.history.length
      ? plate.history.slice(0, 8).map((h) => {
          const li = document.createElement('li');
          li.className = h.mine ? 'is-mine' : '';
          li.innerHTML = `<span>${h.who}</span><b>${formatMoney(h.amount)} ريال</b>`;
          return li;
        })
      : [Object.assign(document.createElement('li'), {
          className: 'muted',
          textContent: 'لا توجد مزايدات مسجّلة في هذه الجلسة بعد.',
        })])
  );
}

const readBid = () => {
  const raw = toLatinDigits($('#bidInput').value).replace(/[^\d]/g, '');
  return raw ? Number(raw) : 0;
};

function placeBid(id, amount, who, mine) {
  const plate = byId.get(id);
  plate.price = amount;
  plate.bids += 1;
  plate.leader = who;
  plate.mine = mine;
  plate.history.unshift({ who, amount, mine });

  // تمديد تلقائي: أي مزايدة في آخر دقيقتين تضيف دقيقتين
  if (remaining(plate) < 2 * 60_000) plate.ends = Date.now() + 2 * 60_000;

  paintCard(plate, true);
  pushTicker(plate, who, amount);
  if (activeId === id) syncModal();
  if (state.sort !== 'ending') render();
}

$('#confirmBid').addEventListener('click', () => {
  const plate = byId.get(activeId);
  if (!plate) return;

  const amount = readBid();
  const min = minNext(plate);

  if (!amount || amount < min) {
    toast(`المبلغ يجب ألا يقل عن ${formatMoney(min)} ريال`, 'err');
    $('#bidInput').classList.add('shake');
    setTimeout(() => $('#bidInput').classList.remove('shake'), 400);
    return;
  }
  if (amount > state.wallet) {
    toast('المبلغ يتجاوز رصيد المحفظة', 'err');
    return;
  }

  placeBid(plate.id, amount, 'أنت', true);
  toast(`أنت الأعلى الآن بـ ${formatMoney(amount)} ريال`, 'ok');
  closeModal();
});

$('#bidInput').addEventListener('input', (e) => {
  const n = toLatinDigits(e.target.value).replace(/[^\d]/g, '');
  e.target.value = n ? Number(n).toLocaleString('en-US') : '';
});

$$('[data-close]').forEach((el) => el.addEventListener('click', closeModal));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && activeId) closeModal();
});

/* --------------------------- المزايدون الآليون --------------------------- */

function robotBid() {
  const open = state.plates.filter((p) => remaining(p) > 0);
  if (!open.length) return;

  // ترجيح اللوحات القريبة من الانتهاء
  const pool = open.flatMap((p) => {
    const ms = remaining(p);
    const weight = ms < 10 * 60_000 ? 5 : ms < 60 * 60_000 ? 3 : 1;
    return Array(weight).fill(p);
  });

  const plate = pool[Math.floor(Math.random() * pool.length)];
  const step = stepOf(plate.price);
  const amount = plate.price + step * (1 + Math.floor(Math.random() * 3));
  const wasMine = plate.mine;
  const who = BIDDERS[Math.floor(Math.random() * BIDDERS.length)];

  placeBid(plate.id, amount, who, false);

  if (wasMine) {
    toast(`تمت المزايدة عليك في لوحة ${plate.ar.join(' ')} ${toArabicDigits(plate.num)}`, 'warn');
  }
}

setInterval(robotBid, reduceMotion ? 12_000 : 5_500);

/* ----------------------------- شريط المباشر ----------------------------- */

function pushTicker(plate, who, amount) {
  const track = $('#ticker');
  const item = document.createElement('span');
  item.className = 'ticker-item';
  item.innerHTML =
    `<b>${who}</b> زايد على <i>${plate.ar.join(' ')} ${toArabicDigits(plate.num)}</i>` +
    `<em>${formatMoney(amount)} ريال</em>`;
  track.prepend(item);
  while (track.children.length > 12) track.lastElementChild.remove();
}

/* ------------------------------ العدّادات ------------------------------ */

function tick() {
  state.plates.forEach((p) => {
    const el = cardOf.get(p.id);
    if (!el || !el.isConnected) return;
    const ms = remaining(p);
    $('.time', el).textContent = formatLeft(ms);
    el.dataset.state = urgency(ms);
    if (ms <= 0 && !el.classList.contains('is-over')) paintCard(p);
  });

  if (activeId) $('#mTime').textContent = formatLeft(remaining(byId.get(activeId)));

  const spot = byId.get(spotlightId);
  $('#spotTimer').textContent = formatLeft(remaining(spot));
  $('#spotPrice').textContent = `${formatMoney(spot.price)} ريال`;
}

setInterval(tick, 1000);

/* ------------------------------ التنبيهات ------------------------------ */

function toast(message, kind = '') {
  const box = $('#toasts');
  const t = document.createElement('div');
  t.className = `toast ${kind}`;
  t.textContent = message;
  box.append(t);
  requestAnimationFrame(() => t.classList.add('in'));
  setTimeout(() => {
    t.classList.remove('in');
    setTimeout(() => t.remove(), 250);
  }, 3200);
}

/* ------------------------------- الأدوات ------------------------------- */

$('#search').addEventListener('input', (e) => {
  state.query = e.target.value;
  $('#searchClear').hidden = !state.query;
  render();
});

$('#searchClear').addEventListener('click', () => {
  $('#search').value = '';
  state.query = '';
  $('#searchClear').hidden = true;
  render();
});

$('#chips').addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  $$('.chip', $('#chips')).forEach((c) => c.classList.toggle('is-on', c === chip));
  state.filter = chip.dataset.filter;
  render();
});

$('#sort').addEventListener('change', (e) => {
  state.sort = e.target.value;
  render();
});

$$('[data-filter-link]').forEach((a) =>
  a.addEventListener('click', () => {
    const target = $$('.chip', $('#chips')).find(
      (c) => c.dataset.filter === a.dataset.filterLink
    );
    target?.click();
  })
);

/* ------------------------------ لوحة اليوم ------------------------------ */

const spotlightId = state.plates.reduce((a, b) => (a.price > b.price ? a : b)).id;
const spotPlate = byId.get(spotlightId);

$('#spotPlate').append(renderPlate(spotPlate, 'lg'));
$('#spotBid').addEventListener('click', () => openModal(spotlightId));

/* --------------------------- عدّادات الإحصاءات --------------------------- */

function countUp(el) {
  const target = Number(el.dataset.count);
  if (reduceMotion) {
    el.textContent = formatMoney(target);
    return;
  }
  const dur = 1400;
  const t0 = performance.now();

  const step = (now) => {
    const p = Math.min(1, (now - t0) / dur);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = formatMoney(Math.round(target * eased));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

const statsObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      countUp(entry.target);
      statsObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.4 }
);

$$('[data-count]').forEach((el) => statsObserver.observe(el));

/* ------------------------ ظهور الأقسام عند التمرير ------------------------ */

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.12 }
);

$$('.how, .steps li').forEach((el) => {
  el.classList.add('reveal');
  revealObserver.observe(el);
});

/* ------------------------------ الانطلاق ------------------------------ */

$('#walletValue').textContent = formatMoney(state.wallet);
render();
tick();

// بثّ أولي في الشريط حتى لا يبدأ فارغًا
state.plates
  .slice(0, 6)
  .forEach((p) =>
    pushTicker(p, BIDDERS[Math.floor(Math.random() * BIDDERS.length)], p.price)
  );
