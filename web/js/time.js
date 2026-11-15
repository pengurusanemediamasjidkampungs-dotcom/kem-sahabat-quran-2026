/**
 * Time helpers for KSQ 2026.
 * All calendar calculations use Asia/Kuala_Lumpur, independent of the device time zone.
 * Pure functions only at module top level so this file can be tested in Node.
 */

export const KL_TIME_ZONE = 'Asia/Kuala_Lumpur';
export const KL_OFFSET = '+08:00';
export const DAY_MS = 86400000;
export const SERVER_SYNC_INTERVAL_MS = 5 * 60 * 1000;

let clockOffsetMs = 0;
let lastServerSyncAt = 0;

const partsFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: KL_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23'
});

function pad(value, length = 2) {
  return String(value).padStart(length, '0');
}

export function parseDate(value) {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'number') {
    const fromNumber = new Date(value);
    return Number.isNaN(fromNumber.getTime()) ? null : fromNumber;
  }
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  if (!text) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const dateOnly = new Date(text + 'T00:00:00' + KL_OFFSET);
    return Number.isNaN(dateOnly.getTime()) ? null : dateOnly;
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(text)) {
    const local = new Date(text + ':00' + KL_OFFSET);
    return Number.isNaN(local.getTime()) ? null : local;
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(text)) {
    const local = new Date(text + KL_OFFSET);
    return Number.isNaN(local.getTime()) ? null : local;
  }
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function syncServerTime(serverTimeIso) {
  const serverMs = Date.parse(String(serverTimeIso || ''));
  if (!Number.isFinite(serverMs)) return clockOffsetMs;
  clockOffsetMs = serverMs - Date.now();
  lastServerSyncAt = Date.now();
  return clockOffsetMs;
}

export function getClockOffset() {
  return clockOffsetMs;
}

export function getLastServerSyncAt() {
  return lastServerSyncAt;
}

export function needsServerSync(maxAgeMs = SERVER_SYNC_INTERVAL_MS) {
  return !lastServerSyncAt || (Date.now() - lastServerSyncAt) > maxAgeMs;
}

export function resetClockForTests(offsetMs = 0) {
  clockOffsetMs = Number(offsetMs) || 0;
  lastServerSyncAt = 0;
}

export function setClockOffsetForTests(offsetMs) {
  clockOffsetMs = Number(offsetMs) || 0;
  lastServerSyncAt = Date.now();
}

export function nowMs() {
  return Date.now() + clockOffsetMs;
}

export function nowDate() {
  return new Date(nowMs());
}

export function klParts(value = nowDate()) {
  const date = parseDate(value);
  if (!date) return null;
  const parts = {};
  for (const part of partsFormatter.formatToParts(date)) {
    if (part.type !== 'literal') parts[part.type] = part.value;
  }
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second)
  };
}

export function klDateKey(value = nowDate()) {
  const parts = klParts(value);
  if (!parts) return '';
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

export function klTimeKey(value = nowDate()) {
  const parts = klParts(value);
  if (!parts) return '';
  return `${pad(parts.hour)}:${pad(parts.minute)}:${pad(parts.second)}`;
}

export function dayNumber(dateKey) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateKey || ''));
  if (!match) return NaN;
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / DAY_MS;
}

export function daysBetweenKeys(fromKey, toKey) {
  const from = dayNumber(fromKey);
  const to = dayNumber(toKey);
  if (!Number.isFinite(from) || !Number.isFinite(to)) return 0;
  return Math.round(to - from);
}

export function daysUntil(target, from = nowDate()) {
  const targetDate = parseDate(target);
  if (!targetDate) return 0;
  return daysBetweenKeys(klDateKey(from), klDateKey(targetDate));
}

export function isSameKlDay(a, b) {
  return klDateKey(a) === klDateKey(b);
}

function formatIntl(value, options, locale = 'ms-MY') {
  const date = parseDate(value);
  if (!date) return '';
  try {
    return new Intl.DateTimeFormat(locale, { timeZone: KL_TIME_ZONE, ...options }).format(date);
  } catch (err) {
    return new Intl.DateTimeFormat('en-GB', { timeZone: KL_TIME_ZONE, ...options }).format(date);
  }
}

export function formatKl(value, options = {}, locale = 'ms-MY') {
  return formatIntl(value, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...options
  }, locale);
}

export function formatKlDateTime(value, locale = 'ms-MY') {
  return formatIntl(value, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }, locale);
}

export function formatKlTime(value, locale = 'ms-MY') {
  return formatIntl(value, { hour: '2-digit', minute: '2-digit', hour12: false }, locale);
}

export function formatKlDateShort(value, locale = 'ms-MY') {
  return formatIntl(value, { day: 'numeric', month: 'short' }, locale);
}

export function formatKlWeekday(value, locale = 'ms-MY') {
  return formatIntl(value, { weekday: 'long' }, locale);
}

export function toKlInputValue(value) {
  const parts = klParts(value);
  if (!parts) return '';
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`;
}

export function fromKlInputValue(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text + 'T00:00:00' + KL_OFFSET;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(text)) return text + ':00' + KL_OFFSET;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(text)) return text + KL_OFFSET;
  return text;
}

export function formatIsoKl(value) {
  const parts = klParts(value);
  if (!parts) return '';
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T` +
    `${pad(parts.hour)}:${pad(parts.minute)}:${pad(parts.second)}${KL_OFFSET}`;
}

export function countdownParts(milliseconds) {
  const total = Math.max(0, Number(milliseconds) || 0);
  return {
    total,
    days: Math.floor(total / DAY_MS),
    hours: Math.floor((total % DAY_MS) / 3600000),
    minutes: Math.floor((total % 3600000) / 60000),
    seconds: Math.floor((total % 60000) / 1000)
  };
}

export function countdownText(milliseconds, options = {}) {
  const parts = countdownParts(milliseconds);
  if (parts.total <= 0) return options.zeroLabel || 'Tamat';
  const units = options.units || { days: 'hari', hours: 'jam', minutes: 'minit', seconds: 'saat' };
  const segments = [];
  if (parts.days > 0 || options.alwaysDays) segments.push(`${parts.days} ${units.days}`);
  segments.push(`${parts.hours} ${units.hours}`);
  segments.push(`${parts.minutes} ${units.minutes}`);
  if (options.withSeconds) segments.push(`${parts.seconds} ${units.seconds}`);
  return segments.join(' ');
}

export function taskTemporalStatus(deadline, status, at = nowDate()) {
  if (status === 'Selesai') return 'Selesai';
  const deadlineDate = parseDate(deadline);
  const now = parseDate(at);
  if (!deadlineDate || !now) return 'Akan datang';
  if (now.getTime() > deadlineDate.getTime()) return 'Lewat';
  if (klDateKey(now) === klDateKey(deadlineDate)) return 'Hari ini';
  return 'Akan datang';
}

export function programPhase(startIso, endIso, at = nowDate()) {
  const start = parseDate(startIso);
  const end = parseDate(endIso);
  const now = parseDate(at) || nowDate();
  if (!start || !end) {
    return { phase: 'unknown', day: 0, daysToStart: 0, daysToEnd: 0, msToStart: 0, msToEnd: 0 };
  }

  if (now.getTime() < start.getTime()) {
    return {
      phase: 'before',
      day: 0,
      daysToStart: daysBetweenKeys(klDateKey(now), klDateKey(start)),
      daysToEnd: daysBetweenKeys(klDateKey(now), klDateKey(end)),
      msToStart: start.getTime() - now.getTime(),
      msToEnd: end.getTime() - now.getTime()
    };
  }

  if (now.getTime() > end.getTime()) {
    return {
      phase: 'after',
      day: 3,
      daysToStart: 0,
      daysToEnd: daysBetweenKeys(klDateKey(end), klDateKey(now)),
      msToStart: 0,
      msToEnd: 0
    };
  }

  const day = Math.min(3, Math.max(1, daysBetweenKeys(klDateKey(start), klDateKey(now)) + 1));
  return {
    phase: 'during',
    day,
    daysToStart: 0,
    daysToEnd: daysBetweenKeys(klDateKey(now), klDateKey(end)),
    msToStart: 0,
    msToEnd: end.getTime() - now.getTime()
  };
}

export function programPhaseLabel(phaseResult) {
  if (!phaseResult) return '';
  if (phaseResult.phase === 'before') return 'Belum bermula';
  if (phaseResult.phase === 'during') return `Hari ${phaseResult.day} daripada 3`;
  if (phaseResult.phase === 'after') return 'Program tamat';
  return 'Tarikh belum ditetapkan';
}

export function hariLabel(days) {
  const value = Number(days);
  if (!Number.isFinite(value)) return '';
  if (value === 0) return 'Hari ini';
  if (value > 0) return `H-${value}`;
  return `H+${Math.abs(value)}`;
}

export function formatRM(value, decimals = 0) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 'RM 0';
  return 'RM ' + new Intl.NumberFormat('ms-MY', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(number);
}

// Kept for older imports; prefer formatRM in new code.
export const formatRupiah = formatRM;

export function formatNumber(value, decimals = 0) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '0';
  return new Intl.NumberFormat('ms-MY', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(number);
}

export function normalizeWhatsAppNumber(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('60')) return digits.length >= 10 ? digits : '';
  if (digits.startsWith('0')) return digits.length >= 9 ? '60' + digits.slice(1) : '';
  return digits.length >= 9 ? digits : '';
}

export function whatsappLink(phone, message = '') {
  const number = normalizeWhatsAppNumber(phone);
  if (!number) return '';
  const query = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${number}${query}`;
}

export function csvEscape(value) {
  let text = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(text.trim())) text = "'" + text;
  if (/[",\r\n]/.test(text)) {
    return '"' + text.replace(/"/g, '""') + '"';
  }
  return text;
}
