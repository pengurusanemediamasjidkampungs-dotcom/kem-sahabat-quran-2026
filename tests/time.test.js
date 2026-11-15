/**
 * Pure-function tests for web/js/time.js.
 * Run with: node --test tests
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

import {
  DAY_MS,
  countdownParts,
  countdownText,
  csvEscape,
  daysBetweenKeys,
  daysUntil,
  formatIsoKl,
  formatKl,
  formatKlDateShort,
  formatKlDateTime,
  formatKlTime,
  formatKlWeekday,
  formatRM,
  formatRupiah,
  fromKlInputValue,
  getClockOffset,
  klDateKey,
  klParts,
  klTimeKey,
  needsServerSync,
  normalizeWhatsAppNumber,
  nowDate,
  parseDate,
  programPhase,
  programPhaseLabel,
  resetClockForTests,
  setClockOffsetForTests,
  syncServerTime,
  taskTemporalStatus,
  toKlInputValue,
  whatsappLink
} from '../web/js/time.js';

test.afterEach(() => {
  resetClockForTests(0);
});

test('parseDate treats date-only values as Kuala Lumpur midnight', () => {
  const date = parseDate('2026-12-16');
  assert.ok(date);
  assert.equal(date.toISOString(), '2026-12-15T16:00:00.000Z');
  assert.equal(klDateKey(date), '2026-12-16');
});

test('parseDate treats offset-less local datetimes as Asia/Kuala_Lumpur', () => {
  assert.equal(parseDate('2026-12-16T08:00').toISOString(), '2026-12-16T00:00:00.000Z');
  assert.equal(parseDate('2026-12-16T08:00:00').toISOString(), '2026-12-16T00:00:00.000Z');
  assert.equal(parseDate('2026-12-16T08:00:00+08:00').toISOString(), '2026-12-16T00:00:00.000Z');
});

test('parseDate rejects invalid and empty values', () => {
  assert.equal(parseDate(''), null);
  assert.equal(parseDate(null), null);
  assert.equal(parseDate('bukan tarikh'), null);
  assert.equal(parseDate(new Date('invalid')), null);
});

test('klParts and klDateKey use Kuala Lumpur date across the UTC boundary', () => {
  const lateNightUtc = new Date('2026-12-15T16:30:00Z');
  assert.equal(klDateKey(lateNightUtc), '2026-12-16');
  assert.deepEqual(klParts(lateNightUtc), {
    year: 2026, month: 12, day: 16, hour: 0, minute: 30, second: 0
  });
  assert.equal(klTimeKey(lateNightUtc), '00:30:00');
});

test('format helpers keep their intended scope', () => {
  const value = '2026-12-16T08:05:00+08:00';
  assert.match(formatKl(value), /2026/);
  assert.match(formatKl(value), /Disember/);
  assert.match(formatKlDateTime(value), /2026/);
  assert.match(formatKlDateTime(value), /08:05/);
  assert.equal(formatKlTime(value), '08:05');
  assert.doesNotMatch(formatKlTime(value), /2026|Dis/);
  assert.match(formatKlDateShort(value), /16/);
  assert.doesNotMatch(formatKlDateShort(value), /2026/);
  assert.equal(formatKlWeekday(value), 'Rabu');
});

test('day keys handle leap years and month boundaries', () => {
  assert.equal(daysBetweenKeys('2026-12-16', '2026-12-18'), 2);
  assert.equal(daysBetweenKeys('2026-12-31', '2027-01-01'), 1);
  assert.equal(daysBetweenKeys('2028-02-28', '2028-03-01'), 2);
  assert.equal(daysBetweenKeys('2026-02-28', '2026-03-01'), 1);
  assert.equal(daysBetweenKeys('2026-12-18', '2026-12-16'), -2);
  assert.equal(daysBetweenKeys('tidak', '2026-12-16'), 0);
});

test('daysUntil compares calendar days in Kuala Lumpur', () => {
  const from = new Date('2026-12-15T16:30:00Z'); // 16 Dec 00:30 KL
  assert.equal(daysUntil('2026-12-16', from), 0);
  assert.equal(daysUntil('2026-12-18', from), 2);
});

test('countdownParts and countdownText handle zero and exact units', () => {
  assert.deepEqual(countdownParts(0), { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 });
  const parts = countdownParts(DAY_MS + 2 * 3600000 + 3 * 60000 + 4000);
  assert.equal(parts.days, 1);
  assert.equal(parts.hours, 2);
  assert.equal(parts.minutes, 3);
  assert.equal(parts.seconds, 4);
  assert.equal(countdownText(0), 'Tamat');
  assert.equal(countdownText(3661000), '1 jam 1 minit');
  assert.equal(countdownText(DAY_MS, { alwaysDays: true }), '1 hari 0 jam 0 minit');
  assert.equal(countdownText(61000, { withSeconds: true }), '0 jam 1 minit 1 saat');
});

test('taskTemporalStatus classifies done, late, today and upcoming', () => {
  const now = new Date('2026-12-16T10:00:00+08:00');
  assert.equal(taskTemporalStatus('2026-12-16T09:00:00+08:00', 'Selesai', now), 'Selesai');
  assert.equal(taskTemporalStatus('2026-12-16T09:00:00+08:00', 'Belum', now), 'Lewat');
  assert.equal(taskTemporalStatus('2026-12-16T23:59:00+08:00', 'Belum', now), 'Hari ini');
  assert.equal(taskTemporalStatus('2026-12-18T23:59:00+08:00', 'Belum', now), 'Akan datang');
  assert.equal(taskTemporalStatus('', 'Belum', now), 'Akan datang');
});

test('programPhase identifies before, during and after phases', () => {
  const start = '2026-12-16T08:00:00+08:00';
  const end = '2026-12-18T17:00:00+08:00';

  const before = programPhase(start, end, new Date('2026-12-10T08:00:00+08:00'));
  assert.equal(before.phase, 'before');
  assert.equal(before.daysToStart, 6);
  assert.equal(programPhaseLabel(before), 'Belum bermula');

  const day1 = programPhase(start, end, new Date('2026-12-16T12:00:00+08:00'));
  assert.equal(day1.phase, 'during');
  assert.equal(day1.day, 1);
  assert.equal(programPhaseLabel(day1), 'Hari 1 daripada 3');

  const day3 = programPhase(start, end, new Date('2026-12-18T12:00:00+08:00'));
  assert.equal(day3.day, 3);

  const after = programPhase(start, end, new Date('2026-12-20T12:00:00+08:00'));
  assert.equal(after.phase, 'after');
  assert.equal(programPhaseLabel(after), 'Program tamat');

  assert.equal(programPhase(null, null).phase, 'unknown');
});

test('date input conversion round-trips Kuala Lumpur wall time', () => {
  const iso = '2026-12-16T08:05:00+08:00';
  assert.equal(toKlInputValue(iso), '2026-12-16T08:05');
  assert.equal(fromKlInputValue('2026-12-16T08:05'), '2026-12-16T08:05:00+08:00');
  assert.equal(fromKlInputValue('2026-12-16'), '2026-12-16T00:00:00+08:00');
  assert.equal(formatIsoKl(parseDate('2026-12-16T08:05:00+08:00')), iso);
  assert.equal(toKlInputValue(''), '');
});

test('server clock offset applies to nowDate and can be reset', () => {
  resetClockForTests(0);
  assert.equal(getClockOffset(), 0);
  syncServerTime('2026-12-16T08:00:00+08:00');
  const offset = getClockOffset();
  assert.ok(Number.isFinite(offset));
  assert.equal(nowDate().getTime(), Date.now() + offset);
  assert.equal(needsServerSync(60000), false);
  assert.equal(needsServerSync(-1), true);

  setClockOffsetForTests(60000);
  assert.equal(getClockOffset(), 60000);
  assert.ok(nowDate().getTime() >= Date.now() + 59000);

  syncServerTime('bukan masa');
  assert.equal(getClockOffset(), 60000, 'invalid server time must not change the offset');
  resetClockForTests(0);
  assert.equal(getClockOffset(), 0);
});

test('currency formatting uses Malay locale and RM prefix', () => {
  assert.equal(formatRM(5495), 'RM 5,495');
  assert.equal(formatRM('120'), 'RM 120');
  assert.equal(formatRM(120.5, 2), 'RM 120.50');
  assert.equal(formatRM(null), 'RM 0');
  assert.equal(formatRM('abc'), 'RM 0');
  assert.equal(formatRupiah(1100), 'RM 1,100');
});

test('WhatsApp normalisation handles local, international and invalid numbers', () => {
  assert.equal(normalizeWhatsAppNumber('012-345 6789'), '60123456789');
  assert.equal(normalizeWhatsAppNumber('+60 12-345 6789'), '60123456789');
  assert.equal(normalizeWhatsAppNumber('60123456789'), '60123456789');
  assert.equal(normalizeWhatsAppNumber('12345'), '');
  assert.equal(normalizeWhatsAppNumber(''), '');
  assert.equal(
    whatsappLink('012-3456789', 'Assalamualaikum & selamat datang'),
    'https://wa.me/60123456789?text=Assalamualaikum%20%26%20selamat%20datang'
  );
  assert.equal(whatsappLink('', 'Hi'), '');
});

test('csvEscape quotes separators and neutralises formula injection', () => {
  assert.equal(csvEscape('biasa'), 'biasa');
  assert.equal(csvEscape('a,b'), '"a,b"');
  assert.equal(csvEscape('a"b'), '"a""b"');
  assert.equal(csvEscape('baris\nbaru'), '"baris\nbaru"');
  assert.equal(csvEscape('=SUM(A1)'), "'=SUM(A1)");
  assert.equal(csvEscape('+60123'), "'+60123");
  assert.equal(csvEscape('-5'), "'-5");
  assert.equal(csvEscape('@pengguna'), "'@pengguna");
  assert.equal(csvEscape(null), '');
});

test('Kuala Lumpur calculations are independent of the host time zone', () => {
  const moduleUrl = pathToFileURL(path.join(PROJECT_ROOT, 'web', 'js', 'time.js')).href;
  const script = `
    import * as t from ${JSON.stringify(moduleUrl)};
    const instant = '2026-12-15T16:30:00Z';
    console.log(JSON.stringify({
      key: t.klDateKey(instant),
      parts: t.klParts(instant),
      parsed: t.parseDate('2026-12-16').toISOString(),
      time: t.formatKlTime('2026-12-16T08:05:00+08:00'),
      weekday: t.formatKlWeekday('2026-12-16')
    }));
  `;
  const run = (tz) => JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', script], {
    encoding: 'utf8',
    env: { ...process.env, TZ: tz }
  }));
  const utc = run('UTC');
  const newYork = run('America/New_York');
  const kualaLumpur = run('Asia/Kuala_Lumpur');
  assert.deepEqual(utc, newYork);
  assert.deepEqual(utc, kualaLumpur);
  assert.equal(utc.key, '2026-12-16');
  assert.equal(utc.time, '08:05');
});
