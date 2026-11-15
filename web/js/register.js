/**
 * Public registration page controller.
 * Handles live quota, KL-based countdowns, form validation and the success screen.
 */

import { apiGet, apiPost, isApiConfigured } from './api.js';
import {
  countdownParts,
  countdownText,
  formatKlDateTime,
  formatKlTime,
  formatRM,
  normalizeWhatsAppNumber,
  nowDate,
  parseDate,
  programPhase,
  whatsappLink
} from './time.js';
import {
  badge,
  clear,
  h,
  qs,
  qsa,
  setBusy,
  setProgress,
  setText,
  show,
  statusVariant,
  toast
} from './ui.js';

/* Fallbacks keep the countdown useful before the first API response. */
const DEFAULT_START = '2026-12-14T08:00:00+08:00';
const DEFAULT_END = '2026-12-16T17:00:00+08:00';
const DEFAULT_CLOSE = '2026-12-07T23:59:00+08:00';
const STATS_REFRESH_MS = 30000;

const state = {
  stats: null,
  configReady: false,
  loadingStats: false,
  statsFailures: 0,
  closingRefreshDone: false,
  submitting: false,
  lastRegistration: null,
  lastPayload: null
};

const el = {};

function cacheElements() {
  const ids = [
    'hero-baki', 'slot-remaining', 'slot-total', 'slot-progress', 'slot-progress-wrap',
    'slot-note', 'stats-updated', 'program-countdown', 'program-phase', 'close-countdown',
    'close-note', 'registration-status', 'yuran-asal', 'yuran-promo', 'yuran-online',
    'age-hint', 'registration-notice', 'registration-form', 'registration-form-wrap',
    'form-error', 'submit-button', 'success-screen', 'success-id', 'success-status',
    'success-name', 'success-guardian', 'success-fee', 'success-datetime',
    'success-waitlist-note', 'success-payment', 'success-whatsapp', 'success-whatsapp-note',
    'print-receipt', 'register-another', 'faq-contact', 'footer-contact', 'footer-whatsapp'
  ];
  ids.forEach((id) => {
    el[id] = document.getElementById(id);
  });
  el.quotaBadgeText = qs('.quota-badge span');
  el.heroQuotaLabel = qs('.quota-badge span');
}

/* ------------------------------------------------------------------ */
/* Countdown                                                           */
/* ------------------------------------------------------------------ */

function setCountdown(container, parts) {
  if (!container) return;
  const values = {
    days: String(parts.days),
    hours: String(parts.hours).padStart(2, '0'),
    minutes: String(parts.minutes).padStart(2, '0'),
    seconds: String(parts.seconds).padStart(2, '0')
  };
  Object.entries(values).forEach(([key, value]) => {
    const node = qs(`[data-cd="${key}"]`, container);
    setText(node, value);
  });
  qsa('.cd-unit', container).forEach((unit) => {
    unit.classList.toggle('is-muted', parts.total <= 0);
  });
}

function targetValues() {
  const stats = state.stats || {};
  return {
    start: parseDate(stats.tarikhMula || DEFAULT_START),
    end: parseDate(stats.tarikhTamat || DEFAULT_END),
    close: parseDate(stats.tarikhTutup || DEFAULT_CLOSE)
  };
}

function tick() {
  const { start, end, close } = targetValues();
  const now = nowDate();

  if (start && end && now.getTime() < start.getTime()) {
    const parts = countdownParts(start.getTime() - now.getTime());
    setCountdown(el['program-countdown'], parts);
    setText(el['program-phase'], `Program bermula dalam ${countdownText(start.getTime() - now.getTime(), { alwaysDays: true })}.`);
  } else if (start && end && now.getTime() <= end.getTime()) {
    const phase = programPhase(start, end, now);
    const parts = countdownParts(end.getTime() - now.getTime());
    setCountdown(el['program-countdown'], parts);
    setText(
      el['program-phase'],
      `Hari ${phase.day} daripada 3 sedang berlangsung. Program berakhir dalam ${countdownText(end.getTime() - now.getTime())}.`
    );
  } else if (end) {
    setCountdown(el['program-countdown'], countdownParts(0));
    setText(el['program-phase'], `Program telah tamat pada ${formatKlDateTime(end)}.`);
  } else {
    setCountdown(el['program-countdown'], countdownParts(0));
    setText(el['program-phase'], 'Tarikh program belum ditetapkan.');
  }

  const manuallyClosed = Boolean(state.stats && state.stats.pendaftaranDibuka === false);
  if (close && !manuallyClosed && now.getTime() < close.getTime()) {
    setCountdown(el['close-countdown'], countdownParts(close.getTime() - now.getTime()));
    setText(el['close-note'], `Pendaftaran ditutup pada ${formatKlDateTime(close)}.`);
  } else {
    setCountdown(el['close-countdown'], countdownParts(0));
    setText(
      el['close-note'],
      manuallyClosed ? 'Pendaftaran ditutup oleh urus setia.' : 'Pendaftaran telah ditutup.'
    );
    if (!state.closingRefreshDone && state.stats && manuallyClosed === false && now.getTime() >= (close?.getTime() || 0)) {
      state.closingRefreshDone = true;
      refreshStats({ silent: true });
    }
  }
}

/* ------------------------------------------------------------------ */
/* Stats                                                               */
/* ------------------------------------------------------------------ */

function displayWhatsApp(value) {
  const digits = normalizeWhatsAppNumber(value);
  if (!digits) return '';
  if (digits.startsWith('60') && digits.length >= 11) {
    const local = digits.slice(2);
    const first = local.slice(0, 2);
    const second = local.slice(2, 5);
    const third = local.slice(5);
    return `+60 ${first}-${second} ${third}`.trim();
  }
  return '+' + digits;
}

function updateContact(stats) {
  const number = normalizeWhatsAppNumber(stats.whatsapp);
  const display = displayWhatsApp(number);
  if (display) {
    setText(el['faq-contact'], `WhatsApp urus setia: ${display}.`);
    setText(el['footer-contact'], `Urus setia KSQ 2026 · ${display}`);
  } else {
    setText(el['faq-contact'], 'Sila hubungi urus setia masjid untuk pertanyaan lanjut.');
    setText(el['footer-contact'], 'Urus setia KSQ 2026');
  }

  if (number) {
    const message = 'Assalamualaikum, saya ingin bertanya tentang Kem Sahabat Quran 2026.';
    el['footer-whatsapp'].href = whatsappLink(number, message);
    show(el['footer-whatsapp'], true);
  } else {
    el['footer-whatsapp'].removeAttribute('href');
    show(el['footer-whatsapp'], false);
  }
}

function setFormEnabled(enabled, buttonLabel = '') {
  const form = el['registration-form'];
  if (!form) return;
  qsa('input, select, textarea, button', form).forEach((control) => {
    if (control.name === 'website') return;
    control.disabled = !enabled;
  });
  if (el['submit-button']) {
    el['submit-button'].disabled = !enabled;
    if (buttonLabel) setText(el['submit-button'], buttonLabel);
    else if (enabled) setText(el['submit-button'], 'Hantar pendaftaran');
  }
}

function showNotice(message, variant = 'warning') {
  const box = el['registration-notice'];
  if (!box) return;
  clear(box);
  box.className = `notice notice-${variant} mb-2`;
  box.append(h('p', {}, h('strong', { text: 'Perhatian: ' }), message));
  show(box, true);
}

function hideNotice() {
  show(el['registration-notice'], false);
}

function renderRegistrationStatus(stats) {
  const box = el['registration-status'];
  if (!box) return;
  clear(box);
  let label = 'Pendaftaran dibuka';
  let variant = 'success';
  if (stats.sumber === 'sheet_luar') {
    label = 'Pendaftaran melalui pautan rasmi';
    variant = 'info';
  } else if (!stats.pendaftaranDibuka) {
    label = 'Pendaftaran ditutup';
    variant = 'muted';
  } else if (stats.bakiSlot <= 0) {
    label = 'Slot penuh · senarai tunggu dibuka';
    variant = 'info';
  }
  box.append(badge(label, variant));
}

function updateFormAvailability(stats) {
  if (stats.sumber === 'sheet_luar') {
    showNotice('Pendaftaran untuk program ini dikendalikan melalui pautan rasmi urus setia. Sila hubungi urus setia untuk mendaftar.', 'info');
    setFormEnabled(false, 'Pendaftaran melalui urus setia');
    return;
  }
  if (!stats.pendaftaranDibuka) {
    showNotice('Pendaftaran telah ditutup. Terima kasih atas minat anda.', 'warning');
    setFormEnabled(false, 'Pendaftaran ditutup');
    return;
  }
  hideNotice();
  setFormEnabled(true);
  if (stats.bakiSlot <= 0) {
    showNotice('Slot telah penuh. Anda masih boleh mendaftar untuk senarai tunggu; urus setia akan menghubungi jika ada slot terbuka.', 'info');
  }
}

function applyStats(stats) {
  state.stats = stats;
  const capacity = Math.max(1, Number(stats.kapasiti) || 40);
  const remaining = Math.max(0, Number(stats.bakiSlot) || 0);
  const used = Math.max(0, capacity - remaining);
  const disahkan = Math.max(0, Number(stats.disahkan) || 0);
  const menunggu = Math.max(0, Number(stats.menunggu) || 0);
  const waitlist = Math.max(0, Number(stats.senaraiTunggu) || 0);

  setText(el['hero-baki'], remaining);
  setText(el['slot-remaining'], remaining);
  setText(el['slot-total'], capacity);
  setProgress(el['slot-progress'], (used / capacity) * 100);
  setText(
    el['slot-note'],
    `${disahkan} disahkan · ${menunggu} menunggu${waitlist ? ` · ${waitlist} senarai tunggu` : ''}`
  );

  if (el.heroQuotaLabel) {
    if (stats.sumber === 'sheet_luar') setText(el.heroQuotaLabel, 'pendaftaran melalui pautan rasmi urus setia');
    else if (!stats.pendaftaranDibuka) setText(el.heroQuotaLabel, 'pendaftaran telah ditutup');
    else if (remaining <= 0) setText(el.heroQuotaLabel, 'slot penuh · senarai tunggu dibuka');
    else setText(el.heroQuotaLabel, `daripada ${capacity} slot masih terbuka`);
  }

  const fee = stats.yuran || {};
  setText(el['yuran-asal'], formatRM(fee.asal, 0));
  setText(el['yuran-promo'], formatRM(fee.promo, 0));
  setText(el['yuran-online'], `Daftar online: ${formatRM(fee.online, 0)}`);

  const ageMin = Number(stats.umurMin) || 10;
  const ageMax = Number(stats.umurMax) || 18;
  const ageInput = qs('#umur');
  if (ageInput) {
    ageInput.min = String(ageMin);
    ageInput.max = String(ageMax);
  }
  setText(el['age-hint'], `Untuk remaja ${ageMin} hingga ${ageMax} tahun.`);

  renderRegistrationStatus(stats);
  updateContact(stats);
  updateFormAvailability(stats);
  setText(el['stats-updated'], `Dikemas kini ${formatKlTime(nowDate())}`);
}

async function refreshStats({ silent = false } = {}) {
  if (state.loadingStats) return;
  if (!state.configReady) return;
  state.loadingStats = true;
  try {
    const stats = await apiGet('stats');
    state.statsFailures = 0;
    applyStats(stats);
    if (state.lastRegistration) {
      // Keep the success view's waitlist message accurate without exposing personal data.
      const remaining = Number(stats.bakiSlot) || 0;
      if (state.lastRegistration.status === 'Senarai Tunggu' && remaining > 0) {
        setText(
          el['success-waitlist-note'],
          `Senarai tunggu: kini terdapat ${remaining} slot terbuka. Urus setia akan menghubungi anda untuk pengesahan.`
        );
      }
    }
  } catch (err) {
    state.statsFailures += 1;
    setText(el['stats-updated'], 'Gagal mengemas kini');
    if (!silent && (state.statsFailures === 1 || !state.stats)) {
      showNotice('Maklumat slot tidak dapat dikemas kini. Sila muat semula halaman atau cuba sebentar lagi.', 'danger');
    }
  } finally {
    state.loadingStats = false;
  }
}

function startStatsRefresh() {
  refreshStats({ silent: true });
  setInterval(() => refreshStats({ silent: true }), STATS_REFRESH_MS);
}

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

function controlsFor(name) {
  return qsa(`[name="${name}"]`, el['registration-form']);
}

function setFieldError(name, message) {
  const box = qs(`[data-error-for="${name}"]`);
  setText(box, message);
  controlsFor(name).forEach((control) => {
    if (message) control.setAttribute('aria-invalid', 'true');
    else control.removeAttribute('aria-invalid');
  });
}

function clearFieldError(name) {
  if (!name) return;
  setFieldError(name, '');
}

function clearAllErrors() {
  qsa('[data-error-for]').forEach((node) => setText(node, ''));
  qsa('[aria-invalid="true"]', el['registration-form']).forEach((node) => node.removeAttribute('aria-invalid'));
  show(el['form-error'], false);
  setText(el['form-error'], '');
}

function isValidPhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return /^0\d{8,10}$/.test(digits) || /^60\d{9,10}$/.test(digits);
}

function collectPayload() {
  const form = el['registration-form'];
  const data = new FormData(form);
  return {
    nama_peserta: String(data.get('nama_peserta') || '').trim(),
    umur: Number(data.get('umur')),
    jantina: String(data.get('jantina') || '').trim(),
    tel_penjaga: String(data.get('tel_penjaga') || '').trim(),
    nama_penjaga: String(data.get('nama_penjaga') || '').trim(),
    lancar_quran: String(data.get('lancar_quran') || '').trim(),
    alahan_kesihatan: String(data.get('alahan_kesihatan') || '').trim(),
    persetujuan_data: data.get('persetujuan_data') === 'on',
    website: String(data.get('website') || '').trim()
  };
}

function validatePayload(payload) {
  const errors = {};
  const stats = state.stats || {};
  const ageMin = Number(stats.umurMin) || 10;
  const ageMax = Number(stats.umurMax) || 18;
  const name = payload.nama_peserta;
  const guardian = payload.nama_penjaga;

  if (name.length < 2 || name.length > 80) {
    errors.nama_peserta = 'Sila masukkan nama penuh peserta (2 hingga 80 aksara).';
  }
  if (!Number.isInteger(payload.umur) || payload.umur < ageMin || payload.umur > ageMax) {
    errors.umur = `Sila masukkan umur antara ${ageMin} dan ${ageMax} tahun.`;
  }
  if (payload.jantina !== 'Lelaki' && payload.jantina !== 'Perempuan') {
    errors.jantina = 'Sila pilih jantina peserta.';
  }
  if (!isValidPhone(payload.tel_penjaga)) {
    errors.tel_penjaga = 'Sila masukkan no. telefon penjaga yang sah, contoh 012-3456789.';
  }
  if (guardian.length < 2 || guardian.length > 80) {
    errors.nama_penjaga = 'Sila masukkan nama penjaga (2 hingga 80 aksara).';
  }
  if (payload.lancar_quran === 'tidak') {
    errors.lancar_quran = 'Program ini memerlukan peserta yang lancar membaca Al-Quran.';
  } else if (payload.lancar_quran !== 'ya') {
    errors.lancar_quran = 'Sila sahkan bahawa peserta lancar membaca Al-Quran.';
  }
  if (payload.alahan_kesihatan.length > 300) {
    errors.alahan_kesihatan = 'Catatan alahan terlalu panjang (maksimum 300 aksara).';
  }
  if (!payload.persetujuan_data) {
    errors.persetujuan_data = 'Sila tandakan persetujuan penggunaan data untuk pengurusan program.';
  }
  return errors;
}

function showValidationErrors(errors) {
  Object.entries(errors).forEach(([name, message]) => setFieldError(name, message));
  const first = Object.keys(errors)[0];
  if (first) {
    const control = controlsFor(first)[0];
    if (control) {
      control.focus({ preventScroll: true });
      control.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}

/* ------------------------------------------------------------------ */
/* Success screen and receipt                                          */
/* ------------------------------------------------------------------ */

function buildPaymentInstructions(response) {
  const text = String(response.mesejBayaran || '').trim();
  if (text) return text;
  return 'Sila hubungi urus setia masjid untuk arahan bayaran. Jumlah yuran: ' + formatRM(response.yuran_rm, 0) + '.';
}

function showSuccess(response, payload) {
  state.lastRegistration = response;
  state.lastPayload = payload;

  setText(el['success-id'], response.id);
  setText(el['success-name'], payload.nama_peserta);
  setText(el['success-guardian'], payload.nama_penjaga);
  setText(el['success-fee'], formatRM(response.yuran_rm, 0));
  setText(el['success-datetime'], formatKlDateTime(nowDate()));

  const statusBox = el['success-status'];
  clear(statusBox);
  statusBox.append(badge(response.status, statusVariant(response.status)));

  show(el['success-waitlist-note'], response.status === 'Senarai Tunggu');
  if (response.status === 'Senarai Tunggu') {
    setText(
      el['success-waitlist-note'],
      'Senarai tunggu: kapasiti 40 peserta telah penuh. Pendaftaran anda direkodkan dalam senarai tunggu. Urus setia akan menghubungi jika ada slot terbuka.'
    );
  }

  const paymentBox = el['success-payment'];
  clear(paymentBox);
  paymentBox.append(document.createTextNode(buildPaymentInstructions(response)));

  const number = normalizeWhatsAppNumber(response.whatsapp);
  const link = el['success-whatsapp'];
  if (number) {
    const message = [
      'Assalamualaikum, saya ingin menghantar bukti bayaran KSQ 2026.',
      `Nama peserta: ${payload.nama_peserta}`,
      `No. rujukan: ${response.id}`,
      `Jumlah: ${formatRM(response.yuran_rm, 0)}`
    ].join('\n');
    link.href = whatsappLink(number, message);
    show(link, true);
    setText(el['success-whatsapp-note'], 'Butang di atas akan membuka WhatsApp urus setia dengan mesej siap. Sila lampirkan gambar bukti bayaran.');
  } else {
    link.removeAttribute('href');
    show(link, false);
    setText(el['success-whatsapp-note'], 'Nombor WhatsApp urus setia belum ditetapkan. Sila hubungi urus setia masjid untuk menghantar bukti bayaran.');
  }

  show(el['registration-form-wrap'], false);
  show(el['success-screen'], true);
  hideNotice();
  el['success-screen'].focus({ preventScroll: true });
  el['success-screen'].scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Clear the form only after the values are safely stored for the success view.
  el['registration-form'].reset();
  clearAllErrors();
  setFormEnabled(true);
  refreshStats({ silent: true });
}

function resetToForm() {
  state.lastRegistration = null;
  state.lastPayload = null;
  show(el['success-screen'], false);
  show(el['registration-form-wrap'], true);
  hideNotice();
  clearAllErrors();
  if (state.stats) updateFormAvailability(state.stats);
  else setFormEnabled(true);
  const first = qs('#nama_peserta');
  if (first) {
    first.focus({ preventScroll: true });
    first.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function ensureReceipt() {
  let receipt = document.getElementById('receipt-print');
  if (receipt) return receipt;
  receipt = h('div', { id: 'receipt-print', class: 'receipt-print' });
  document.body.append(receipt);
  return receipt;
}

function receiptRow(label, value) {
  return h('tr', {},
    h('th', { text: label }),
    h('td', { text: value })
  );
}

function printReceipt() {
  if (!state.lastRegistration || !state.lastPayload) return;
  const response = state.lastRegistration;
  const payload = state.lastPayload;
  const receipt = ensureReceipt();
  clear(receipt);

  receipt.append(
    h('div', { class: 'receipt-brand' },
      h('img', { src: 'assets/logo.png', alt: 'Logo Masjid Kampung Sungai Lang Baru' }),
      h('div', {},
        h('h1', { text: 'Kem Sahabat Quran 2026' }),
        h('p', { text: 'Masjid Kampung Sungai Lang Baru, Banting, Selangor' }),
        h('p', { text: '14–16 Disember 2026 · Program harian' })
      )
    ),
    h('h2', { text: 'Rekod Pendaftaran Peserta' }),
    h('table', {},
      h('tbody', {},
        receiptRow('No. rujukan', response.id),
        receiptRow('Status', response.status),
        receiptRow('Nama peserta', payload.nama_peserta),
        receiptRow('Umur', String(payload.umur)),
        receiptRow('Jantina', payload.jantina),
        receiptRow('Penjaga', payload.nama_penjaga),
        receiptRow('No. telefon penjaga', payload.tel_penjaga),
        receiptRow('Yuran', formatRM(response.yuran_rm, 0)),
        receiptRow('Masa pendaftaran', formatKlDateTime(nowDate()))
      )
    ),
    h('h3', { text: 'Arahan bayaran' }),
    h('p', { class: 'receipt-note', text: buildPaymentInstructions(response) }),
    h('p', { class: 'receipt-note', text: 'Simpan rekod ini. Dokumen ini ialah rekod pendaftaran yang dijana oleh sistem, bukan resit bayaran rasmi. Pengesahan slot dibuat selepas bayaran disemak oleh urus setia.' })
  );

  document.body.classList.add('receipt-mode');
  const cleanup = () => {
    document.body.classList.remove('receipt-mode');
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);
  window.print();
  // Safari sometimes does not fire afterprint; keep a fallback.
  setTimeout(() => document.body.classList.remove('receipt-mode'), 1500);
}

/* ------------------------------------------------------------------ */
/* Form submit                                                         */
/* ------------------------------------------------------------------ */

async function handleSubmit(event) {
  event.preventDefault();
  if (state.submitting) return;
  if (!state.configReady) {
    showNotice('Pendaftaran online belum dibuka. Sila hubungi urus setia masjid untuk mendaftar.', 'warning');
    return;
  }

  clearAllErrors();
  const payload = collectPayload();
  const errors = validatePayload(payload);
  if (Object.keys(errors).length) {
    showValidationErrors(errors);
    return;
  }

  state.submitting = true;
  setBusy(el['submit-button'], true, 'Menghantar pendaftaran…');
  try {
    const response = await apiPost('register', payload);
    showSuccess(response, payload);
  } catch (err) {
    const message = err && err.message ? err.message : 'Pendaftaran tidak berjaya. Sila cuba lagi.';
    const box = el['form-error'];
    setText(box, message);
    show(box, true);
    if (err && (err.code === 'CLOSED' || err.code === 'EXTERNAL_SOURCE')) {
      showNotice(message, 'warning');
      setFormEnabled(false, err.code === 'CLOSED' ? 'Pendaftaran ditutup' : 'Pendaftaran melalui urus setia');
    }
    refreshStats({ silent: true });
    toast(message, 'error', 7000);
  } finally {
    state.submitting = false;
    setBusy(el['submit-button'], false);
    if (state.stats && state.stats.pendaftaranDibuka === false) {
      setFormEnabled(false, 'Pendaftaran ditutup');
    }
  }
}

/* ------------------------------------------------------------------ */
/* Boot                                                                */
/* ------------------------------------------------------------------ */

function wireEvents() {
  const form = el['registration-form'];
  form.addEventListener('submit', handleSubmit);
  form.addEventListener('input', (event) => clearFieldError(event.target.name));
  form.addEventListener('change', (event) => clearFieldError(event.target.name));

  el['register-another'].addEventListener('click', resetToForm);
  el['print-receipt'].addEventListener('click', printReceipt);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    tick();
    refreshStats({ silent: true });
  });

  window.addEventListener('online', () => refreshStats({ silent: true }));
  window.addEventListener('offline', () => {
    toast('Sambungan internet terputus. Data mungkin tidak terkini.', 'warning', 6000);
  });
}

function boot() {
  cacheElements();
  if (!el['registration-form']) return;

  state.configReady = isApiConfigured();
  wireEvents();
  tick();
  setInterval(tick, 1000);

  if (!state.configReady) {
    showNotice('Pendaftaran online belum dibuka. Sila hubungi urus setia masjid untuk mendaftar.', 'warning');
    setFormEnabled(false, 'Pendaftaran belum dibuka');
    setText(el['stats-updated'], 'Menunggu sambungan sistem');
    console.warn('[KSQ] API_URL is not configured in web/config.js. Registration is disabled.');
    return;
  }

  startStatsRefresh();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
