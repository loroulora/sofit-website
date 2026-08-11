// ============================================================
// СТРАНИЦА «ГАЛЕРЕЯ»
// 1) Переключение вкладок «Фото» / «Видео» (без библиотек)
// 2) Лайтбокс для фото: открытие по клику, закрытие по клику
//    вне фото / по крестику / по Escape (чистый JS)
// ============================================================

(function () {
  // ---------- Вкладки «Фото» / «Видео» ----------

  const tabs = document.querySelectorAll('.gallery-tab');
  const panels = document.querySelectorAll('.gallery-panel');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => {
        const isActive = t === tab;
        t.classList.toggle('active', isActive);
        t.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
      panels.forEach((panel) => {
        panel.classList.toggle('active', panel.dataset.panel === tab.dataset.tab);
      });
    });
  });

  // ---------- Лайтбокс ----------

  const lightbox = document.getElementById('galleryLightbox');
  if (!lightbox) return;

  const lightboxImg = lightbox.querySelector('.lightbox-img');
  const closeBtn = lightbox.querySelector('.lightbox-close');

  function openLightbox(src, alt) {
    lightboxImg.src = src;
    lightboxImg.alt = alt || '';
    lightbox.classList.add('active');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lightbox-open'); // блокируем скролл страницы
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lightbox-open');
    lightboxImg.src = ''; // чтобы не мигало старое фото при следующем открытии
  }

  // Открытие по клику на фото.
  // Показываем то же изображение (picsum ?random=N — не seed, а cache-buster:
  // запрос другой URL/размера вернул бы ДРУГУЮ картинку, поэтому увеличиваем
  // тот же файл средствами CSS. После замены на реальные фото сюда можно
  // передавать data-full с URL полноразмерной версии).
  document.querySelectorAll('.photo-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      const thumb = btn.querySelector('img');
      if (!thumb) return;
      openLightbox(thumb.dataset.full || thumb.src, thumb.alt);
    });
  });

  // Закрытие: крестик
  closeBtn.addEventListener('click', closeLightbox);

  // Закрытие: клик по затемнённому фону (но не по самому фото)
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  // Закрытие: Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('active')) {
      closeLightbox();
    }
  });
})();
