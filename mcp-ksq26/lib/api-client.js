/**
 * Minimal Google Apps Script API client for the KSQ MCP server.
 * Uses only Node built-ins. POST uses text/plain to avoid CORS preflight.
 */

export class ApiError extends Error {
  constructor(message, code = 'API_ERROR') {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

const DEFAULT_TIMEOUT_MS = 20000;
const URL_PATTERN = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/;

export function validateApiUrl(value) {
  const url = String(value || '').trim();
  if (!URL_PATTERN.test(url) || url.includes('ISI_')) {
    throw new ApiError(
      'KSQ_API_URL mesti URL /exec Apps Script yang sah. Tetapkan pemboleh ubah persekitaran KSQ_API_URL.',
      'NOT_CONFIGURED'
    );
  }
  return url;
}

export function createApiClient(options = {}) {
  const apiUrl = validateApiUrl(options.apiUrl ?? process.env.KSQ_API_URL);
  const adminToken = String(options.adminToken ?? process.env.KSQ_ADMIN_TOKEN ?? '').trim();
  const facilitatorToken = String(
    options.facilitatorToken ?? process.env.KSQ_FASILITATOR_TOKEN ?? ''
  ).trim();
  const timeoutMs = Number(options.timeoutMs) > 0 ? Number(options.timeoutMs) : DEFAULT_TIMEOUT_MS;
  const fetchImpl = options.fetchImpl || globalThis.fetch;

  if (typeof fetchImpl !== 'function') {
    throw new ApiError('Node 18+ diperlukan untuk fetch.', 'RUNTIME');
  }

  async function request(method, action, payload = {}, token = '') {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let response;
    try {
      if (method === 'GET') {
        const url = new URL(apiUrl);
        url.searchParams.set('action', action);
        Object.entries(payload).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            url.searchParams.set(key, String(value));
          }
        });
        if (token) url.searchParams.set('token', token);
        response = await fetchImpl(url, {
          method: 'GET',
          redirect: 'follow',
          cache: 'no-store',
          signal: controller.signal
        });
      } else {
        response = await fetchImpl(apiUrl, {
          method: 'POST',
          redirect: 'follow',
          cache: 'no-store',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action, ...payload, token }),
          signal: controller.signal
        });
      }
    } catch (err) {
      if (err && err.name === 'AbortError') {
        throw new ApiError('Sambungan ke API terlalu lama. Cuba lagi.', 'TIMEOUT');
      }
      throw new ApiError('Tidak dapat menghubungi API KSQ. Semak internet dan KSQ_API_URL.', 'NETWORK');
    } finally {
      clearTimeout(timer);
    }

    const text = await response.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      throw new ApiError(
        `Respons API bukan JSON (HTTP ${response.status}). Pastikan deployment GAS terbaharu.`,
        'BAD_RESPONSE'
      );
    }
    if (!json || json.ok !== true) {
      throw new ApiError(
        (json && json.error) || 'API memulangkan ralat.',
        (json && json.code) || 'API_ERROR'
      );
    }
    return json.data !== undefined ? json.data : json;
  }

  function requireAdmin() {
    if (!adminToken) {
      throw new ApiError('KSQ_ADMIN_TOKEN belum ditetapkan. Alat ini memerlukan token pentadbir.', 'NO_ADMIN_TOKEN');
    }
    return adminToken;
  }

  return {
    apiUrl,
    hasAdminToken: Boolean(adminToken),
    hasFacilitatorToken: Boolean(facilitatorToken),
    stats: () => request('GET', 'stats'),
    adminGet: (action, payload = {}) => request('GET', action, payload, requireAdmin()),
    adminPost: (action, payload = {}) => request('POST', action, payload, requireAdmin()),
    facilitatorPost: (action, payload = {}) => {
      if (!facilitatorToken) {
        throw new ApiError(
          'KSQ_FASILITATOR_TOKEN belum ditetapkan. Alat kehadiran memerlukan token fasilitator atau pentadbir.',
          'NO_FACILITATOR_TOKEN'
        );
      }
      return request('POST', action, payload, facilitatorToken);
    },
    raw: request
  };
}
