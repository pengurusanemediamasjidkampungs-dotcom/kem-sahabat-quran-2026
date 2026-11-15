/**
 * Thin API client for the Google Apps Script Web App.
 * POST uses text/plain to avoid a CORS preflight (Apps Script has no OPTIONS handler).
 */
import { CONFIG } from '../config.js';
import { syncServerTime } from './time.js';

const TIMEOUT_MS = 20000;

export class ApiError extends Error {
  constructor(message, code = 'API_ERROR') {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

export function isApiConfigured() {
  const url = String(CONFIG.API_URL || '');
  return /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url) &&
    !url.includes('ISI_');
}

function buildGetUrl(action, params = {}) {
  const url = new URL(CONFIG.API_URL);
  url.searchParams.set('action', action);
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    url.searchParams.set(key, String(value));
  });
  return url.toString();
}

async function request(method, action, payload = {}, token = '') {
  if (!isApiConfigured()) {
    throw new ApiError(
      'API belum disambungkan. Isi API_URL dalam web/config.js dengan URL /exec Apps Script.',
      'NOT_CONFIGURED'
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let response;
  try {
    if (method === 'GET') {
      const params = { ...payload };
      if (token) params.token = token;
      response = await fetch(buildGetUrl(action, params), {
        method: 'GET',
        cache: 'no-store',
        redirect: 'follow',
        signal: controller.signal
      });
    } else {
      response = await fetch(CONFIG.API_URL, {
        method: 'POST',
        cache: 'no-store',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, ...payload, token }),
        signal: controller.signal
      });
    }
  } catch (err) {
    if (err && err.name === 'AbortError') {
      throw new ApiError('Sambungan terlalu lama. Sila cuba lagi.', 'TIMEOUT');
    }
    throw new ApiError('Tidak dapat menghubungi pelayan. Semak sambungan internet anda.', 'NETWORK');
  } finally {
    clearTimeout(timer);
  }

  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (err) {
    throw new ApiError('Respons pelayan tidak sah. Pastikan API_URL betul dan deployment terbaharu.', 'BAD_RESPONSE');
  }

  syncServerTime(json.serverTime);

  if (!json.ok) {
    throw new ApiError(json.error || 'Ralat tidak diketahui.', json.code || 'API_ERROR');
  }

  return json.data !== undefined ? json.data : json;
}

export function apiGet(action, params = {}, token = '') {
  return request('GET', action, params, token);
}

export function apiPost(action, payload = {}, token = '') {
  return request('POST', action, payload, token);
}

export function adminGet(action, token, params = {}) {
  return apiGet(action, params, token);
}

export function adminPost(action, token, payload = {}) {
  return apiPost(action, payload, token);
}

export function getStats() {
  return apiGet('stats');
}

export function getApiUrl() {
  return CONFIG.API_URL;
}
