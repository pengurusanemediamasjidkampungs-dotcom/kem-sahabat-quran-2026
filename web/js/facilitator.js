/**
 * KSQ 2026 facilitator page.
 * Limited access: confirmed participants and attendance only. No finance data.
 * All dynamic user text is rendered with DOM nodes/textContent, never innerHTML.
 */

import { apiPost, isApiConfigured } from './api.js';
import {
  formatKlDateTime,
  formatKlTime,
  klDateKey,
  nowDate
} from './time.js';
import {
  badge,
  clear,
  debounce,
  emptyState,
  h,
  setBusy,
  setText,
  show,
  toast
} from './ui.js';

const TOKEN_KEY = 'ksq_facilitator_token';
const DAY_LABELS = { 1: 'Hari 1', 2: 'Hari 2', 3: 'Hari 3' };

const state = {
  token: '',
  participants: [],
  attendance: [],
  day: 1,
  search: '',
  filter: '',
  loaded: false
};

const el = {};

function cacheElements() {
  const ids = [
    'login-screen', 'login-form', 'login-error', 'login-submit', 'token-input', 'toggle-token',
    'app', 'logout-button', 'role-badge',
    'fac-count', 'fac-updated', 'fac-refresh', 'fac-day1', 'fac-day2', 'fac-day3',
    'fac-search', 'fac-day', 'fac-filter', 'fac-day-heading', 'fac-table-body'
  ];
  ids.forEach((id) => { el[id] = document.getElementById(id); });
}

function showLogin(message = '') {
  show(el['app'], false);
  show(el['login-screen'], true);
  setText(el['login-error'], message);
  show(el['login-error'], Boolean(message));
  if (el['token-input']) {
    el['token-input'].value = '';
    setTimeout(() => el['token-input'].focus(), 50);
  }
}

async function verifyToken(token) {
  return apiPost('facilitator.participants', {}, token);
}

async function handleLogin(event) {
  event.preventDefault();
  const token = String(el['token-input'].value || '').trim();
  if (!token) {
    setText(el['login-error'], 'Sila masukkan token fasilitator.');
    show(el['login-error'], true);
    return;
  }
  setBusy(el['login-submit'], true, 'Menyemak token…');
  show(el['login-error'], false);
  try {
    const data = await verifyToken(token);
    state.token = token;
    state.participants = Array.isArray(data.participants) ? data.participants : [];
    sessionStorage.setItem(TOKEN_KEY, token);
    show(el['login-screen'], false);
    show(el['app'], true);
    await loadAttendance();
    state.loaded = true;
    render();
  } catch (err) {
    setText(el['login-error'], err && err.message ? err.message : 'Token tidak diterima.');
    show(el['login-error'], true);
  } finally {
    setBusy(el['login-submit'], false);
  }
}

function handleLogout() {
  sessionStorage.removeItem(TOKEN_KEY);
  state.token = '';
  state.participants = [];
  state.attendance = [];
  state.loaded = false;
  showLogin('');
}

async function call(action, payload = {}) {
  try {
    return await apiPost(action, payload, state.token);
  } catch (err) {
    if (err && err.code === 'UNAUTHORIZED') {
      toast('Sesi tamat atau token tidak sah. Sila log masuk semula.', 'error', 7000);
      handleLogout();
    }
    throw err;
  }
}

function reportError(err, fallback = 'Ralat tidak diketahui.') {
  toast(err && err.message ? err.message : fallback, 'error', 7000);
}

async function loadParticipants() {
  const data = await call('facilitator.participants');
  state.participants = Array.isArray(data.participants) ? data.participants : [];
}

async function loadAttendance() {
  const data = await call('attendance.list');
  state.attendance = Array.isArray(data.attendance) ? data.attendance : [];
}

function attendanceMap() {
  const map = {};
  state.attendance.forEach((row) => { map[String(row.id_peserta)] = row; });
  return map;
}

function recordFor(id) {
  return attendanceMap()[String(id)] || {};
}

function dayValue(id, day = state.day) {
  const record = recordFor(id);
  return record[`hari${day}`] || '';
}

function filteredParticipants() {
  const term = state.search.trim().toLowerCase();
  return state.participants.filter((row) => {
    if (term) {
      const haystack = `${row.id} ${row.nama_peserta} ${row.nama_penjaga}`.toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    const value = dayValue(row.id);
    if (state.filter === 'belum' && value) return false;
    if (state.filter === 'hadir' && value !== 'Hadir') return false;
    if (state.filter === 'tidak' && value !== 'Tidak') return false;
    return true;
  });
}

function countDay(day) {
  const map = attendanceMap();
  return state.participants.filter((row) => {
    const record = map[String(row.id)];
    return record && record[`hari${day}`] === 'Hadir';
  }).length;
}

function renderCounts() {
  setText(el['fac-day1'], countDay(1));
  setText(el['fac-day2'], countDay(2));
  setText(el['fac-day3'], countDay(3));
  setText(el['fac-updated'], `Dikemas kini ${formatKlTime(nowDate())}`);
  setText(el['fac-day-heading'], DAY_LABELS[state.day]);
}

function attendanceBadge(value) {
  if (value === 'Hadir') return badge('Hadir', 'success');
  if (value === 'Tidak') return badge('Tidak hadir', 'danger');
  return badge('Belum ditanda', 'muted');
}

function makeChoice(participant, value, label, tone) {
  const active = value === label;
  return h('button', {
    class: `attendance-choice${active ? ' is-active' : ''}${tone ? ' is-' + tone : ''}`,
    type: 'button',
    text: label,
    attrs: {
      'aria-pressed': active ? 'true' : 'false',
      'aria-label': `${label} ${participant.nama_peserta} ${DAY_LABELS[state.day]}`
    },
    on: {
      click: () => {
        if (active) return;
        markAttendance(participant, label === 'Hadir');
      }
    }
  });
}

function render() {
  renderCounts();
  const rows = filteredParticipants();
  setText(
    el['fac-count'],
    `${rows.length} daripada ${state.participants.length} peserta dipaparkan · ${DAY_LABELS[state.day]}`
  );

  const tbody = el['fac-table-body'];
  clear(tbody);

  if (!rows.length) {
    tbody.append(h('tr', {}, h('td', { colspan: '5' },
      emptyState(
        state.participants.length ? 'Tiada peserta sepadan.' : 'Belum ada peserta Disahkan.',
        state.participants.length
          ? 'Cuba ubah carian atau tapis status hari.'
          : 'Pentadbir perlu mengesahkan pendaftaran terlebih dahulu.'
      )
    )));
    return;
  }

  rows.forEach((participant) => {
    const value = dayValue(participant.id);
    const allergy = participant.alahan_kesihatan && participant.alahan_kesihatan !== 'Tiada'
      ? h('span', { class: 'allergy', text: participant.alahan_kesihatan })
      : h('span', { class: 'muted', text: 'Tiada' });

    tbody.append(h('tr', {},
      h('td', {}, h('span', { class: 'cell-title', text: participant.id })),
      h('td', {},
        h('span', { class: 'cell-title', text: participant.nama_peserta }),
        h('span', { class: 'cell-sub', text: `${participant.umur} tahun · ${participant.jantina}` })
      ),
      h('td', {},
        h('span', { class: 'cell-title', text: participant.nama_penjaga }),
        h('span', { class: 'cell-sub', text: participant.tel_penjaga || '—' })
      ),
      h('td', {}, allergy),
      h('td', {},
        h('div', { class: 'attendance-controls' },
          makeChoice(participant, value, 'Hadir', 'hadir'),
          makeChoice(participant, value, 'Tidak', 'tidak'),
          attendanceBadge(value)
        ),
        participant.catatan
          ? h('span', { class: 'cell-sub', text: participant.catatan })
          : null
      )
    ));
  });
}

async function markAttendance(participant, hadir) {
  const day = state.day;
  try {
    await call('attendance.mark', { id_peserta: participant.id, hari: day, hadir });
    let record = state.attendance.find((row) => String(row.id_peserta) === String(participant.id));
    if (!record) {
      record = { id_peserta: participant.id, hari1: '', hari2: '', hari3: '', catatan: '' };
      state.attendance.push(record);
    }
    record[`hari${day}`] = hadir ? 'Hadir' : 'Tidak';
    render();
    toast(
      `${participant.nama_peserta} · ${DAY_LABELS[day]} ditanda ${hadir ? 'Hadir' : 'Tidak hadir'}.`,
      'success',
      2500
    );
  } catch (err) {
    reportError(err, 'Kehadiran tidak dapat direkod.');
    render();
  }
}

async function refreshAll() {
  setBusy(el['fac-refresh'], true, 'Memuat…');
  try {
    await Promise.all([loadParticipants(), loadAttendance()]);
    render();
    toast('Senarai peserta dikemas kini.', 'success', 2500);
  } catch (err) {
    reportError(err, 'Senarai tidak dapat dimuatkan.');
  } finally {
    setBusy(el['fac-refresh'], false);
  }
}

function wireEvents() {
  el['login-form'].addEventListener('submit', handleLogin);
  el['logout-button'].addEventListener('click', handleLogout);
  el['toggle-token'].addEventListener('click', () => {
    const input = el['token-input'];
    const showing = input.type === 'text';
    input.type = showing ? 'password' : 'text';
    el['toggle-token'].textContent = showing ? 'Tunjuk' : 'Sembunyi';
  });

  el['fac-refresh'].addEventListener('click', refreshAll);
  el['fac-day'].addEventListener('change', () => {
    state.day = Number(el['fac-day'].value);
    render();
  });
  el['fac-filter'].addEventListener('change', () => {
    state.filter = el['fac-filter'].value;
    render();
  });
  el['fac-search'].addEventListener('input', debounce(() => {
    state.search = String(el['fac-search'].value || '');
    render();
  }, 160));
}

function setDayHint() {
  const todayKey = klDateKey(nowDate());
  const start = new Date('2026-12-14T00:00:00+08:00').getTime();
  const today = new Date(todayKey + 'T00:00:00+08:00').getTime();
  const diff = Math.round((today - start) / 86400000);
  if (diff >= 0 && diff <= 2) {
    state.day = diff + 1;
    el['fac-day'].value = String(state.day);
  }
  setText(el['fac-updated'], `Tarikh hari ini ${formatKlDateTime(nowDate())}`);
}

async function boot() {
  cacheElements();
  wireEvents();
  setDayHint();

  if (!isApiConfigured()) {
    setText(el['login-error'], 'API belum disambungkan. Isi API_URL dalam web/config.js dengan URL /exec Apps Script.');
    show(el['login-error'], true);
    el['login-submit'].disabled = true;
    return;
  }

  const saved = sessionStorage.getItem(TOKEN_KEY);
  if (!saved) {
    showLogin('');
    return;
  }

  state.token = saved;
  setBusy(el['login-submit'], true, 'Menyemak sesi…');
  try {
    const data = await verifyToken(saved);
    state.participants = Array.isArray(data.participants) ? data.participants : [];
    await loadAttendance();
    state.loaded = true;
    show(el['login-screen'], false);
    show(el['app'], true);
    render();
  } catch (err) {
    sessionStorage.removeItem(TOKEN_KEY);
    state.token = '';
    showLogin(err && err.code === 'UNAUTHORIZED' ? 'Sesi tamat. Sila log masuk semula.' : '');
  } finally {
    setBusy(el['login-submit'], false);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
