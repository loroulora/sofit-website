// ============================================================
// МОДАЛЬНОЕ ОКНО «ЗАПИСЬ НА ПРОБНОЕ ЗАНЯТИЕ»
// Открытие/закрытие, валидация формы, отправка в Google Sheets
// (через Google Apps Script Web App) + дубль в WhatsApp.
// ============================================================

// ⚙️ НАСТРОЙКА ВЛАДЕЛЬЦЕМ:
// После создания Google Apps Script Web App вставьте его URL сюда.
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby-kR_HPSCPg8AecOb1uQd6CrC7cElg2SKf8y5bgN3GaEdL-k8zPLEwRxLAePbATnxJeA/exec";

// Номер WhatsApp — тот же, что используется в deep-link на schedule.html
const WHATSAPP_PHONE = "79852502751";

(function () {
  const overlay = document.getElementById('signupModal');
  const openBtn = document.getElementById('signupOpenBtn');

  // Если на странице нет модалки или кнопки — ничего не делаем
  if (!overlay || !openBtn) return;

  const modalWindow = overlay.querySelector('.modal-window');
  const closeBtn = overlay.querySelector('.modal-close');
  const form = overlay.querySelector('.modal-form');
  const successBlock = overlay.querySelector('.modal-success');
  const whatsappBtn = overlay.querySelector('.modal-whatsapp-btn');

  // ---------- Открытие / закрытие ----------

  function openModal() {
    overlay.classList.add('active');
    document.body.classList.add('modal-open'); // блокируем скролл страницы
    overlay.setAttribute('aria-hidden', 'false');
    // Фокус на первое поле формы (если форма ещё видна)
    const firstInput = form.querySelector('input');
    if (firstInput && !modalWindow.classList.contains('success-state')) {
      setTimeout(() => firstInput.focus(), 300); // после анимации шторки
    }
  }

  function closeModal() {
    overlay.classList.remove('active');
    document.body.classList.remove('modal-open');
    overlay.setAttribute('aria-hidden', 'true');
  }

  openBtn.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);

  // Закрытие по клику на затемнённый фон (но не по самому окну)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  // Закрытие по Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('active')) {
      closeModal();
    }
  });

  // ---------- Валидация ----------

  function setFieldError(fieldWrap, message) {
    fieldWrap.classList.add('has-error');
    const errorEl = fieldWrap.querySelector('.field-error');
    if (errorEl) errorEl.textContent = message;
  }

  function clearFieldError(fieldWrap) {
    fieldWrap.classList.remove('has-error');
  }

  // Убираем подсказку об ошибке, как только пользователь начал исправлять поле
  form.querySelectorAll('.modal-field, .modal-consent').forEach((wrap) => {
    wrap.addEventListener('input', () => clearFieldError(wrap));
    wrap.addEventListener('change', () => clearFieldError(wrap));
  });

  function validateForm() {
    let valid = true;

    const childWrap = form.querySelector('[data-field="childName"]');
    const parentWrap = form.querySelector('[data-field="parentName"]');
    const phoneWrap = form.querySelector('[data-field="phone"]');
    const consentWrap = form.querySelector('[data-field="consent"]');

    const childName = form.elements.childName.value.trim();
    const parentName = form.elements.parentName.value.trim();
    const phone = form.elements.phone.value.trim();
    const consent = form.elements.consent.checked;

    if (!childName) {
      setFieldError(childWrap, 'Укажите имя ребёнка');
      valid = false;
    }

    if (!parentName) {
      setFieldError(parentWrap, 'Укажите имя родителя');
      valid = false;
    }

    if (!phone) {
      setFieldError(phoneWrap, 'Укажите телефон для связи');
      valid = false;
    } else if (!/^[+]?[\d\s\-()]{7,20}$/.test(phone)) {
      // Мягкая проверка: цифры, +, пробелы, дефисы, скобки; 7–20 символов
      setFieldError(phoneWrap, 'Проверьте номер телефона, например: +7 985 250-27-51');
      valid = false;
    }

    if (!consent) {
      setFieldError(consentWrap, 'Необходимо согласие на обработку персональных данных');
      valid = false;
    }

    return valid;
  }

  // ---------- Сбор данных формы ----------

  function collectFormData() {
    return {
      childName: form.elements.childName.value.trim(),
      parentName: form.elements.parentName.value.trim(),
      phone: form.elements.phone.value.trim(),
      age: form.elements.age.value.trim(),
      preferredTime: form.elements.preferredTime.value.trim(),
      group: form.elements.group.value.trim(),
      comment: form.elements.comment.value.trim(),
      submittedAt: new Date().toLocaleString('ru-RU'),
    };
  }

  // ---------- Отправка в Google Sheets ----------

  function sendToGoogleSheets(data) {
    // URL ещё не настроен владельцем — тихо пропускаем отправку
    if (!GOOGLE_SCRIPT_URL || !GOOGLE_SCRIPT_URL.startsWith('http')) {
      console.warn(
        'GOOGLE_SCRIPT_URL не настроен (js/modal.js) — заявка не отправлена в Google Sheets. ' +
        'Данные заявки:', data
      );
      return Promise.resolve();
    }

    return fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', // Apps Script Web App не отдаёт CORS-заголовки
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(data),
    }).catch((err) => {
      // Ошибку сети не показываем пользователю — только в консоль
      console.warn('Не удалось отправить заявку в Google Sheets:', err);
    });
  }

  // ---------- Текст для WhatsApp-дубля ----------

  function buildWhatsAppText(data) {
    const lines = ['Здравствуйте! Хочу записаться на пробное занятие.'];

    let childLine = 'Ребёнок: ' + data.childName;
    if (data.age) childLine += ', Возраст: ' + data.age;
    lines.push(childLine);

    lines.push('Родитель: ' + data.parentName + ', Телефон: ' + data.phone);

    // Необязательные поля добавляем только если заполнены
    if (data.preferredTime) lines.push('Удобное время: ' + data.preferredTime);
    if (data.group) lines.push('Группа: ' + data.group);
    if (data.comment) lines.push('Комментарий: ' + data.comment);

    return lines.join('\n');
  }

  // ---------- Экран успеха ----------

  function showSuccess(data) {
    modalWindow.classList.add('success-state');
    successBlock.classList.add('visible');
    whatsappBtn.href =
      'https://wa.me/' + WHATSAPP_PHONE + '?text=' + encodeURIComponent(buildWhatsAppText(data));
  }

  // ---------- Обработка отправки формы ----------

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const data = collectFormData();

    // Отправляем в Google Sheets (не блокируем UI: успех показываем сразу,
    // независимо от результата — по требованиям задачи)
    sendToGoogleSheets(data);

    showSuccess(data);
  });
})();
