/**
 * Small DOM helpers. Dynamic user text is always inserted with textContent.
 */

export function h(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(attrs || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === false) return;
    if (key === 'class' || key === 'className') {
      node.className = value;
    } else if (key === 'text') {
      node.textContent = value;
    } else if (key === 'dataset') {
      Object.entries(value).forEach(([dataKey, dataValue]) => {
        if (dataValue !== undefined && dataValue !== null) node.dataset[dataKey] = dataValue;
      });
    } else if (key === 'on') {
      Object.entries(value).forEach(([eventName, handler]) => {
        if (typeof handler === 'function') node.addEventListener(eventName, handler);
      });
    } else if (key === 'props') {
      Object.assign(node, value);
    } else if (key === 'attrs') {
      Object.entries(value).forEach(([attrName, attrValue]) => {
        if (attrValue !== undefined && attrValue !== null && attrValue !== false) {
          node.setAttribute(attrName, attrValue === true ? '' : String(attrValue));
        }
      });
    } else if (value === true) {
      node.setAttribute(key, '');
    } else {
      node.setAttribute(key, String(value));
    }
  });

  children.flat(Infinity).forEach((child) => {
    if (child === null || child === undefined || child === false) return;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  });
  return node;
}

export function qs(selector, root = document) {
  return root.querySelector(selector);
}

export function qsa(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

export function clear(node) {
  if (node) node.replaceChildren();
}

export function setText(node, value) {
  if (node) node.textContent = value === null || value === undefined ? '' : String(value);
}

export function show(node, visible = true) {
  if (!node) return;
  node.classList.toggle('hidden', !visible);
}

export function debounce(fn, wait = 250) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

let toastRegion = null;

function ensureToastRegion() {
  if (toastRegion && document.body.contains(toastRegion)) return toastRegion;
  toastRegion = h('div', {
    id: 'toast-region',
    class: 'toast-region',
    attrs: { 'aria-live': 'polite', 'aria-atomic': 'false' }
  });
  document.body.append(toastRegion);
  return toastRegion;
}

export function toast(message, type = 'info', duration = 5000) {
  const region = ensureToastRegion();
  const item = h('div', {
    class: `toast toast-${type}`,
    attrs: { role: type === 'error' ? 'alert' : 'status' }
  },
    h('span', { class: 'toast-message', text: message }),
    h('button', {
      class: 'toast-close',
      type: 'button',
      attrs: { 'aria-label': 'Tutup mesej' },
      text: '×',
      on: { click: () => item.remove() }
    })
  );
  region.append(item);
  if (duration > 0) {
    setTimeout(() => item.remove(), duration);
  }
  return item;
}

export function setBusy(button, busy, busyLabel = 'Memproses…') {
  if (!button) return;
  if (busy) {
    if (!button.dataset.originalLabel) button.dataset.originalLabel = button.textContent;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    button.textContent = busyLabel;
  } else {
    button.disabled = false;
    button.removeAttribute('aria-busy');
    if (button.dataset.originalLabel) button.textContent = button.dataset.originalLabel;
  }
}

export function setProgress(element, percent) {
  if (!element) return;
  const value = Math.max(0, Math.min(100, Number(percent) || 0));
  element.style.width = value + '%';
  const track = element.parentElement;
  if (track) {
    track.setAttribute('role', 'progressbar');
    track.setAttribute('aria-valuemin', '0');
    track.setAttribute('aria-valuemax', '100');
    track.setAttribute('aria-valuenow', String(Math.round(value)));
  }
}

export function badge(text, variant = 'neutral') {
  return h('span', { class: `badge badge-${variant}`, text });
}

export function statusVariant(status) {
  switch (status) {
    case 'Disahkan':
    case 'Selesai':
    case 'Sudah':
    case 'Hadir':
      return 'success';
    case 'Menunggu':
    case 'Belum':
    case 'Sedang':
      return 'warning';
    case 'Senarai Tunggu':
      return 'info';
    case 'Lewat':
      return 'danger';
    case 'Hari ini':
      return 'gold';
    case 'Batal':
      return 'muted';
    case 'Dikecualikan':
    case 'Tidak':
      return 'neutral';
    default:
      return 'neutral';
  }
}

export function emptyState(message, hint = '') {
  return h('div', { class: 'empty-state' },
    h('p', { text: message }),
    hint ? h('p', { class: 'muted', text: hint }) : null
  );
}

export function confirmAction(message) {
  return window.confirm(message);
}

export async function copyText(text) {
  const value = String(text || '');
  if (!value) return false;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch (err) {
    // Fall through to the textarea fallback.
  }
  try {
    const area = h('textarea', {
      class: 'sr-only',
      attrs: { readonly: true },
      props: { value }
    });
    document.body.append(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  } catch (err) {
    return false;
  }
}

export function downloadText(filename, content, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = h('a', {
    href: url,
    download: filename,
    class: 'hidden'
  });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function formatPhoneDisplay(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)} ${digits.slice(6)}`;
  if (digits.length === 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)} ${digits.slice(7)}`;
  return digits || String(phone || '');
}

/* ------------------------------------------------------------------ */
/* Form dialog                                                         */
/* ------------------------------------------------------------------ */

function ensureDialog() {
  let dialog = document.getElementById('form-dialog');
  if (dialog) return dialog;
  dialog = h('dialog', { id: 'form-dialog', class: 'modal' });
  document.body.append(dialog);
  return dialog;
}

function buildField(field, value) {
  const id = `field-${field.name}-${Math.random().toString(36).slice(2, 7)}`;
  const wrap = h('div', {
    class: `field${field.full ? ' field-full' : ''}${field.type === 'checkbox' ? ' field-check' : ''}`
  });

  if (field.type === 'checkbox') {
    const input = h('input', {
      type: 'checkbox',
      id,
      name: field.name,
      props: {
        checked: value === true || value === 'true' || value === 'ya' || value === 'on',
        disabled: Boolean(field.disabled)
      }
    });
    const label = h('label', { for: id, class: 'check-label' },
      input,
      h('span', { text: field.label })
    );
    wrap.append(label);
    if (field.help) wrap.append(h('p', { class: 'hint', text: field.help }));
    return { wrap, input, field };
  }

  const label = h('label', { for: id, class: 'field-label', text: field.label });
  wrap.append(label);

  let input;
  if (field.type === 'select') {
    input = h('select', {
      id,
      name: field.name,
      class: 'input',
      props: { disabled: Boolean(field.disabled) },
      attrs: { required: field.required ? '' : null }
    });
    if (field.placeholder) {
      input.append(h('option', { value: '', text: field.placeholder }));
    }
    (field.options || []).forEach((option) => {
      const optionValue = typeof option === 'string' ? option : option.value;
      const optionLabel = typeof option === 'string' ? option : option.label;
      input.append(h('option', { value: optionValue, text: optionLabel }));
    });
    input.value = value === undefined || value === null ? '' : String(value);
  } else if (field.type === 'textarea') {
    input = h('textarea', {
      id,
      name: field.name,
      class: 'input',
      attrs: {
        rows: field.rows || 3,
        placeholder: field.placeholder || '',
        required: field.required ? '' : null,
        readonly: field.readonly ? '' : null
      },
      props: { disabled: Boolean(field.disabled), value: value === undefined || value === null ? '' : String(value) }
    });
  } else {
    input = h('input', {
      id,
      name: field.name,
      class: 'input',
      type: field.type || 'text',
      attrs: {
        placeholder: field.placeholder || '',
        min: field.min !== undefined ? field.min : null,
        max: field.max !== undefined ? field.max : null,
        step: field.step !== undefined ? field.step : null,
        pattern: field.pattern || null,
        inputmode: field.inputmode || null,
        autocomplete: field.autocomplete || null,
        required: field.required ? '' : null,
        readonly: field.readonly ? '' : null
      },
      props: {
        disabled: Boolean(field.disabled),
        value: value === undefined || value === null ? '' : String(value)
      }
    });
  }

  wrap.append(input);
  if (field.help) wrap.append(h('p', { class: 'hint', text: field.help }));
  return { wrap, input, field };
}

export function openFormDialog({
  title,
  description = '',
  fields = [],
  values = {},
  submitLabel = 'Simpan',
  cancelLabel = 'Batal',
  onSubmit
}) {
  const dialog = ensureDialog();
  if (dialog.open) dialog.close();
  clear(dialog);

  const closeButton = h('button', {
    class: 'icon-button',
    type: 'button',
    text: '×',
    attrs: { 'aria-label': 'Tutup' },
    on: { click: () => dialog.close() }
  });

  const form = h('form', { class: 'modal-form', attrs: { novalidate: '' } });
  const fieldRefs = fields.map((field) => buildField(field, values[field.name]));
  const grid = h('div', { class: 'form-grid' }, fieldRefs.map((item) => item.wrap));
  const errorBox = h('p', { class: 'form-error hidden', attrs: { role: 'alert' } });
  const submitButton = h('button', {
    class: 'btn btn-gold',
    type: 'submit',
    text: submitLabel
  });
  const cancelButton = h('button', {
    class: 'btn btn-ghost',
    type: 'button',
    text: cancelLabel,
    on: { click: () => dialog.close() }
  });

  form.append(
    grid,
    errorBox,
    h('div', { class: 'modal-actions' }, cancelButton, submitButton)
  );

  dialog.append(
    h('div', { class: 'modal-head' },
      h('div', {},
        h('h2', { text: title }),
        description ? h('p', { class: 'muted', text: description }) : null
      ),
      closeButton
    ),
    form
  );

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorBox.classList.add('hidden');
    if (!form.reportValidity()) return;

    const data = {};
    fieldRefs.forEach(({ input, field }) => {
      if (field.type === 'checkbox') {
        data[field.name] = input.checked;
      } else if (field.type === 'number') {
        data[field.name] = input.value === '' ? '' : Number(input.value);
      } else {
        data[field.name] = input.value.trim();
      }
    });

    setBusy(submitButton, true);
    try {
      await onSubmit(data);
      dialog.close();
    } catch (err) {
      errorBox.textContent = err && err.message ? err.message : 'Ralat tidak diketahui.';
      errorBox.classList.remove('hidden');
      errorBox.focus?.();
      setBusy(submitButton, false);
    }
  });

  dialog.addEventListener('close', () => {
    clear(dialog);
  }, { once: true });

  dialog.showModal();
  if (fieldRefs.length) {
    setTimeout(() => fieldRefs[0].input.focus(), 30);
  }
  return dialog;
}
