/**
 * Language switcher for the public page.
 *
 * Bahasa Melayu is the source language. English and Arabic are looked up in
 * i18n-data.js. The choice is remembered in localStorage and the page switches
 * direction automatically for Arabic.
 *
 * Markup hooks used by this module:
 *   data-i18n="key"              replace textContent
 *   data-i18n-html="key"         replace innerHTML (trusted dictionary only)
 *   data-i18n-placeholder="key"  replace the placeholder attribute
 *   data-i18n-aria="key"         replace the aria-label attribute
 *   data-i18n-alt="key"          replace the alt attribute
 *   data-i18n-title="key"        replace the title attribute
 *   data-i18n-time               translate a schedule time cell
 */

import { STRINGS, TIMES, arabicUnit } from './i18n-data.js';

export const LANGS = ['ms', 'en', 'ar'];

const LANG_INDEX = { ms: 0, en: 1, ar: 2 };
export const LOCALES = { ms: 'ms-MY', en: 'en-MY', ar: 'ar-MY-u-nu-latn' };
const STORAGE_KEY = 'ksq_lang';
const DEFAULT_LANG = 'ms';

let current = DEFAULT_LANG;
const missingKeys = new Set();

function readStored() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && LANGS.includes(saved)) return saved;
  } catch (err) {
    // Private mode or blocked storage: fall back to the default language.
  }
  return DEFAULT_LANG;
}

function store(lang) {
  try {
    window.localStorage.setItem(STORAGE_KEY, lang);
  } catch (err) {
    // Ignore: the page still works, the choice is just not remembered.
  }
}

export function getLang() {
  return current;
}

export function getLocale() {
  return LOCALES[current];
}

/** Translate one key. Missing entries fall back to Bahasa Melayu. */
export function t(key, params) {
  const entry = STRINGS[key];
  let text;
  if (!entry) {
    if (!missingKeys.has(key)) {
      missingKeys.add(key);
      console.warn('[KSQ i18n] missing key:', key);
    }
    text = key;
  } else {
    text = entry[LANG_INDEX[current]] || entry[0] || key;
  }
  if (params) {
    text = text.replace(/\{(\w+)\}/g, (match, name) => (
      params[name] === undefined || params[name] === null ? match : String(params[name])
    ));
  }
  return text;
}

/** Translate a schedule time cell ("8:00–8:30 pg" to "8:00–8:30 am"). */
export function tTime(text) {
  const entry = TIMES[String(text).trim()];
  if (!entry) return text;
  return entry[LANG_INDEX[current]] || entry[0];
}

/** Unit word for a count. Arabic needs the number to choose the right form. */
export function unitLabel(unit, count) {
  if (current === 'ar') return arabicUnit(unit, count);
  return t('unit.' + unit);
}

/** Display label for a status value stored by the server. */
export function statusLabel(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  const key = 'status.' + text.replace(/\s+/g, '');
  return STRINGS[key] ? t(key) : text;
}

function each(selector, fn) {
  document.querySelectorAll(selector).forEach(fn);
}

function applyStatic() {
  each('[data-i18n]', (node) => {
    node.textContent = t(node.dataset.i18n);
  });
  each('[data-i18n-html]', (node) => {
    node.innerHTML = t(node.dataset.i18nHtml);
  });
  each('[data-i18n-placeholder]', (node) => {
    node.setAttribute('placeholder', t(node.dataset.i18nPlaceholder));
  });
  each('[data-i18n-aria]', (node) => {
    node.setAttribute('aria-label', t(node.dataset.i18nAria));
  });
  each('[data-i18n-alt]', (node) => {
    node.setAttribute('alt', t(node.dataset.i18nAlt));
  });
  each('[data-i18n-title]', (node) => {
    node.setAttribute('title', t(node.dataset.i18nTitle));
  });
  each('[data-i18n-time]', (node) => {
    if (!node.dataset.i18nTimeSource) node.dataset.i18nTimeSource = node.textContent.trim();
    node.textContent = tTime(node.dataset.i18nTimeSource);
  });

  document.title = t('meta.title');
  const description = document.querySelector('meta[name="description"]');
  if (description) description.setAttribute('content', t('meta.description'));
}

function syncSwitcher() {
  each('[data-lang]', (button) => {
    const active = button.dataset.lang === current;
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
    button.classList.toggle('is-active', active);
  });
}

function syncDocument() {
  document.documentElement.lang = current;
  document.documentElement.dir = current === 'ar' ? 'rtl' : 'ltr';
}

/** Apply a language. Exposed so other pages can reuse the switcher. */
export function setLang(next) {
  if (!LANGS.includes(next) || next === current) {
    if (LANGS.includes(next)) store(next);
    return current;
  }
  current = next;
  store(next);
  syncDocument();
  syncSwitcher();
  applyStatic();
  document.dispatchEvent(new CustomEvent('ksq:langchange', { detail: { lang: current } }));
  return current;
}

function wireSwitcher() {
  each('[data-lang]', (button) => {
    button.addEventListener('click', () => setLang(button.dataset.lang));
  });
}

function boot() {
  current = readStored();
  syncDocument();
  syncSwitcher();
  applyStatic();
  wireSwitcher();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
