/**
 * Guard rails for the three-language public page.
 * These tests fail when a translation is missing, when a placeholder does not
 * match across languages, or when the HTML asks for a key that does not exist.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { STRINGS, TIMES, arabicUnit } from '../web/js/i18n-data.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WEB = path.resolve(HERE, '..', 'web');
const indexHtml = fs.readFileSync(path.join(WEB, 'index.html'), 'utf8');
const registerJs = fs.readFileSync(path.join(WEB, 'js', 'register.js'), 'utf8');
const dataJs = fs.readFileSync(path.join(WEB, 'js', 'i18n-data.js'), 'utf8');

const ATTRIBUTES = [
  'data-i18n-html',
  'data-i18n-placeholder',
  'data-i18n-aria',
  'data-i18n-alt',
  'data-i18n-title',
  'data-i18n'
];

function keysFromHtml() {
  const found = new Set();
  for (const attribute of ATTRIBUTES) {
    const pattern = new RegExp(`${attribute}="([^"]+)"`, 'g');
    for (const match of indexHtml.matchAll(pattern)) found.add(match[1]);
  }
  return found;
}

function keysFromScript() {
  const found = new Set();
  for (const match of registerJs.matchAll(/\bt\('([a-zA-Z0-9._]+)'/g)) found.add(match[1]);
  return found;
}

test('setiap entri mempunyai tiga bahasa yang lengkap', () => {
  for (const [key, entry] of Object.entries(STRINGS)) {
    assert.ok(Array.isArray(entry), `${key} mesti array`);
    assert.equal(entry.length, 3, `${key} mesti ada 3 nilai (ms, en, ar)`);
    entry.forEach((value, index) => {
      assert.equal(typeof value, 'string', `${key}[${index}] mesti string`);
      assert.ok(value.trim().length > 0, `${key}[${index}] tidak boleh kosong`);
    });
  }
});

test('placeholder {nama} sama dalam ketiga-tiga bahasa', () => {
  for (const [key, entry] of Object.entries(STRINGS)) {
    const tokens = entry.map((value) =>
      [...value.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort().join(',')
    );
    assert.equal(tokens[1], tokens[0], `${key}: placeholder EN tidak sama dengan BM`);
    assert.equal(tokens[2], tokens[0], `${key}: placeholder AR tidak sama dengan BM`);
  }
});

test('tiada kunci berganda dalam fail terjemahan', () => {
  const seen = new Map();
  for (const match of dataJs.matchAll(/^\s{2}'([a-zA-Z0-9._]+)':\s*\[/gm)) {
    const key = match[1];
    const line = dataJs.slice(0, match.index).split('\n').length;
    assert.ok(!seen.has(key), `kunci berganda: ${key} (baris ${line})`);
    seen.set(key, line);
  }
});

test('semua kunci dalam index.html wujud dalam terjemahan', () => {
  const missing = [...keysFromHtml()].filter((key) => !STRINGS[key]);
  assert.deepEqual(missing, [], `kunci hilang: ${missing.join(', ')}`);
  assert.ok(keysFromHtml().size > 100, 'bilangan kunci HTML terlalu sedikit, semak semula');
});

test('semua kunci dalam register.js wujud dalam terjemahan', () => {
  const missing = [...keysFromScript()].filter((key) => !STRINGS[key]);
  assert.deepEqual(missing, [], `kunci hilang: ${missing.join(', ')}`);
  assert.ok(keysFromScript().size > 40, 'bilangan kunci JS terlalu sedikit, semak semula');
});

test('setiap sel masa dalam jadual mempunyai terjemahan', () => {
  const cells = [...indexHtml.matchAll(/<td data-i18n-time>([^<]+)<\/td>/g)].map((m) => m[1].trim());
  assert.ok(cells.length === 29, `jangkaan 29 sel masa, dijumpai ${cells.length}`);
  const missing = cells.filter((text) => !TIMES[text]);
  assert.deepEqual(missing, [], `sel masa tanpa terjemahan: ${missing.join(', ')}`);
});

test('setiap masa mempunyai tiga bahasa', () => {
  for (const [key, entry] of Object.entries(TIMES)) {
    assert.equal(entry.length, 3, `${key} mesti ada 3 nilai`);
    entry.forEach((value, index) => {
      assert.ok(String(value).trim().length > 0, `${key}[${index}] tidak boleh kosong`);
    });
  }
});

test('butang bahasa BM, ENG dan AR ada dalam navbar', () => {
  for (const lang of ['ms', 'en', 'ar']) {
    assert.match(
      indexHtml,
      new RegExp(`data-lang="${lang}"`),
      `butang data-lang="${lang}" tidak dijumpai`
    );
  }
  assert.match(indexHtml, /class="lang-switch"/, 'bekas .lang-switch tidak dijumpai');
  assert.match(indexHtml, /js\/i18n\.js/, 'skrip i18n.js tidak dimuatkan');
});

test('bentuk unit Arab mengikut bilangan', () => {
  assert.equal(arabicUnit('days', 0), 'يوم');
  assert.equal(arabicUnit('days', 1), 'يوم');
  assert.equal(arabicUnit('days', 2), 'يومان');
  assert.equal(arabicUnit('days', 5), 'أيام');
  assert.equal(arabicUnit('days', 28), 'يومًا');
  assert.equal(arabicUnit('hours', 19), 'ساعةً');
  assert.equal(arabicUnit('minutes', 44), 'دقيقةً');
  assert.equal(arabicUnit('seconds', 42), 'ثانيةً');
});

test('label unit countdown diuruskan oleh JavaScript', () => {
  const cells = [...indexHtml.matchAll(/data-cd-unit="(\w+)"/g)].map((m) => m[1]);
  assert.equal(cells.length, 8, `jangkaan 8 label unit (2 countdown × 4), dijumpai ${cells.length}`);
  for (const unit of ['days', 'hours', 'minutes', 'seconds']) {
    assert.equal(cells.filter((value) => value === unit).length, 2, `${unit} mesti ada 2 label`);
  }
});

test('hero memakai gaya poster: SAHABAT emas dan lencana terminal KSQ 2026', () => {
  assert.equal(
    [...indexHtml.matchAll(/class="hero-terminal"/g)].length,
    1,
    'mesti ada satu lencana terminal hero'
  );
  assert.match(indexHtml, /class="hero-terminal"[^>]*>[\s\S]*?KSQ 2026/, 'lencana mesti memaparkan KSQ 2026');
  assert.match(STRINGS['hero.titleHtml'][0], /<span>Sahabat<\/span>/, 'BM: SAHABAT mesti dalam span emas');
  assert.match(STRINGS['hero.titleHtml'][1], /<span>Sahabat<\/span>/, 'EN: SAHABAT mesti dalam span emas');
  assert.match(STRINGS['hero.titleHtml'][2], /<span>صاحب<\/span>/, 'AR: صاحب mesti dalam span emas');
  assert.ok(STRINGS['price.original'], 'label harga asal tiada');
  assert.ok(STRINGS['price.promo'], 'label yuran promosi tiada');
});

test('kad sasaran hafazan menyenaraikan empat surah dengan tema dan penjelasan', () => {
  const items = [...indexHtml.matchAll(/<li class="surah-item">/g)];
  assert.equal(items.length, 4, `jangkaan 4 surah, dijumpai ${items.length}`);
  const expected = [
    ['mulk', '30 ayat'],
    ['kahfi', '110 ayat'],
    ['sajdah', '30 ayat'],
    ['insan', '31 ayat']
  ];
  for (const [surah, verses] of expected) {
    for (const field of ['name', 'verses', 'theme', 'detail']) {
      assert.ok(STRINGS[`hafazan.${surah}.${field}`], `kunci hafazan.${surah}.${field} tiada`);
    }
    assert.match(
      indexHtml,
      new RegExp(`hafazan\\.${surah}\\.verses">${verses}<`),
      `${surah} mesti memaparkan ${verses}`
    );
  }
  assert.ok(STRINGS['hafazan.kahfi.note'], 'nota pembahagian ayat Al-Kahfi tiada');
  assert.equal(
    [...indexHtml.matchAll(/data-i18n="hafazan\.more"/g)].length,
    4,
    'mesti ada empat butang penjelasan lanjut'
  );
});
