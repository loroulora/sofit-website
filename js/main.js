// ===== ГАМБУРГЕР-МЕНЮ =====
const burgerBtn = document.getElementById('burgerBtn');
const mobileMenu = document.getElementById('mobileMenu');

if (burgerBtn && mobileMenu) {
  burgerBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('active');
  });

  // Закрывать меню при клике вне его
  document.addEventListener('click', (e) => {
    if (
      mobileMenu.classList.contains('active') &&
      !mobileMenu.contains(e.target) &&
      !burgerBtn.contains(e.target)
    ) {
      mobileMenu.classList.remove('active');
    }
  });
}

// ===== ПРОГРЕСС-БАРЫ ЗАПОЛНЕННОСТИ ГРУПП (страница «Расписание») =====
// Данные берутся из data-атрибутов: data-taken (занято) и data-total (всего мест).
document.querySelectorAll('.capacity').forEach((el) => {
  const taken = parseInt(el.dataset.taken, 10) || 0;
  const total = parseInt(el.dataset.total, 10) || 1;
  const percent = Math.min(100, Math.round((taken / total) * 100));

  const fill = el.querySelector('.capacity-fill');
  const label = el.querySelector('.capacity-label');

  if (fill) {
    fill.style.width = percent + '%';
    if (percent >= 100) {
      fill.classList.add('full');
    } else if (percent >= 75) {
      fill.classList.add('almost-full');
    }
  }

  if (label) {
    const free = Math.max(0, total - taken);
    label.textContent =
      free === 0
        ? 'Мест нет — запись в лист ожидания'
        : 'Свободно мест: ' + free + ' из ' + total;
  }
});

// ===== КНОПКА «НАВЕРХ» (scroll to top) =====
// Кнопка создаётся динамически — main.js подключён на всех страницах,
// поэтому HTML страниц править не нужно. Стили — в css/style.css (.scroll-top-btn).
(() => {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'scroll-top-btn';
  btn.setAttribute('aria-label', 'Наверх');
  btn.innerHTML = '↑';
  document.body.appendChild(btn);

  const SCROLL_THRESHOLD = 400; // px прокрутки до появления кнопки

  // Позиция скролла глобально (window); documentElement/body — фолбэк:
  // после overflow-x: hidden на html/body скролл-контейнером в некоторых
  // браузерах становится body, а window.scrollY остаётся 0.
  const getScrollTop = () =>
    window.scrollY ||
    document.documentElement.scrollTop ||
    document.body.scrollTop ||
    0;

  const toggleBtn = () => {
    btn.classList.toggle('visible', getScrollTop() > SCROLL_THRESHOLD);
  };

  window.addEventListener('scroll', toggleBtn, { passive: true });
  document.body.addEventListener('scroll', toggleBtn, { passive: true });
  toggleBtn();

  btn.addEventListener('click', () => {
    // Прокрутка строго на уровне window — до top: 0, самого начала документа
    // (body имеет padding-top под fixed header, поэтому при scrollTop = 0
    // контент, включая H1, полностью виден и не обрезан header'ом)
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Фолбэк для браузеров/режимов, где window не является скроллером
    if (document.documentElement.scrollTop) {
      document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (document.body.scrollTop) {
      document.body.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
})();

// ===== COOKIE-БАННЕР СОГЛАСИЯ =====
// Создаётся динамически (main.js подключён на всех страницах — HTML править
// не нужно). Согласие хранится в localStorage ('cookieConsent' = 'true'),
// при его наличии баннер не показывается ни на одной странице.
// Стили — в css/style.css (.cookie-banner).
(() => {
  const CONSENT_KEY = 'cookieConsent';

  // localStorage может быть недоступен (приватный режим / отключённые cookie) —
  // в этом случае показываем баннер каждый раз, но не падаем с ошибкой
  const getConsent = () => {
    try {
      return localStorage.getItem(CONSENT_KEY) === 'true';
    } catch (e) {
      return false;
    }
  };

  const saveConsent = () => {
    try {
      localStorage.setItem(CONSENT_KEY, 'true');
    } catch (e) {
      /* нет доступа к localStorage — просто скрываем баннер до перезагрузки */
    }
  };

  if (getConsent()) return;

  // Относительный путь до политики: страницы в posts/ лежат на уровень глубже
  const privacyHref = window.location.pathname.includes('/posts/')
    ? '../privacy-policy.html'
    : 'privacy-policy.html';

  const banner = document.createElement('div');
  banner.className = 'cookie-banner';
  banner.setAttribute('role', 'region');
  banner.setAttribute('aria-label', 'Уведомление об использовании cookie');
  banner.innerHTML =
    '<p class="cookie-banner-text">Мы используем файлы cookie для улучшения работы сайта. ' +
    'Продолжая использовать сайт, вы соглашаетесь с ' +
    '<a href="' + privacyHref + '" target="_blank" rel="noopener">политикой обработки персональных данных</a>.</p>' +
    '<button type="button" class="cookie-banner-btn">Принять</button>';
  document.body.appendChild(banner);

  // Пока баннер виден, плавающие кнопки (WhatsApp / «Наверх») приподнимаются
  // над ним через CSS-переменную --cookie-banner-h (см. css/style.css)
  const updateOffset = () => {
    document.body.style.setProperty('--cookie-banner-h', banner.offsetHeight + 'px');
  };
  document.body.classList.add('cookie-banner-visible');
  updateOffset();
  window.addEventListener('resize', updateOffset);

  banner.querySelector('.cookie-banner-btn').addEventListener('click', () => {
    saveConsent();
    banner.remove();
    document.body.classList.remove('cookie-banner-visible');
    document.body.style.removeProperty('--cookie-banner-h');
    window.removeEventListener('resize', updateOffset);
  });
})();
