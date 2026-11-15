/**
 * KSQ 2026 admin dashboard.
 * All dynamic user text is rendered with DOM nodes/textContent, never innerHTML.
 */

import { apiGet, apiPost, isApiConfigured } from './api.js';
import {
  countdownParts,
  csvEscape,
  daysBetweenKeys,
  daysUntil,
  formatKl,
  formatKlDateShort,
  formatKlDateTime,
  formatKlTime,
  formatRM,
  fromKlInputValue,
  klDateKey,
  nowDate,
  parseDate,
  programPhase,
  taskTemporalStatus,
  toKlInputValue,
  whatsappLink
} from './time.js';
import {
  badge,
  clear,
  confirmAction,
  copyText,
  debounce,
  downloadText,
  emptyState,
  h,
  openFormDialog,
  qs,
  qsa,
  setBusy,
  setProgress,
  setText,
  show,
  statusVariant,
  toast
} from './ui.js';

const TOKEN_KEY = 'ksq_admin_token';
const DEFAULT_START = '2026-12-14T08:00:00+08:00';
const DEFAULT_END = '2026-12-16T17:00:00+08:00';
const DEFAULT_CLOSE = '2026-12-07T23:59:00+08:00';

const STATUS_REG = ['Disahkan', 'Menunggu', 'Senarai Tunggu', 'Batal'];
const STATUS_PAY = ['Belum', 'Sudah', 'Dikecualikan'];
const STATUS_TASK = ['Belum', 'Sedang', 'Selesai'];
const STATUS_MILESTONE = ['Belum', 'Selesai'];
const CATEGORIES = [
  'Pendaftaran', 'Destinasi', 'Logistik', 'Kandungan',
  'Kewangan', 'Promosi', 'Hari Program', 'Selepas program'
];

const state = {
  token: '',
  view: 'dashboard',
  stats: null,
  statsError: false,
  settings: null,
  settingsMeta: null,
  registrations: [],
  tasks: [],
  milestones: [],
  budget: [],
  attendance: [],
  dbInfo: null,
  loaded: { registrations: false, tasks: false, milestones: false, budget: false, attendance: false },
  messageTemplate: 'sah',
  messageTarget: 'filtered',
  tickTimer: null,
  statsTimer: null
};

const el = {};

function cacheElements() {
  const ids = [
    'login-screen', 'login-form', 'login-error', 'login-submit', 'token-input', 'toggle-token',
    'app', 'app-nav', 'logout-button', 'role-badge',
    'dash-refresh', 'dash-updated', 'dash-alerts', 'dash-program-value', 'dash-program-foot',
    'dash-close-value', 'dash-close-foot', 'dash-baki', 'dash-slot-foot', 'dash-collected',
    'dash-collected-foot', 'dash-source-badge', 'dash-baki-big', 'dash-capacity',
    'dash-slot-progress', 'dash-slot-progress-meta', 'dash-slot-percent',
    'dash-count-disahkan', 'dash-count-menunggu', 'dash-count-tunggu',
    'dash-bar-disahkan', 'dash-bar-menunggu', 'dash-bar-tunggu', 'dash-rate',
    'dash-finance-target', 'dash-finance-collected', 'dash-finance-pending',
    'dash-finance-budget', 'dash-finance-actual', 'dash-finance-gap',
    'dash-actions', 'dash-next-milestone', 'dash-checklist-overall', 'dash-checklist-bars',
    'reg-count', 'reg-add', 'reg-export', 'reg-copy-phones', 'reg-whatsapp', 'reg-refresh',
    'reg-search', 'reg-filter-status', 'reg-filter-payment', 'reg-filter-method', 'reg-reset',
    'reg-table-body',
    'task-add', 'task-refresh', 'task-search', 'task-filter-category', 'task-filter-status',
    'task-summary', 'task-list',
    'milestone-add', 'milestone-refresh', 'milestone-timeline',
    'budget-add', 'budget-refresh', 'budget-summary', 'budget-groups',
    'attendance-refresh', 'attendance-updated', 'attendance-day1', 'attendance-day2',
    'attendance-day3', 'attendance-search', 'attendance-table-body',
    'data-refresh', 'data-setup', 'data-seed', 'data-backup', 'data-info', 'data-updated',
    'data-checks', 'data-sheets', 'data-result',
    'settings-form', 'settings-test', 'settings-save', 'settings-token-admin',
    'settings-token-facilitator',
    'message-dialog', 'message-close', 'message-close-2', 'message-template', 'message-target',
    'message-output', 'message-note', 'message-copy'
  ];
  ids.forEach((id) => { el[id] = document.getElementById(id); });
}

/* ------------------------------------------------------------------ */
/* Auth and API                                                        */
/* ------------------------------------------------------------------ */

function showLogin(message = '') {
  show(el['app'], false);
  show(el['login-screen'], true);
  setText(el['login-error'], message);
  show(el['login-error'], Boolean(message));
  const input = el['token-input'];
  if (input) {
    input.value = '';
    setTimeout(() => input.focus(), 50);
  }
}

async function verifyToken(token) {
  return apiPost('settings.get', {}, token);
}

async function handleLogin(event) {
  event.preventDefault();
  const token = String(el['token-input'].value || '').trim();
  if (!token) {
    setText(el['login-error'], 'Sila masukkan token pentadbir.');
    show(el['login-error'], true);
    return;
  }
  setBusy(el['login-submit'], true, 'Menyemak token…');
  show(el['login-error'], false);
  try {
    const data = await verifyToken(token);
    state.token = token;
    sessionStorage.setItem(TOKEN_KEY, token);
    applySettingsData(data);
    show(el['login-screen'], false);
    show(el['app'], true);
    await initializeApp();
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
  state.stats = null;
  state.settings = null;
  state.registrations = [];
  state.tasks = [];
  state.milestones = [];
  state.budget = [];
  state.attendance = [];
  state.dbInfo = null;
  state.loaded = { registrations: false, tasks: false, milestones: false, budget: false, attendance: false };
  if (state.tickTimer) clearInterval(state.tickTimer);
  if (state.statsTimer) clearInterval(state.statsTimer);
  state.tickTimer = null;
  state.statsTimer = null;
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
  const message = err && err.message ? err.message : fallback;
  toast(message, 'error', 7000);
  return message;
}

/* ------------------------------------------------------------------ */
/* Data loaders                                                        */
/* ------------------------------------------------------------------ */

async function loadStats() {
  try {
    state.stats = await apiGet('stats');
    state.statsError = false;
  } catch (err) {
    state.statsError = true;
  }
  return state.stats;
}

async function loadSettings() {
  try {
    const data = await call('settings.get');
    applySettingsData(data);
  } catch (err) {
    reportError(err, 'Tetapan tidak dapat dimuatkan.');
  }
}

async function loadRegistrations() {
  const data = await call('list');
  state.registrations = Array.isArray(data.registrations) ? data.registrations : [];
  state.loaded.registrations = true;
  return state.registrations;
}

async function loadTasks() {
  const data = await call('tasks.list');
  state.tasks = Array.isArray(data.tasks) ? data.tasks : [];
  state.loaded.tasks = true;
  return state.tasks;
}

async function loadMilestones() {
  const data = await call('milestones.list');
  state.milestones = Array.isArray(data.milestones) ? data.milestones : [];
  state.loaded.milestones = true;
  return state.milestones;
}

async function loadBudget() {
  const data = await call('budget.list');
  state.budget = Array.isArray(data.budget) ? data.budget : [];
  state.loaded.budget = true;
  return state.budget;
}

async function loadAttendance() {
  const data = await call('attendance.list');
  state.attendance = Array.isArray(data.attendance) ? data.attendance : [];
  state.loaded.attendance = true;
  return state.attendance;
}

async function loadCoreData({ silent = false } = {}) {
  const results = await Promise.allSettled([
    loadRegistrations(),
    loadTasks(),
    loadMilestones(),
    loadBudget(),
    loadAttendance()
  ]);
  if (!silent) {
    const failed = results.find((result) => result.status === 'rejected');
    if (failed) reportError(failed.reason, 'Sebahagian data tidak dapat dimuatkan.');
  }
  renderCurrentView();
}

async function loadDbInfo() {
  try {
    state.dbInfo = await call('db.info');
    renderData();
  } catch (err) {
    reportError(err, 'Maklumat pangkalan data tidak dapat dimuatkan.');
  }
}

async function initializeApp() {
  el['role-badge'].textContent = 'Pentadbir';
  await Promise.allSettled([loadStats(), loadCoreData({ silent: true })]);
  renderCurrentView();
  tickDashboard();
  if (state.tickTimer) clearInterval(state.tickTimer);
  if (state.statsTimer) clearInterval(state.statsTimer);
  state.tickTimer = setInterval(() => {
    if (state.token && state.view === 'dashboard') tickDashboard();
  }, 1000);
  state.statsTimer = setInterval(async () => {
    if (!state.token || state.view !== 'dashboard') return;
    await loadStats();
    renderDashboard();
  }, 30000);
}

/* ------------------------------------------------------------------ */
/* Shared helpers                                                      */
/* ------------------------------------------------------------------ */

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function money(value) {
  return formatRM(number(value), 0);
}

function compactCountdown(ms) {
  const parts = countdownParts(ms);
  const clock = [parts.hours, parts.minutes, parts.seconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
  return parts.days > 0 ? `${parts.days} hari ${clock}` : clock;
}

function activeCounts() {
  const regs = state.registrations;
  const disahkan = regs.filter((r) => r.status === 'Disahkan').length;
  const menunggu = regs.filter((r) => r.status === 'Menunggu').length;
  const tunggu = regs.filter((r) => r.status === 'Senarai Tunggu').length;
  const capacity = number(state.settings && state.settings.kapasiti, 40) || 40;
  return {
    disahkan,
    menunggu,
    tunggu,
    capacity,
    used: disahkan + menunggu,
    baki: Math.max(0, capacity - disahkan - menunggu)
  };
}

function dashboardCounts() {
  if (state.stats) {
    return {
      disahkan: number(state.stats.disahkan),
      menunggu: number(state.stats.menunggu),
      tunggu: number(state.stats.senaraiTunggu),
      capacity: number(state.stats.kapasiti, 40) || 40,
      used: number(state.stats.disahkan) + number(state.stats.menunggu),
      baki: Math.max(0, number(state.stats.bakiSlot))
    };
  }
  return activeCounts();
}

function programDates() {
  const settings = state.settings || {};
  const stats = state.stats || {};
  return {
    start: parseDate(settings.tarikh_mula || stats.tarikhMula || DEFAULT_START),
    end: parseDate(settings.tarikh_tamat || stats.tarikhTamat || DEFAULT_END),
    close: parseDate(settings.tarikh_tutup_daftar || stats.tarikhTutup || DEFAULT_CLOSE)
  };
}

function isRegistrationOpen() {
  if (state.stats) return Boolean(state.stats.pendaftaranDibuka);
  if (state.settings) return String(state.settings.pendaftaran_dibuka) === 'true';
  return true;
}

function sourceLabel() {
  if (state.stats && state.stats.sumber === 'sheet_luar') return 'Sheet luar';
  if (state.settings && state.settings.sumber_pendaftaran === 'sheet_luar') return 'Sheet luar';
  return 'Sistem KSQ';
}

function emptyLine(message, hint = '') {
  return h('div', { class: 'muted-box', text: hint ? `${message} ${hint}` : message });
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

function tickDashboard() {
  if (!state.token) return;
  const { start, end, close } = programDates();
  const now = nowDate();

  if (start && now.getTime() < start.getTime()) {
    setText(el['dash-program-value'], compactCountdown(start.getTime() - now.getTime()));
    setText(
      el['dash-program-foot'],
      `${formatKl(start, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · ${formatKlTime(start)}`
    );
  } else if (start && end && now.getTime() <= end.getTime()) {
    const phase = programPhase(start, end, now);
    setText(el['dash-program-value'], `Hari ${phase.day} / 3`);
    setText(el['dash-program-foot'], `Program berakhir dalam ${compactCountdown(end.getTime() - now.getTime())}`);
  } else {
    setText(el['dash-program-value'], 'Program tamat');
    setText(el['dash-program-foot'], end ? `Tamat ${formatKlDateTime(end)}` : 'Tarikh tamat belum ditetapkan.');
  }

  if (isRegistrationOpen() && close && now.getTime() < close.getTime()) {
    setText(el['dash-close-value'], compactCountdown(close.getTime() - now.getTime()));
    setText(el['dash-close-foot'], formatKlDateTime(close));
  } else {
    setText(el['dash-close-value'], 'Ditutup');
    setText(el['dash-close-foot'], close ? `Tarikh akhir ${formatKlDateTime(close)}` : 'Pendaftaran ditutup.');
  }
}

function renderDashboard() {
  const counts = dashboardCounts();
  const regs = state.registrations;
  const capacity = Math.max(1, counts.capacity);
  const used = counts.used;
  const percent = Math.min(100, Math.round((used / capacity) * 100));

  setText(el['dash-baki'], counts.baki);
  setText(el['dash-baki-big'], counts.baki);
  setText(el['dash-capacity'], capacity);
  setProgress(el['dash-slot-progress'], percent);
  setText(el['dash-slot-percent'], `${percent}%`);
  setText(
    el['dash-slot-progress-meta'],
    `${used} slot digunakan · ${counts.disahkan} disahkan · ${counts.menunggu} menunggu`
  );
  setText(el['dash-count-disahkan'], counts.disahkan);
  setText(el['dash-count-menunggu'], counts.menunggu);
  setText(el['dash-count-tunggu'], counts.tunggu);
  setProgress(el['dash-bar-disahkan'], (counts.disahkan / capacity) * 100);
  setProgress(el['dash-bar-menunggu'], (counts.menunggu / capacity) * 100);
  setProgress(el['dash-bar-tunggu'], (counts.tunggu / capacity) * 100);
  setText(el['dash-slot-foot'], `${counts.disahkan} disahkan · ${counts.menunggu} menunggu · ${counts.tunggu} senarai tunggu`);

  const sourceBadge = el['dash-source-badge'];
  clear(sourceBadge);
  sourceBadge.append(badge(sourceLabel(), sourceLabel() === 'Sheet luar' ? 'info' : 'neutral'));
  setText(el['dash-rate'], registrationRateText());

  const targetFee = regs
    .filter((r) => r.status === 'Disahkan')
    .reduce((sum, r) => sum + number(r.yuran_rm), 0);
  const collected = regs
    .filter((r) => r.status !== 'Batal' && r.status_bayaran === 'Sudah')
    .reduce((sum, r) => sum + number(r.yuran_rm), 0);
  const pending = Math.max(0, targetFee - collected);
  const budgetEstimate = state.budget.reduce((sum, row) => sum + number(row.anggaran_rm), 0);
  const budgetActual = state.budget.reduce((sum, row) => sum + number(row.sebenar_rm), 0);

  setText(el['dash-collected'], money(collected));
  const targetPct = targetFee > 0 ? Math.round((collected / targetFee) * 100) : 0;
  setText(el['dash-collected-foot'], `Sasaran ${money(targetFee)} · ${targetPct}% kutipan`);
  setText(el['dash-finance-target'], money(targetFee));
  setText(el['dash-finance-collected'], money(collected));
  setText(el['dash-finance-pending'], money(pending));
  setText(el['dash-finance-budget'], money(budgetEstimate));
  setText(el['dash-finance-actual'], money(budgetActual));
  const gap = collected - budgetEstimate;
  setText(el['dash-finance-gap'], money(gap));

  renderDashboardAlerts();
  renderDashboardActions();
  renderNextMilestone();
  renderDashboardChecklist();
  setText(el['dash-updated'], `Dikemas kini ${formatKlTime(nowDate())}`);
}

function registrationRateText() {
  const regs = state.registrations
    .filter((r) => r.status !== 'Batal' && r.masa_daftar)
    .slice()
    .sort((a, b) => String(a.masa_daftar).localeCompare(String(b.masa_daftar)));
  if (!regs.length) return 'Belum ada pendaftaran. Sebar pautan pendaftaran untuk mula mengumpul peserta.';

  const firstKey = klDateKey(regs[0].masa_daftar);
  const todayKey = klDateKey(nowDate());
  const days = Math.max(1, daysBetweenKeys(firstKey, todayKey) + 1);
  const average = regs.length / days;
  const counts = dashboardCounts();

  if (counts.baki <= 0) {
    return `Slot penuh. ${regs.length} pendaftaran direkod sejak ${formatKlDateShort(regs[0].masa_daftar)}.`;
  }
  if (average < 0.05) {
    return `${regs.length} pendaftaran sejak ${formatKlDateShort(regs[0].masa_daftar)}. Kadar belum mencukupi untuk unjuran.`;
  }
  const daysToFull = Math.ceil(counts.baki / average);
  const projection = new Date(nowDate().getTime() + daysToFull * 86400000);
  return `Purata ${average.toFixed(1)} pendaftaran/hari sejak ${formatKlDateShort(regs[0].masa_daftar)}. Pada kadar ini, slot penuh sekitar ${formatKlDateShort(projection)}.`;
}

function renderDashboardAlerts() {
  const box = el['dash-alerts'];
  clear(box);
  const alerts = [];
  const todayKey = klDateKey(nowDate());

  const overdue = state.tasks.filter((task) => taskTemporalStatus(task.deadline, task.status) === 'Lewat');
  if (overdue.length) {
    alerts.push({ variant: 'danger', text: `${overdue.length} tugasan lewat. Sila semak Checklist.` });
  }

  const today = state.tasks.filter((task) => taskTemporalStatus(task.deadline, task.status) === 'Hari ini');
  if (today.length) {
    alerts.push({ variant: '', text: `${today.length} tugasan perlu disiapkan hari ini.` });
  }

  const counts = dashboardCounts();
  if (counts.baki > 0 && counts.baki < 10) {
    alerts.push({ variant: '', text: `Baki slot tinggal ${counts.baki}. Tingkatkan promosi atau buka senarai tunggu.` });
  }

  const unpaidOld = state.registrations.filter((r) => {
    if (!['Disahkan', 'Menunggu'].includes(r.status) || r.status_bayaran !== 'Belum') return false;
    const key = klDateKey(r.masa_daftar);
    return key && daysBetweenKeys(key, todayKey) > 3;
  });
  if (unpaidOld.length) {
    alerts.push({ variant: 'danger', text: `${unpaidOld.length} peserta belum bayar melebihi 3 hari.` });
  }

  const start = programDates().start;
  const daysToProgram = start ? daysBetweenKeys(todayKey, klDateKey(start)) : 999;
  const destinationsOpen = state.tasks.filter(
    (task) => task.kategori === 'Destinasi' && task.status !== 'Selesai'
  );
  if (destinationsOpen.length && daysToProgram <= 14 && daysToProgram >= 0) {
    alerts.push({ variant: '', text: `${destinationsOpen.length} tugasan destinasi belum selesai walaupun program kurang ${Math.max(1, daysToProgram)} hari lagi.` });
  }

  const overdueMilestones = state.milestones.filter(
    (m) => m.status !== 'Selesai' && m.tarikh && klDateKey(m.tarikh) < todayKey
  );
  if (overdueMilestones.length) {
    alerts.push({ variant: 'danger', text: `${overdueMilestones.length} milestone belum selesai dan tarikhnya telah berlalu.` });
  }

  if (!alerts.length) {
    box.append(h('div', { class: 'alert alert-success' },
      h('span', { class: 'alert-icon', text: '✓' }),
      h('div', { text: 'Tiada amaran kritikal. Teruskan pemantauan.' })
    ));
    return;
  }
  alerts.slice(0, 6).forEach((item) => {
    box.append(h('div', { class: `alert${item.variant ? ' alert-' + item.variant : ''}` },
      h('span', { class: 'alert-icon', text: item.variant === 'danger' ? '!' : '•' }),
      h('div', { text: item.text })
    ));
  });
}

function renderDashboardActions() {
  const box = el['dash-actions'];
  clear(box);
  const todayKey = klDateKey(nowDate());
  const upcoming = state.tasks
    .filter((task) => {
      if (task.status === 'Selesai') return false;
      const temporal = taskTemporalStatus(task.deadline, task.status);
      if (temporal === 'Lewat' || temporal === 'Hari ini') return true;
      const deadlineKey = klDateKey(task.deadline);
      const diff = daysBetweenKeys(todayKey, deadlineKey);
      return diff >= 0 && diff <= 7;
    })
    .sort((a, b) => String(a.deadline).localeCompare(String(b.deadline)))
    .slice(0, 8);

  if (!upcoming.length) {
    box.append(emptyLine('Tiada tugasan mendesak dalam 7 hari akan datang.'));
    return;
  }

  upcoming.forEach((task) => {
    const temporal = taskTemporalStatus(task.deadline, task.status);
    box.append(h('div', { class: 'action-item' },
      h('div', { class: 'action-item-main' },
        h('b', { text: task.tugasan }),
        h('span', { text: `${task.kategori} · ${task.pic || 'PIC belum ditetapkan'} · ${formatKlDateShort(task.deadline)}` })
      ),
      h('div', { class: 'row' },
        badge(temporal, statusVariant(temporal)),
        h('button', {
          class: 'btn btn-sm btn-ghost',
          type: 'button',
          text: 'Lihat',
          on: { click: () => switchView('checklist') }
        })
      )
    ));
  });
}

function renderNextMilestone() {
  const box = el['dash-next-milestone'];
  clear(box);
  const todayKey = klDateKey(nowDate());
  const next = state.milestones
    .filter((m) => m.status !== 'Selesai' && m.tarikh && klDateKey(m.tarikh) >= todayKey)
    .sort((a, b) => String(a.tarikh).localeCompare(String(b.tarikh)))[0];

  if (!next) {
    box.append(emptyLine('Tiada milestone akan datang. Semak senarai milestone.'));
    return;
  }
  const diff = daysBetweenKeys(todayKey, klDateKey(next.tarikh));
  box.append(h('div', { class: 'stack' },
    h('span', { class: 'timeline-date', text: formatKl(next.tarikh, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) }),
    h('b', { class: 'card-title', text: next.tajuk, attrs: { style: 'font-family: var(--font-display); color: var(--forest); font-size: 1.05rem;' } }),
    next.penerangan ? h('p', { class: 'muted small', text: next.penerangan }) : null,
    h('div', { class: 'row' },
      badge(diff === 0 ? 'Hari ini' : `${diff} hari lagi`, diff === 0 ? 'gold' : 'warning'),
      h('button', {
        class: 'btn btn-sm btn-ghost',
        type: 'button',
        text: 'Buka milestone',
        on: { click: () => switchView('milestones') }
      })
    )
  ));
}

function renderDashboardChecklist() {
  const total = state.tasks.length;
  const done = state.tasks.filter((task) => task.status === 'Selesai').length;
  const percent = total ? Math.round((done / total) * 100) : 0;
  setText(el['dash-checklist-overall'], `${percent}% selesai · ${done} daripada ${total} tugasan`);

  const box = el['dash-checklist-bars'];
  clear(box);
  CATEGORIES.forEach((category) => {
    const items = state.tasks.filter((task) => task.kategori === category);
    if (!items.length) return;
    const finished = items.filter((task) => task.status === 'Selesai').length;
    const pct = Math.round((finished / items.length) * 100);
    box.append(h('div', { class: 'progress-row' },
      h('div', { class: 'progress-row-head' },
        h('b', { text: category }),
        h('span', { text: `${finished}/${items.length} · ${pct}%` })
      ),
      h('div', { class: 'progress thin' }, h('span', { props: { style: `width:${pct}%` } }))
    ));
  });

  if (!total) {
    box.append(emptyLine('Belum ada tugasan. Tambah tugasan dalam Checklist.'));
  }
}

/* ------------------------------------------------------------------ */
/* Registrations                                                       */
/* ------------------------------------------------------------------ */

function filteredRegistrations() {
  const search = String(el['reg-search'].value || '').trim().toLowerCase();
  const status = el['reg-filter-status'].value;
  const payment = el['reg-filter-payment'].value;
  const method = el['reg-filter-method'].value;
  return state.registrations.filter((row) => {
    if (status && row.status !== status) return false;
    if (payment && row.status_bayaran !== payment) return false;
    if (method && row.kaedah_daftar !== method) return false;
    if (!search) return true;
    const haystack = [
      row.id, row.nama_peserta, row.nama_penjaga, row.tel_penjaga, row.catatan
    ].join(' ').toLowerCase();
    return haystack.includes(search);
  });
}

function renderRegistrations() {
  const rows = filteredRegistrations();
  const total = state.registrations.length;
  const active = state.registrations.filter((r) => ['Disahkan', 'Menunggu'].includes(r.status)).length;
  setText(el['reg-count'], `${rows.length} daripada ${total} pendaftaran dipaparkan · ${active} peserta aktif`);

  const tbody = el['reg-table-body'];
  clear(tbody);
  if (!rows.length) {
    tbody.append(h('tr', {}, h('td', { colspan: '8' }, emptyState('Tiada pendaftaran sepadan.', 'Cuba ubah carian atau tapis semula.'))));
    return;
  }

  rows
    .slice()
    .sort((a, b) => String(b.masa_daftar).localeCompare(String(a.masa_daftar)))
    .forEach((row) => {
      const statusSelect = h('select', { class: 'select-inline', attrs: { 'aria-label': `Status ${row.nama_peserta}` } });
      STATUS_REG.forEach((value) => statusSelect.append(h('option', { value, text: value })));
      statusSelect.value = row.status;
      statusSelect.dataset.current = row.status;
      statusSelect.addEventListener('change', () => {
        updateRegistrationInline(row.id, { status: statusSelect.value }, statusSelect);
      });

      const paymentSelect = h('select', { class: 'select-inline', attrs: { 'aria-label': `Bayaran ${row.nama_peserta}` } });
      STATUS_PAY.forEach((value) => paymentSelect.append(h('option', { value, text: value })));
      paymentSelect.value = row.status_bayaran || 'Belum';
      paymentSelect.dataset.current = row.status_bayaran || 'Belum';
      paymentSelect.addEventListener('change', () => {
        updateRegistrationInline(row.id, { status_bayaran: paymentSelect.value }, paymentSelect);
      });

      const phoneLink = whatsappLink(
        row.tel_penjaga,
        messageFor('sah', row)
      );

      const actions = h('div', { class: 'table-actions' },
        h('button', {
          class: 'btn btn-sm btn-ghost',
          type: 'button',
          text: 'Edit',
          on: { click: () => openEditRegistration(row) }
        }),
        phoneLink
          ? h('a', { class: 'btn btn-sm btn-ghost', href: phoneLink, target: '_blank', rel: 'noopener', text: 'WA' })
          : h('span', { class: 'badge badge-muted', text: 'Tiada WA' })
      );

      tbody.append(h('tr', {},
        h('td', {},
          h('span', { class: 'cell-title', text: row.id }),
          h('span', { class: 'cell-sub', text: row.masa_daftar ? formatKlDateTime(row.masa_daftar) : '—' })
        ),
        h('td', {},
          h('span', { class: 'cell-title', text: row.nama_peserta }),
          h('span', { class: 'cell-sub', text: `${row.umur} tahun · ${row.jantina}` })
        ),
        h('td', {},
          h('span', { class: 'cell-title', text: row.nama_penjaga }),
          h('span', { class: 'cell-sub', text: row.tel_penjaga })
        ),
        h('td', {}, badge(row.kaedah_daftar === 'online' ? 'Online' : 'Manual', row.kaedah_daftar === 'online' ? 'info' : 'neutral')),
        h('td', { class: 'cell-amount', text: money(row.yuran_rm) }),
        h('td', {}, paymentSelect),
        h('td', {}, statusSelect),
        h('td', {}, actions)
      ));
    });
}

async function updateRegistrationInline(id, patch, select) {
  const previous = select.dataset.current;
  select.disabled = true;
  try {
    await call('updateRegistration', { id, ...patch });
    select.dataset.current = select.value;
    toast('Perubahan disimpan.', 'success', 2500);
    await loadRegistrations();
    renderRegistrations();
    renderDashboard();
  } catch (err) {
    select.value = previous;
    reportError(err, 'Perubahan tidak dapat disimpan.');
  } finally {
    select.disabled = false;
  }
}

function openManualRegistration() {
  const settings = state.settings || {};
  openFormDialog({
    title: 'Tambah pendaftaran manual',
    description: 'Yuran manual RM120 mengikut tetapan semasa. Slot disemak di pelayan.',
    submitLabel: 'Tambah peserta',
    fields: [
      { name: 'nama_peserta', label: 'Nama penuh peserta', required: true, full: true },
      { name: 'umur', label: 'Umur', type: 'number', min: number(settings.umur_min, 10), max: number(settings.umur_max, 18), required: true },
      { name: 'jantina', label: 'Jantina', type: 'select', options: ['Lelaki', 'Perempuan'], placeholder: 'Pilih…', required: true },
      { name: 'nama_penjaga', label: 'Nama penjaga', required: true },
      { name: 'tel_penjaga', label: 'No. telefon penjaga', type: 'tel', placeholder: '012-3456789', required: true },
      { name: 'status', label: 'Status pendaftaran', type: 'select', options: ['Disahkan', 'Menunggu', 'Senarai Tunggu'], required: true },
      { name: 'status_bayaran', label: 'Status bayaran', type: 'select', options: STATUS_PAY, required: true },
      { name: 'rujukan_bayaran', label: 'Rujukan bayaran', placeholder: 'Pilihan' },
      { name: 'alahan_kesihatan', label: 'Alahan / kesihatan', type: 'textarea', full: true, placeholder: 'Tulis “Tiada” jika tiada.' },
      { name: 'catatan', label: 'Catatan urus setia', type: 'textarea', full: true }
    ],
    values: { status: 'Disahkan', status_bayaran: 'Belum', umur: number(settings.umur_min, 10) },
    onSubmit: async (values) => {
      const created = await call('registration.createManual', {
        ...values,
        lancar_quran: 'ya',
        persetujuan_data: true
      });
      toast(`Pendaftaran ${created.id} ditambah.`, 'success');
      await loadRegistrations();
      renderRegistrations();
      renderDashboard();
    }
  });
}

function openEditRegistration(row) {
  openFormDialog({
    title: `Edit ${row.nama_peserta}`,
    description: `${row.id} · ${row.tel_penjaga}`,
    submitLabel: 'Simpan perubahan',
    fields: [
      { name: 'status', label: 'Status pendaftaran', type: 'select', options: STATUS_REG, required: true },
      { name: 'status_bayaran', label: 'Status bayaran', type: 'select', options: STATUS_PAY, required: true },
      { name: 'rujukan_bayaran', label: 'Rujukan bayaran', full: true },
      { name: 'catatan', label: 'Catatan urus setia', type: 'textarea', full: true, rows: 4 }
    ],
    values: {
      status: row.status,
      status_bayaran: row.status_bayaran,
      rujukan_bayaran: row.rujukan_bayaran || '',
      catatan: row.catatan || ''
    },
    onSubmit: async (values) => {
      await call('updateRegistration', { id: row.id, ...values });
      toast('Pendaftaran dikemas kini.', 'success');
      await loadRegistrations();
      renderRegistrations();
      renderDashboard();
    }
  });
}

function exportRegistrationsCsv() {
  const rows = filteredRegistrations();
  if (!rows.length) {
    toast('Tiada data untuk dieksport.', 'warning');
    return;
  }
  const headers = [
    'id', 'masa_daftar', 'nama_peserta', 'umur', 'jantina', 'nama_penjaga', 'tel_penjaga',
    'alahan_kesihatan', 'kaedah_daftar', 'yuran_rm', 'status_bayaran', 'rujukan_bayaran',
    'status', 'catatan'
  ];
  const lines = [headers.join(',')];
  rows.forEach((row) => {
    lines.push(headers.map((key) => csvEscape(row[key])).join(','));
  });
  const filename = `KSQ26-pendaftaran-${klDateKey(nowDate())}.csv`;
  downloadText(filename, '\uFEFF' + lines.join('\r\n'), 'text/csv;charset=utf-8');
  toast(`${rows.length} baris dieksport.`, 'success');
}

async function copyGuardianPhones() {
  const rows = filteredRegistrations();
  const seen = new Set();
  const numbers = [];
  rows.forEach((row) => {
    const digits = String(row.tel_penjaga || '').replace(/\D/g, '');
    if (!digits || seen.has(digits)) return;
    seen.add(digits);
    numbers.push(String(row.tel_penjaga || digits));
  });
  if (!numbers.length) {
    toast('Tiada nombor telefon untuk disalin.', 'warning');
    return;
  }
  const ok = await copyText(numbers.join('\n'));
  toast(ok ? `${numbers.length} nombor disalin.` : 'Nombor tidak dapat disalin.', ok ? 'success' : 'error');
}

/* ------------------------------------------------------------------ */
/* WhatsApp messages                                                   */
/* ------------------------------------------------------------------ */

function messageFor(type, row) {
  const fee = money(row.yuran_rm);
  const name = row.nama_peserta;
  const guardian = row.nama_penjaga;
  const id = row.id;
  if (type === 'bayar') {
    return `Assalamualaikum ${guardian}, peringatan bayaran yuran Kem Sahabat Quran 2026 untuk ${name} (${id}) berjumlah ${fee}. Sila hantar bukti bayaran kepada urus setia. Terima kasih.`;
  }
  if (type === 'taklimat') {
    return `Assalamualaikum ${guardian}, taklimat Hari 3 (lawatan Shah Alam) untuk ${name} akan dimaklumkan oleh urus setia. Peserta perlu membawa Al-Quran, botol air, ubat peribadi (jika ada), memakai pakaian sopan dan kasut yang selesa. Sila pastikan borang kebenaran ibu bapa diserahkan sebelum program. Terima kasih.`;
  }
  return `Assalamualaikum ${guardian}, pendaftaran ${name} untuk Kem Sahabat Quran 2026 telah diterima. No. rujukan: ${id}. Status: ${row.status}. Yuran: ${fee}. Sila jelaskan bayaran dan hantar bukti kepada urus setia. Terima kasih.`;
}

function messageRecipients() {
  let rows = filteredRegistrations();
  const target = el['message-target'].value;
  if (target !== 'filtered') {
    if (target === 'Belum') rows = rows.filter((row) => row.status_bayaran === 'Belum');
    else rows = rows.filter((row) => row.status === target);
  }
  return rows;
}

function updateMessagePreview() {
  const rows = messageRecipients();
  const type = el['message-template'].value;
  const blocks = rows.map((row) => {
    const phone = row.tel_penjaga || '[TIADA NOMBOR]';
    return `Untuk: ${row.nama_penjaga} (${phone})\n${messageFor(type, row)}`;
  });
  el['message-output'].value = blocks.length
    ? blocks.join('\n\n---\n\n')
    : 'Tiada penerima sepadan.';
  setText(
    el['message-note'],
    `${blocks.length} penerima. Salin mesej dan hantar melalui WhatsApp; sistem tidak menghantar secara automatik.`
  );
}

function openMessageDialog() {
  el['message-template'].value = state.messageTemplate;
  el['message-target'].value = state.messageTarget;
  updateMessagePreview();
  el['message-dialog'].showModal();
}

async function copyMessages() {
  const text = el['message-output'].value;
  if (!text || text === 'Tiada penerima sepadan.') {
    toast('Tiada mesej untuk disalin.', 'warning');
    return;
  }
  const ok = await copyText(text);
  toast(ok ? 'Mesej disalin.' : 'Mesej tidak dapat disalin.', ok ? 'success' : 'error');
}

/* ------------------------------------------------------------------ */
/* Checklist                                                           */
/* ------------------------------------------------------------------ */

function filteredTasks() {
  const search = String(el['task-search'].value || '').trim().toLowerCase();
  const category = el['task-filter-category'].value;
  const filter = el['task-filter-status'].value;
  const todayKey = klDateKey(nowDate());

  return state.tasks.filter((task) => {
    if (category && task.kategori !== category) return false;
    if (search) {
      const haystack = [task.tugasan, task.pic, task.catatan, task.kategori].join(' ').toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    const temporal = taskTemporalStatus(task.deadline, task.status);
    if (filter === 'open' && task.status === 'Selesai') return false;
    if (filter === 'done' && task.status !== 'Selesai') return false;
    if (filter === 'overdue' && temporal !== 'Lewat') return false;
    if (filter === 'today' && temporal !== 'Hari ini') return false;
    if (filter === 'week') {
      if (task.status === 'Selesai') return false;
      const diff = daysBetweenKeys(todayKey, klDateKey(task.deadline));
      if (!(diff >= 0 && diff <= 7)) return false;
    }
    return true;
  });
}

function renderChecklist() {
  const rows = filteredTasks();
  const total = state.tasks.length;
  const done = state.tasks.filter((task) => task.status === 'Selesai').length;
  const overdue = state.tasks.filter((task) => taskTemporalStatus(task.deadline, task.status) === 'Lewat').length;
  const today = state.tasks.filter((task) => taskTemporalStatus(task.deadline, task.status) === 'Hari ini').length;

  const summary = el['task-summary'];
  clear(summary);
  summary.append(
    badge(`${total} tugasan`, 'neutral'),
    badge(`${done} selesai`, 'success'),
    badge(`${overdue} lewat`, overdue ? 'danger' : 'muted'),
    badge(`${today} hari ini`, today ? 'gold' : 'muted')
  );

  const list = el['task-list'];
  clear(list);
  if (!rows.length) {
    list.append(emptyState('Tiada tugasan sepadan.', 'Tukar tapis atau tambah tugasan baharu.'));
    return;
  }

  rows
    .slice()
    .sort((a, b) => {
      const doneA = a.status === 'Selesai' ? 1 : 0;
      const doneB = b.status === 'Selesai' ? 1 : 0;
      if (doneA !== doneB) return doneA - doneB;
      return String(a.deadline).localeCompare(String(b.deadline));
    })
    .forEach((task) => {
      const temporal = taskTemporalStatus(task.deadline, task.status);
      const rowClass = temporal === 'Selesai' ? 'is-done'
        : temporal === 'Lewat' ? 'is-overdue'
          : temporal === 'Hari ini' ? 'is-today'
            : 'is-upcoming';

      const checkbox = h('input', {
        type: 'checkbox',
        attrs: { 'aria-label': `Tandakan selesai: ${task.tugasan}` }
      });
      checkbox.checked = task.status === 'Selesai';
      checkbox.addEventListener('change', () => toggleTask(task, checkbox));

      const row = h('div', { class: `task-row ${rowClass}` },
        h('div', { class: 'task-check' }, checkbox),
        h('div', { class: 'task-main' },
          h('b', { text: task.tugasan }),
          h('div', { class: 'task-meta' },
            h('span', { class: 'task-category', text: task.kategori }),
            h('span', { text: `PIC: ${task.pic || '—'}` }),
            h('span', { text: `Tarikh akhir: ${formatKlDateTime(task.deadline)}` }),
            task.catatan ? h('span', { text: task.catatan }) : null
          )
        ),
        h('div', { class: 'task-side' },
          badge(temporal, statusVariant(temporal)),
          h('button', {
            class: 'btn btn-sm btn-ghost',
            type: 'button',
            text: 'Edit',
            on: { click: () => openTaskDialog(task) }
          }),
          h('button', {
            class: 'btn btn-sm btn-danger',
            type: 'button',
            text: 'Padam',
            on: { click: () => deleteTask(task) }
          })
        )
      );
      list.append(row);
    });
}

async function toggleTask(task, checkbox) {
  checkbox.disabled = true;
  const nextStatus = checkbox.checked ? 'Selesai' : 'Belum';
  try {
    await call('tasks.upsert', { task: { ...task, status: nextStatus } });
    await loadTasks();
    renderChecklist();
    renderDashboard();
  } catch (err) {
    checkbox.checked = !checkbox.checked;
    reportError(err, 'Status tugasan tidak dapat dikemas kini.');
  } finally {
    checkbox.disabled = false;
  }
}

function openTaskDialog(task = null) {
  openFormDialog({
    title: task ? 'Edit tugasan' : 'Tambah tugasan',
    description: task ? task.id : 'Tugasan baharu akan diberi ID automatik.',
    submitLabel: task ? 'Simpan' : 'Tambah',
    fields: [
      { name: 'kategori', label: 'Kategori', type: 'select', options: CATEGORIES, required: true },
      { name: 'status', label: 'Status', type: 'select', options: STATUS_TASK, required: true },
      { name: 'tugasan', label: 'Tugasan', required: true, full: true },
      { name: 'pic', label: 'PIC / jawatan', placeholder: 'Contoh: Bendahari' },
      { name: 'deadline', label: 'Tarikh akhir', type: 'datetime-local', required: true },
      { name: 'catatan', label: 'Catatan', type: 'textarea', full: true, rows: 3 }
    ],
    values: task
      ? {
          kategori: task.kategori,
          status: task.status,
          tugasan: task.tugasan,
          pic: task.pic || '',
          deadline: toKlInputValue(task.deadline),
          catatan: task.catatan || ''
        }
      : { kategori: 'Pendaftaran', status: 'Belum', deadline: toKlInputValue(nowDate()) },
    onSubmit: async (values) => {
      await call('tasks.upsert', {
        task: {
          ...values,
          id: task ? task.id : undefined,
          deadline: fromKlInputValue(values.deadline)
        }
      });
      toast(task ? 'Tugasan dikemas kini.' : 'Tugasan ditambah.', 'success');
      await loadTasks();
      renderChecklist();
      renderDashboard();
    }
  });
}

async function deleteTask(task) {
  if (!confirmAction(`Padam tugasan “${task.tugasan}”? Tindakan ini tidak boleh dibatalkan.`)) return;
  try {
    await call('tasks.delete', { id: task.id });
    toast('Tugasan dipadam.', 'success');
    await loadTasks();
    renderChecklist();
    renderDashboard();
  } catch (err) {
    reportError(err, 'Tugasan tidak dapat dipadam.');
  }
}

/* ------------------------------------------------------------------ */
/* Milestones                                                          */
/* ------------------------------------------------------------------ */

function renderMilestones() {
  const box = el['milestone-timeline'];
  clear(box);
  if (!state.milestones.length) {
    box.append(emptyState('Belum ada milestone.', 'Tambah milestone untuk membina garis masa program.'));
    return;
  }

  const todayKey = klDateKey(nowDate());
  const sorted = state.milestones.slice().sort((a, b) => String(a.tarikh).localeCompare(String(b.tarikh)));
  let markerInserted = false;

  sorted.forEach((milestone) => {
    const key = klDateKey(milestone.tarikh);
    const date = parseDate(milestone.tarikh);
    const isToday = key === todayKey;
    const isPast = key < todayKey;
    const isDone = milestone.status === 'Selesai';

    if (!markerInserted && key > todayKey) {
      box.append(h('div', { class: 'timeline-now' }, h('span', { text: 'Kita di sini — hari ini' })));
      markerInserted = true;
    }

    let daysLabel = '';
    if (isDone) daysLabel = 'Selesai';
    else if (isToday) daysLabel = 'Hari ini';
    else if (isPast) daysLabel = `${Math.abs(daysBetweenKeys(todayKey, key))} hari lepas`;
    else daysLabel = `${daysBetweenKeys(todayKey, key)} hari lagi`;

    const item = h('div', { class: `timeline-item${isDone || isPast ? ' is-past' : isToday ? ' is-today' : ' is-future'}` },
      h('span', { class: 'timeline-dot' }),
      h('span', { class: 'timeline-date', text: date ? formatKl(date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : milestone.tarikh }),
      h('h3', { text: milestone.tajuk }),
      milestone.penerangan ? h('p', { text: milestone.penerangan }) : null,
      h('div', { class: 'row' },
        badge(daysLabel, isDone ? 'success' : isToday ? 'gold' : isPast ? 'danger' : 'neutral'),
        milestone.status !== 'Selesai' && !isPast
          ? h('button', {
              class: 'btn btn-sm btn-ghost',
              type: 'button',
              text: 'Tandakan selesai',
              on: { click: () => completeMilestone(milestone) }
            })
          : null,
        h('button', {
          class: 'btn btn-sm btn-ghost',
          type: 'button',
          text: 'Edit',
          on: { click: () => openMilestoneDialog(milestone) }
        }),
        h('button', {
          class: 'btn btn-sm btn-danger',
          type: 'button',
          text: 'Padam',
          on: { click: () => deleteMilestone(milestone) }
        })
      )
    );
    box.append(item);
  });

  if (!markerInserted) {
    box.append(h('div', { class: 'timeline-now' }, h('span', { text: 'Semua milestone telah berlalu — hari ini' })));
  }
}

function openMilestoneDialog(milestone = null) {
  openFormDialog({
    title: milestone ? 'Edit milestone' : 'Tambah milestone',
    description: milestone ? milestone.id : 'Milestone baharu akan diberi ID automatik.',
    submitLabel: milestone ? 'Simpan' : 'Tambah',
    fields: [
      { name: 'tajuk', label: 'Tajuk milestone', required: true, full: true },
      { name: 'tarikh', label: 'Tarikh', type: 'date', required: true },
      { name: 'status', label: 'Status', type: 'select', options: STATUS_MILESTONE, required: true },
      { name: 'penerangan', label: 'Penerangan', type: 'textarea', full: true, rows: 3 }
    ],
    values: milestone
      ? {
          tajuk: milestone.tajuk,
          tarikh: klDateKey(milestone.tarikh),
          status: milestone.status,
          penerangan: milestone.penerangan || ''
        }
      : { tarikh: klDateKey(nowDate()), status: 'Belum' },
    onSubmit: async (values) => {
      await call('milestones.upsert', {
        milestone: { ...values, id: milestone ? milestone.id : undefined }
      });
      toast(milestone ? 'Milestone dikemas kini.' : 'Milestone ditambah.', 'success');
      await loadMilestones();
      renderMilestones();
      renderDashboard();
    }
  });
}

async function completeMilestone(milestone) {
  try {
    await call('milestones.upsert', { milestone: { ...milestone, status: 'Selesai' } });
    await loadMilestones();
    renderMilestones();
    renderDashboard();
    toast('Milestone ditandakan selesai.', 'success');
  } catch (err) {
    reportError(err, 'Milestone tidak dapat dikemas kini.');
  }
}

async function deleteMilestone(milestone) {
  if (!confirmAction(`Padam milestone “${milestone.tajuk}”?`)) return;
  try {
    await call('milestones.delete', { id: milestone.id });
    await loadMilestones();
    renderMilestones();
    renderDashboard();
    toast('Milestone dipadam.', 'success');
  } catch (err) {
    reportError(err, 'Milestone tidak dapat dipadam.');
  }
}

/* ------------------------------------------------------------------ */
/* Budget                                                              */
/* ------------------------------------------------------------------ */

function renderBudget() {
  const totalEstimate = state.budget.reduce((sum, row) => sum + number(row.anggaran_rm), 0);
  const totalActual = state.budget.reduce((sum, row) => sum + number(row.sebenar_rm), 0);
  const remaining = totalEstimate - totalActual;

  const summary = el['budget-summary'];
  clear(summary);
  summary.append(
    h('div', { class: 'kpi kpi-gold' },
      h('div', { class: 'kpi-label', text: 'Jumlah anggaran' }),
      h('div', { class: 'kpi-value', text: money(totalEstimate) })
    ),
    h('div', { class: 'kpi' },
      h('div', { class: 'kpi-label', text: 'Perbelanjaan sebenar' }),
      h('div', { class: 'kpi-value', text: money(totalActual) })
    ),
    h('div', { class: `kpi ${remaining < 0 ? 'kpi-red' : ''}` },
      h('div', { class: 'kpi-label', text: 'Baki anggaran' }),
      h('div', { class: 'kpi-value', text: money(remaining) })
    ),
    h('div', { class: 'kpi kpi-blue' },
      h('div', { class: 'kpi-label', text: 'Bilangan item' }),
      h('div', { class: 'kpi-value', text: state.budget.length })
    )
  );

  const container = el['budget-groups'];
  clear(container);
  if (!state.budget.length) {
    container.append(emptyState('Belum ada item bajet.', 'Tambah item atau muat data awal dari tab Data.'));
    return;
  }

  const groups = {};
  state.budget.forEach((row) => {
    const category = String(row.kategori || 'Lain-lain');
    if (!groups[category]) groups[category] = [];
    groups[category].push(row);
  });

  Object.keys(groups).sort((a, b) => a.localeCompare(b, 'ms')).forEach((category) => {
    const rows = groups[category];
    const estimate = rows.reduce((sum, row) => sum + number(row.anggaran_rm), 0);
    const actual = rows.reduce((sum, row) => sum + number(row.sebenar_rm), 0);

    const table = h('table', { class: 'data-table' },
      h('thead', {}, h('tr', {},
        h('th', { text: 'Item' }),
        h('th', { class: 'cell-amount', text: 'Anggaran' }),
        h('th', { class: 'cell-amount', text: 'Sebenar' }),
        h('th', { class: 'cell-amount', text: 'Baki' }),
        h('th', { text: 'Catatan' }),
        h('th', { text: 'Tindakan' })
      )),
      h('tbody', {}, rows.map((row) => h('tr', {},
        h('td', {}, h('span', { class: 'cell-title', text: row.item }), h('span', { class: 'cell-sub', text: row.id })),
        h('td', { class: 'cell-amount', text: money(row.anggaran_rm) }),
        h('td', { class: 'cell-amount', text: money(row.sebenar_rm) }),
        h('td', { class: 'cell-amount', text: money(number(row.anggaran_rm) - number(row.sebenar_rm)) }),
        h('td', { text: row.catatan || '—' }),
        h('td', {}, h('div', { class: 'table-actions' },
          h('button', {
            class: 'btn btn-sm btn-ghost',
            type: 'button',
            text: 'Edit',
            on: { click: () => openBudgetDialog(row) }
          }),
          h('button', {
            class: 'btn btn-sm btn-danger',
            type: 'button',
            text: 'Padam',
            on: { click: () => deleteBudget(row) }
          })
        ))
      )))
    );

    const details = h('details', { class: 'budget-group', open: true },
      h('summary', {},
        h('span', { text: `${category} · ${rows.length} item` }),
        h('span', { text: `${money(estimate)} / ${money(actual)}` })
      ),
      h('div', { class: 'table-wrap' }, table)
    );
    container.append(details);
  });
}

function openBudgetDialog(item = null) {
  openFormDialog({
    title: item ? 'Edit item bajet' : 'Tambah item bajet',
    description: item ? item.id : 'Item baharu akan diberi ID automatik.',
    submitLabel: item ? 'Simpan' : 'Tambah',
    fields: [
      { name: 'item', label: 'Nama item', required: true, full: true },
      { name: 'kategori', label: 'Kategori', required: true, placeholder: 'Contoh: Pengangkutan' },
      { name: 'anggaran_rm', label: 'Anggaran (RM)', type: 'number', min: 0, step: 0.01, required: true },
      { name: 'sebenar_rm', label: 'Sebenar (RM)', type: 'number', min: 0, step: 0.01 },
      { name: 'catatan', label: 'Catatan', type: 'textarea', full: true, rows: 3 }
    ],
    values: item
      ? {
          item: item.item,
          kategori: item.kategori,
          anggaran_rm: number(item.anggaran_rm),
          sebenar_rm: number(item.sebenar_rm),
          catatan: item.catatan || ''
        }
      : { kategori: 'Lain-lain', anggaran_rm: 0, sebenar_rm: 0 },
    onSubmit: async (values) => {
      await call('budget.upsert', {
        budget: { ...values, id: item ? item.id : undefined }
      });
      toast(item ? 'Item bajet dikemas kini.' : 'Item bajet ditambah.', 'success');
      await loadBudget();
      renderBudget();
      renderDashboard();
    }
  });
}

async function deleteBudget(item) {
  if (!confirmAction(`Padam item bajet “${item.item}”?`)) return;
  try {
    await call('budget.delete', { id: item.id });
    await loadBudget();
    renderBudget();
    renderDashboard();
    toast('Item bajet dipadam.', 'success');
  } catch (err) {
    reportError(err, 'Item bajet tidak dapat dipadam.');
  }
}

/* ------------------------------------------------------------------ */
/* Attendance                                                          */
/* ------------------------------------------------------------------ */

function attendanceMap() {
  const map = {};
  state.attendance.forEach((row) => {
    map[String(row.id_peserta)] = row;
  });
  return map;
}

function renderAttendance() {
  const search = String(el['attendance-search'].value || '').trim().toLowerCase();
  const participants = state.registrations
    .filter((row) => row.status === 'Disahkan')
    .filter((row) => !search || `${row.id} ${row.nama_peserta}`.toLowerCase().includes(search))
    .sort((a, b) => String(a.nama_peserta).localeCompare(String(b.nama_peserta), 'ms'));

  const map = attendanceMap();
  const allConfirmed = state.registrations.filter((row) => row.status === 'Disahkan');
  const countDay = (day) => allConfirmed.filter((row) => {
    const record = map[String(row.id)];
    return record && record[`hari${day}`] === 'Hadir';
  }).length;
  setText(el['attendance-day1'], countDay(1));
  setText(el['attendance-day2'], countDay(2));
  setText(el['attendance-day3'], countDay(3));
  setText(el['attendance-updated'], `Dikemas kini ${formatKlTime(nowDate())}`);

  const tbody = el['attendance-table-body'];
  clear(tbody);
  if (!participants.length) {
    tbody.append(h('tr', {}, h('td', { colspan: '7' }, emptyState('Tiada peserta Disahkan.', 'Sahkan pendaftaran dalam tab Daftar terlebih dahulu.'))));
    return;
  }

  participants.forEach((participant) => {
    const record = map[String(participant.id)] || {};
    const cells = [1, 2, 3].map((day) => {
      const checkbox = h('input', { type: 'checkbox', attrs: { 'aria-label': `Hari ${day} ${participant.nama_peserta}` } });
      checkbox.checked = record[`hari${day}`] === 'Hadir';
      checkbox.addEventListener('change', () => markAttendance(participant.id, day, checkbox));
      return h('td', {}, checkbox);
    });

    tbody.append(h('tr', {},
      h('td', {}, h('span', { class: 'cell-title', text: participant.id })),
      h('td', {},
        h('span', { class: 'cell-title', text: participant.nama_peserta }),
        h('span', { class: 'cell-sub', text: `${participant.umur} tahun · ${participant.jantina}` })
      ),
      h('td', {},
        h('span', { text: participant.nama_penjaga }),
        h('span', { class: 'cell-sub', text: participant.tel_penjaga })
      ),
      h('td', {}, participant.alahan_kesihatan
        ? h('span', { class: 'allergy', text: participant.alahan_kesihatan })
        : h('span', { class: 'muted', text: 'Tiada' })),
      ...cells
    ));
  });
}

async function markAttendance(id, day, checkbox) {
  checkbox.disabled = true;
  const hadir = checkbox.checked;
  try {
    await call('attendance.mark', { id_peserta: id, hari: day, hadir });
    let record = state.attendance.find((row) => String(row.id_peserta) === String(id));
    if (!record) {
      record = { id_peserta: id, hari1: '', hari2: '', hari3: '', catatan: '' };
      state.attendance.push(record);
    }
    record[`hari${day}`] = hadir ? 'Hadir' : 'Tidak';
    renderAttendance();
  } catch (err) {
    checkbox.checked = !checkbox.checked;
    reportError(err, 'Kehadiran tidak dapat direkod.');
  } finally {
    checkbox.disabled = false;
  }
}

/* ------------------------------------------------------------------ */
/* Data management                                                     */
/* ------------------------------------------------------------------ */

function renderData() {
  const info = state.dbInfo;
  if (!info) {
    setText(el['data-updated'], 'Memuatkan maklumat pangkalan data…');
    return;
  }
  setText(el['data-updated'], `Dikemas kini ${formatKlDateTime(info.dikemaskini)}`);

  const infoBox = el['data-info'];
  clear(infoBox);
  infoBox.append(
    h('div', { class: 'action-item' },
      h('div', { class: 'action-item-main' }, h('b', { text: info.nama }), h('span', { text: 'Nama fail Google Sheets' })),
      h('a', { class: 'btn btn-sm btn-ghost', href: info.url, target: '_blank', rel: 'noopener', text: 'Buka Sheet' })
    ),
    h('div', { class: 'action-item' },
      h('div', { class: 'action-item-main' }, h('b', { text: info.sumber === 'sheet_luar' ? 'Sheet luar' : 'Sistem KSQ' }), h('span', { text: 'Sumber pendaftaran aktif' }))
    )
  );

  const checksBox = el['data-checks'];
  clear(checksBox);
  const checks = info.checks || {};
  const issues = [];
  if ((checks.missingSheets || []).length) issues.push(`Helaian tiada: ${checks.missingSheets.join(', ')}`);
  if ((checks.headerMismatch || []).length) issues.push(`Pengepala tidak sepadan: ${checks.headerMismatch.join(', ')}`);
  const duplicates = Object.entries(checks.duplicateIds || {});
  if (duplicates.length) issues.push(`ID pendaftaran berganda: ${duplicates.map(([id, count]) => `${id} (${count})`).join(', ')}`);
  if (number(checks.attendanceOrphans) > 0) issues.push(`${checks.attendanceOrphans} rekod kehadiran tanpa peserta yang sah.`);

  if (!issues.length) {
    checksBox.append(h('div', { class: 'notice notice-success' }, h('p', { text: 'Tiada isu struktur dikesan. Helaian sepadan dengan skema sistem.' })));
  } else {
    const list = h('div', { class: 'alert-list' });
    issues.forEach((text) => {
      list.append(h('div', { class: 'alert alert-danger' },
        h('span', { class: 'alert-icon', text: '!' }),
        h('div', { text })
      ));
    });
    checksBox.append(list);
  }

  const sheetsBox = el['data-sheets'];
  clear(sheetsBox);
  (info.sheets || []).forEach((sheet) => {
    sheetsBox.append(h('div', { class: 'sheet-card' },
      h('b', { text: sheet.nama }),
      h('span', { text: `${sheet.baris} baris · ${sheet.wujud ? (sheet.headerOk ? 'pengepala OK' : 'pengepala tidak sepadan') : 'tiada'}` }),
      sheet.url ? h('a', { class: 'small', href: sheet.url, target: '_blank', rel: 'noopener', text: 'Buka tab' }) : null
    ));
  });
}

function setDataResult(content) {
  const box = el['data-result'];
  clear(box);
  if (content) box.append(content);
}

async function runDbSetup() {
  if (!confirmAction('Sediakan atau baiki helaian yang tiada? Data sedia ada tidak dipadam.')) return;
  try {
    state.dbInfo = await call('db.setup');
    renderData();
    toast('Helaian disediakan. Semak semakan kesihatan.', 'success');
  } catch (err) {
    reportError(err, 'Helaian tidak dapat disediakan.');
  }
}

async function runDbSeed() {
  if (!confirmAction('Muat data awal ke dalam helaian yang kosong? Helaian yang sudah ada data akan dilangkau.')) return;
  try {
    const result = await call('seed');
    const lines = ['Hasil muat data awal:'];
    Object.entries(result.inserted || {}).forEach(([key, value]) => lines.push(`Dimasukkan ${key}: ${value}`));
    Object.entries(result.skipped || {}).forEach(([key, value]) => lines.push(`Dilangkau ${key}: ${value}`));
    setDataResult(h('pre', { class: 'code-block', text: lines.join('\n') }));
    toast('Data awal diproses. Semak hasil di bawah.', 'success');
    state.dbInfo = await call('db.info');
    renderData();
    await loadTasks();
    await loadMilestones();
    await loadBudget();
    renderCurrentView();
  } catch (err) {
    reportError(err, 'Data awal tidak dapat dimuatkan.');
  }
}

async function runDbBackup() {
  if (!confirmAction('Buat salinan penuh Google Sheets sekarang? Salinan akan disimpan dalam Google Drive.')) return;
  try {
    const result = await call('db.backup');
    setDataResult(h('div', { class: 'notice notice-success' },
      h('p', {}, h('strong', { text: 'Sandaran dibuat: ' }), result.nama),
      h('p', {}, h('a', { href: result.url, target: '_blank', rel: 'noopener', text: 'Buka fail sandaran di Google Drive' }))
    ));
    toast('Sandaran berjaya dibuat.', 'success');
  } catch (err) {
    reportError(err, 'Sandaran tidak dapat dibuat.');
  }
}

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

function applySettingsData(data) {
  if (!data) return;
  state.settings = data.settings || null;
  state.settingsMeta = data;
  fillSettingsForm();
  const tokens = data.tokens || {};
  const adminBadge = el['settings-token-admin'];
  const facilitatorBadge = el['settings-token-facilitator'];
  if (adminBadge) {
    clear(adminBadge);
    adminBadge.append(badge(tokens.admin ? 'Ditetapkan' : 'Tiada', tokens.admin ? 'success' : 'danger'));
  }
  if (facilitatorBadge) {
    clear(facilitatorBadge);
    facilitatorBadge.append(badge(tokens.fasilitator ? 'Ditetapkan' : 'Tiada', tokens.fasilitator ? 'success' : 'muted'));
  }
}

function fillSettingsForm() {
  const form = el['settings-form'];
  if (!form || !state.settings) return;
  const settings = state.settings;
  const setValue = (name, value) => {
    const field = form.elements[name];
    if (!field) return;
    if (field.type === 'checkbox') field.checked = String(value) === 'true' || value === true;
    else field.value = value === undefined || value === null ? '' : String(value);
  };

  setValue('kapasiti', settings.kapasiti);
  setValue('yuran_asal', settings.yuran_asal);
  setValue('yuran_promo', settings.yuran_promo);
  setValue('diskaun_online', settings.diskaun_online);
  setValue('umur_min', settings.umur_min);
  setValue('umur_max', settings.umur_max);
  setValue('pendaftaran_dibuka', settings.pendaftaran_dibuka);
  setValue('tarikh_mula', toKlInputValue(settings.tarikh_mula));
  setValue('tarikh_tamat', toKlInputValue(settings.tarikh_tamat));
  setValue('tarikh_tutup_daftar', toKlInputValue(settings.tarikh_tutup_daftar));
  setValue('tel_urus_setia', settings.tel_urus_setia);
  setValue('butiran_bayaran', settings.butiran_bayaran);
  setValue('sumber_pendaftaran', settings.sumber_pendaftaran);
  setValue('sheet_luar_id', settings.sheet_luar_id);
  setValue('sheet_luar_tab', settings.sheet_luar_tab);
}

async function saveSettings(event) {
  event.preventDefault();
  const form = el['settings-form'];
  const get = (name) => form.elements[name];
  const values = {
    kapasiti: number(get('kapasiti').value, 40),
    yuran_asal: number(get('yuran_asal').value, 180),
    yuran_promo: number(get('yuran_promo').value, 120),
    diskaun_online: number(get('diskaun_online').value, 10),
    umur_min: number(get('umur_min').value, 10),
    umur_max: number(get('umur_max').value, 18),
    pendaftaran_dibuka: get('pendaftaran_dibuka').checked,
    tarikh_mula: fromKlInputValue(get('tarikh_mula').value),
    tarikh_tamat: fromKlInputValue(get('tarikh_tamat').value),
    tarikh_tutup_daftar: fromKlInputValue(get('tarikh_tutup_daftar').value),
    tel_urus_setia: get('tel_urus_setia').value.trim(),
    butiran_bayaran: get('butiran_bayaran').value.trim(),
    sumber_pendaftaran: get('sumber_pendaftaran').value,
    sheet_luar_id: get('sheet_luar_id').value.trim(),
    sheet_luar_tab: get('sheet_luar_tab').value.trim()
  };

  setBusy(el['settings-save'], true, 'Menyimpan…');
  try {
    const data = await call('settings.set', { settings: values });
    applySettingsData(data);
    toast('Tetapan disimpan.', 'success');
    await loadStats();
    renderDashboard();
  } catch (err) {
    reportError(err, 'Tetapan tidak dapat disimpan.');
  } finally {
    setBusy(el['settings-save'], false);
  }
}

async function testApi() {
  setBusy(el['settings-test'], true, 'Menguji…');
  try {
    const stats = await apiGet('stats');
    toast(`API berfungsi. Baki slot: ${number(stats.bakiSlot)} daripada ${number(stats.kapasiti)}.`, 'success', 7000);
  } catch (err) {
    reportError(err, 'Ujian API gagal.');
  } finally {
    setBusy(el['settings-test'], false);
  }
}

/* ------------------------------------------------------------------ */
/* Views and wiring                                                    */
/* ------------------------------------------------------------------ */

function renderCurrentView() {
  switch (state.view) {
    case 'dashboard':
      renderDashboard();
      tickDashboard();
      break;
    case 'registrations':
      renderRegistrations();
      break;
    case 'checklist':
      renderChecklist();
      break;
    case 'milestones':
      renderMilestones();
      break;
    case 'budget':
      renderBudget();
      break;
    case 'attendance':
      renderAttendance();
      break;
    case 'data':
      renderData();
      break;
    case 'settings':
      fillSettingsForm();
      break;
    default:
      renderDashboard();
  }
}

function switchView(view) {
  state.view = view;
  qsa('.app-nav button').forEach((button) => {
    const active = button.dataset.view === view;
    button.classList.toggle('active', active);
    if (active) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  qsa('.view').forEach((section) => {
    show(section, section.dataset.view === view);
  });
  renderCurrentView();
  if (view === 'data' && !state.dbInfo) loadDbInfo();
  if (view === 'attendance' && !state.loaded.attendance) {
    loadAttendance().then(renderAttendance).catch((err) => reportError(err));
  }
  if (view === 'settings' && !state.settings) loadSettings();
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

  qsa('.app-nav button').forEach((button) => {
    button.addEventListener('click', () => switchView(button.dataset.view));
  });

  el['dash-refresh'].addEventListener('click', async () => {
    setBusy(el['dash-refresh'], true, 'Memuat…');
    try {
      await Promise.allSettled([loadStats(), loadCoreData({ silent: true })]);
      renderDashboard();
      tickDashboard();
      toast('Dashboard dikemas kini.', 'success', 2500);
    } finally {
      setBusy(el['dash-refresh'], false);
    }
  });

  const regRender = debounce(() => renderRegistrations(), 160);
  el['reg-search'].addEventListener('input', regRender);
  el['reg-filter-status'].addEventListener('change', renderRegistrations);
  el['reg-filter-payment'].addEventListener('change', renderRegistrations);
  el['reg-filter-method'].addEventListener('change', renderRegistrations);
  el['reg-reset'].addEventListener('click', () => {
    el['reg-search'].value = '';
    el['reg-filter-status'].value = '';
    el['reg-filter-payment'].value = '';
    el['reg-filter-method'].value = '';
    renderRegistrations();
  });
  el['reg-add'].addEventListener('click', openManualRegistration);
  el['reg-export'].addEventListener('click', exportRegistrationsCsv);
  el['reg-copy-phones'].addEventListener('click', copyGuardianPhones);
  el['reg-whatsapp'].addEventListener('click', openMessageDialog);
  el['reg-refresh'].addEventListener('click', async () => {
    setBusy(el['reg-refresh'], true, 'Memuat…');
    try {
      await loadRegistrations();
      renderRegistrations();
      toast('Senarai pendaftaran dikemas kini.', 'success', 2500);
    } catch (err) {
      reportError(err, 'Senarai tidak dapat dimuatkan.');
    } finally {
      setBusy(el['reg-refresh'], false);
    }
  });

  el['message-template'].addEventListener('change', () => {
    state.messageTemplate = el['message-template'].value;
    updateMessagePreview();
  });
  el['message-target'].addEventListener('change', () => {
    state.messageTarget = el['message-target'].value;
    updateMessagePreview();
  });
  el['message-copy'].addEventListener('click', copyMessages);
  [el['message-close'], el['message-close-2']].forEach((button) => {
    button.addEventListener('click', () => el['message-dialog'].close());
  });

  const taskRender = debounce(() => renderChecklist(), 160);
  el['task-search'].addEventListener('input', taskRender);
  el['task-filter-category'].addEventListener('change', renderChecklist);
  el['task-filter-status'].addEventListener('change', renderChecklist);
  el['task-add'].addEventListener('click', () => openTaskDialog());
  el['task-refresh'].addEventListener('click', async () => {
    setBusy(el['task-refresh'], true, 'Memuat…');
    try {
      await loadTasks();
      renderChecklist();
      renderDashboard();
      toast('Checklist dikemas kini.', 'success', 2500);
    } catch (err) {
      reportError(err, 'Checklist tidak dapat dimuatkan.');
    } finally {
      setBusy(el['task-refresh'], false);
    }
  });

  el['milestone-add'].addEventListener('click', () => openMilestoneDialog());
  el['milestone-refresh'].addEventListener('click', async () => {
    setBusy(el['milestone-refresh'], true, 'Memuat…');
    try {
      await loadMilestones();
      renderMilestones();
      renderDashboard();
      toast('Milestone dikemas kini.', 'success', 2500);
    } catch (err) {
      reportError(err, 'Milestone tidak dapat dimuatkan.');
    } finally {
      setBusy(el['milestone-refresh'], false);
    }
  });

  el['budget-add'].addEventListener('click', () => openBudgetDialog());
  el['budget-refresh'].addEventListener('click', async () => {
    setBusy(el['budget-refresh'], true, 'Memuat…');
    try {
      await loadBudget();
      renderBudget();
      renderDashboard();
      toast('Bajet dikemas kini.', 'success', 2500);
    } catch (err) {
      reportError(err, 'Bajet tidak dapat dimuatkan.');
    } finally {
      setBusy(el['budget-refresh'], false);
    }
  });

  el['attendance-search'].addEventListener('input', debounce(renderAttendance, 160));
  el['attendance-refresh'].addEventListener('click', async () => {
    setBusy(el['attendance-refresh'], true, 'Memuat…');
    try {
      await Promise.all([loadRegistrations(), loadAttendance()]);
      renderAttendance();
      toast('Kehadiran dikemas kini.', 'success', 2500);
    } catch (err) {
      reportError(err, 'Kehadiran tidak dapat dimuatkan.');
    } finally {
      setBusy(el['attendance-refresh'], false);
    }
  });

  el['data-refresh'].addEventListener('click', async () => {
    setBusy(el['data-refresh'], true, 'Memuat…');
    try {
      await loadDbInfo();
      toast('Maklumat pangkalan data dikemas kini.', 'success', 2500);
    } finally {
      setBusy(el['data-refresh'], false);
    }
  });
  el['data-setup'].addEventListener('click', runDbSetup);
  el['data-seed'].addEventListener('click', runDbSeed);
  el['data-backup'].addEventListener('click', runDbBackup);

  el['settings-form'].addEventListener('submit', saveSettings);
  el['settings-test'].addEventListener('click', testApi);
}

/* ------------------------------------------------------------------ */
/* Boot                                                                */
/* ------------------------------------------------------------------ */

function populateTaskCategories() {
  const select = el['task-filter-category'];
  if (!select) return;
  CATEGORIES.forEach((category) => select.append(h('option', { value: category, text: category })));
}

async function boot() {
  cacheElements();
  populateTaskCategories();
  wireEvents();

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
    applySettingsData(await verifyToken(saved));
    show(el['login-screen'], false);
    show(el['app'], true);
    await initializeApp();
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
