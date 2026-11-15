#!/usr/bin/env node
/**
 * Optional live smoke test for a deployed Google Apps Script backend.
 * Never mutates data: only read-only endpoints are called.
 *
 * Usage (PowerShell):
 *   $env:KSQ_API_URL="https://script.google.com/macros/s/XXXX/exec"
 *   $env:KSQ_ADMIN_TOKEN="..."           # optional
 *   $env:KSQ_FASILITATOR_TOKEN="..."     # optional
 *   node tests/api-smoke.js
 *
 * Exit code 0 = all checks passed. Exit code 1 = at least one check failed.
 */

const API_URL = String(process.env.KSQ_API_URL || process.argv[2] || '').trim();
const ADMIN_TOKEN = String(process.env.KSQ_ADMIN_TOKEN || '').trim();
const FACILITATOR_TOKEN = String(process.env.KSQ_FASILITATOR_TOKEN || '').trim();

if (!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(API_URL)) {
  console.error('KSQ_API_URL mesti URL /exec Apps Script yang sah.');
  console.error('Contoh: $env:KSQ_API_URL="https://script.google.com/macros/s/XXXX/exec"');
  process.exit(1);
}

let passed = 0;
let failed = 0;
const failures = [];

function check(label, condition, detail = '') {
  if (condition) {
    passed += 1;
    console.log(`  OK   ${label}`);
  } else {
    failed += 1;
    failures.push(label);
    console.log(`  FAIL ${label}${detail ? ' — ' + detail : ''}`);
  }
}

async function get(action, params = {}) {
  const url = new URL(API_URL);
  url.searchParams.set('action', action);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, String(value)));
  const started = Date.now();
  const response = await fetch(url, { redirect: 'follow', cache: 'no-store' });
  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`${action}: respons bukan JSON (HTTP ${response.status}): ${text.slice(0, 160)}`);
  }
  json.__ms = Date.now() - started;
  json.__status = response.status;
  return json;
}

async function post(action, payload = {}, token = '') {
  const started = Date.now();
  const response = await fetch(API_URL, {
    method: 'POST',
    redirect: 'follow',
    cache: 'no-store',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, ...payload, token })
  });
  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`${action}: respons bukan JSON (HTTP ${response.status}): ${text.slice(0, 160)}`);
  }
  json.__ms = Date.now() - started;
  json.__status = response.status;
  return json;
}

function hasPii(stats) {
  const text = JSON.stringify(stats.data || stats);
  return /nama_peserta|nama_penjaga|tel_penjaga|rujukan_bayaran/.test(text);
}

async function main() {
  console.log('KSQ 2026 — smoke test API (baca sahaja)');
  console.log(`URL: ${API_URL.replace(/\/s\/[^/]+\//, '/s/***/')}`);
  console.log('');

  console.log('Awam');
  const stats = await get('stats');
  check('stats.ok', stats.ok === true, stats.error || '');
  check('stats ada kapasiti', Number.isFinite(Number(stats.kapasiti ?? stats.data?.kapasiti)));
  check('stats ada bakiSlot', Number.isFinite(Number(stats.bakiSlot ?? stats.data?.bakiSlot)));
  check('stats tidak mendedahkan data peribadi', !hasPii(stats));
  check('serverTime ISO +08:00', /\+08:00$/.test(String(stats.serverTime || '')));
  check('respons < 8 saat', Number(stats.__ms) < 8000, `${stats.__ms} ms`);

  const root = await get('');
  check('root action kosong memulangkan nama API', root.ok === true && Boolean(root.data?.nama || root.nama));

  if (ADMIN_TOKEN) {
    console.log('');
    console.log('Pentadbir (baca sahaja)');
    const settings = await post('settings.get', {}, ADMIN_TOKEN);
    check('settings.get diterima', settings.ok === true, settings.error || '');
    check('settings.get ada kapasiti', Boolean(settings.data?.settings?.kapasiti));

    const list = await post('list', {}, ADMIN_TOKEN);
    check('list pendaftaran', list.ok === true && Array.isArray(list.data?.registrations), list.error || '');

    for (const [action, key] of [
      ['tasks.list', 'tasks'],
      ['milestones.list', 'milestones'],
      ['budget.list', 'budget'],
      ['attendance.list', 'attendance']
    ]) {
      const result = await post(action, {}, ADMIN_TOKEN);
      check(`${action} ${key} array`, result.ok === true && Array.isArray(result.data?.[key]), result.error || '');
    }

    const info = await post('db.info', {}, ADMIN_TOKEN);
    check('db.info diterima', info.ok === true && Array.isArray(info.data?.sheets), info.error || '');

    const wrong = await post('list', {}, 'token-yang-salah-' + Date.now());
    check('token salah ditolak', wrong.ok === false && wrong.code === 'UNAUTHORIZED');
  } else {
    console.log('');
    console.log('Pentadbir: dilangkau (KSQ_ADMIN_TOKEN tidak ditetapkan).');
  }

  if (FACILITATOR_TOKEN) {
    console.log('');
    console.log('Fasilitator (baca sahaja)');
    const participants = await post('facilitator.participants', {}, FACILITATOR_TOKEN);
    check(
      'facilitator.participants diterima',
      participants.ok === true && Array.isArray(participants.data?.participants),
      participants.error || ''
    );
    const attendance = await post('attendance.list', {}, FACILITATOR_TOKEN);
    check(
      'fasilitator boleh baca kehadiran',
      attendance.ok === true && Array.isArray(attendance.data?.attendance),
      attendance.error || ''
    );
    const forbidden = await post('settings.get', {}, FACILITATOR_TOKEN);
    check(
      'fasilitator tidak boleh baca tetapan/kewangan',
      forbidden.ok === false && forbidden.code === 'UNAUTHORIZED'
    );
  } else {
    console.log('');
    console.log('Fasilitator: dilangkau (KSQ_FASILITATOR_TOKEN tidak ditetapkan).');
  }

  console.log('');
  console.log(`Selesai: ${passed} lulus, ${failed} gagal.`);
  if (failed) {
    console.log('Semak: ' + failures.join(', '));
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('');
  console.error('Smoke test terhenti:', err && err.message ? err.message : err);
  process.exitCode = 1;
});
