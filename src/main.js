/* الخطوط محليًا (لا اعتماد على الشبكة): IBM Plex Sans Arabic */
import '@fontsource/ibm-plex-sans-arabic/arabic-300.css';
import '@fontsource/ibm-plex-sans-arabic/arabic-400.css';
import '@fontsource/ibm-plex-sans-arabic/arabic-500.css';
import '@fontsource/ibm-plex-sans-arabic/arabic-600.css';
import '@fontsource/ibm-plex-sans-arabic/latin-400.css';
import '@fontsource/ibm-plex-sans-arabic/latin-500.css';

import './style.css';
import { initLiquidGlass } from './liquid-glass.js';

/* ------------------------- تأثير الزجاج السائل ------------------------- */

const start = () => initLiquidGlass('[data-liquid]');

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
  start();
}

/* ------------------------------- الفيديو ------------------------------- */
// بعض المتصفحات تمنع التشغيل التلقائي حتى مع كتم الصوت؛ نعيد المحاولة عند
// أول تفاعل من المستخدم.

const video = document.querySelector('.hero-video');

if (video) {
  const tryPlay = () => {
    const attempt = video.play();
    if (attempt && typeof attempt.catch === 'function') attempt.catch(() => {});
  };

  tryPlay();
  document.addEventListener('pointerdown', tryPlay, { once: true });
}

/* ------------------------- تبديل المشروب المفضل ------------------------- */
// لمسة القصيم: قائمة المشروبات تتضمّن لاتيه التمر السكري.

const FAVORITES = [
  { name: 'لاتيه', orders: '٧٣' },
  { name: 'لاتيه التمر السكري', orders: '٤١' },
  { name: 'قهوة عربية بالهيل', orders: '٣٥' },
  { name: 'سبانش لاتيه', orders: '٢٩' },
];

const shuffleBtn = document.querySelector('.fav-shuffle');
const favTitle = document.querySelector('.fav-title');
const favMeta = document.querySelector('.fav-meta');

if (shuffleBtn && favTitle && favMeta) {
  let index = 0;

  shuffleBtn.addEventListener('click', () => {
    index = (index + 1) % FAVORITES.length;
    const next = FAVORITES[index];

    favTitle.textContent = next.name;
    favMeta.textContent = `طُلب ${next.orders} مرة`;

    shuffleBtn.animate(
      [{ transform: 'rotate(0deg)' }, { transform: 'rotate(180deg)' }],
      { duration: 420, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
    );
  });
}
