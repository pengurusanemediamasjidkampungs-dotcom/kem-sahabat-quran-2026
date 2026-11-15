/**
 * Static checks for the Apps Script backend and browser modules.
 * These tests do not run Google Apps Script and never call the live API.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(PROJECT_ROOT, file), 'utf8');

const CODE = read('backend/Code.gs');
const ADMIN_JS = read('web/js/admin.js');
const REGISTER_JS = read('web/js/register.js');
const FACILITATOR_JS = read('web/js/facilitator.js');
const UI_JS = read('web/js/ui.js');
const API_JS = read('web/js/api.js');
const TIME_JS = read('web/js/time.js');

test('Code.gs is syntactically valid JavaScript', () => {
  assert.doesNotThrow(() => new Function(CODE));
});

test('backend exposes the required public and admin actions', () => {
  const actions = [
    'stats', 'register', 'list', 'updateRegistration', 'registration.createManual',
    'tasks.list', 'tasks.upsert', 'tasks.delete',
    'milestones.list', 'milestones.upsert', 'milestones.delete',
    'budget.list', 'budget.upsert', 'budget.delete',
    'attendance.list', 'attendance.mark', 'facilitator.participants',
    'settings.get', 'settings.set',
    'seed', 'db.info', 'db.setup', 'db.backup'
  ];
  actions.forEach((action) => {
    assert.ok(CODE.includes(`case '${action}'`), `missing action: ${action}`);
  });
});

test('admin-only actions are guarded by requireRole_', () => {
  const blocks = [
    ['list', "'admin'"],
    ['updateRegistration', "'admin'"],
    ['registration.createManual', "'admin'"],
    ['budget.list', "'admin'"],
    ['budget.upsert', "'admin'"],
    ['settings.get', "'admin'"],
    ['settings.set', "'admin'"],
    ['db.backup', "'admin'"]
  ];
  blocks.forEach(([action]) => {
    const pattern = new RegExp(`case '${action}':[\\s\\S]{0,160}?requireRole_\\(token, \\['admin'\\]\\)`);
    assert.match(CODE, pattern, `${action} must be admin-only`);
  });
});

test('facilitator role is limited to participants and attendance', () => {
  const facilitatorCases = [...CODE.matchAll(/case '([^']+)':[\s\S]{0,120}?requireRole_\(token, \[([^\]]+)\]\)/g)]
    .filter((match) => match[2].includes("'fasilitator'"))
    .map((match) => match[1]);
  assert.deepEqual(
    facilitatorCases.sort(),
    ['attendance.list', 'attendance.mark', 'facilitator.participants'].sort()
  );
});

test('registration protects capacity, duplicates and bots', () => {
  assert.match(CODE, /LockService\.getScriptLock\(\)/);
  assert.match(CODE, /ensureNotDuplicate_\(rows, clean\)/);
  assert.match(CODE, /payload\.website/);
  assert.match(CODE, /'Senarai Tunggu'/);
  assert.match(CODE, /isRegistrationOpen_\(settings/);
});

test('tokens come from Script Properties and are compared in constant time', () => {
  assert.match(CODE, /PropertiesService\.getScriptProperties\(\)/);
  assert.match(CODE, /props\.getProperty\('ADMIN_TOKEN'\)/);
  assert.match(CODE, /props\.getProperty\('FASILITATOR_TOKEN'\)/);
  assert.match(CODE, /constantTimeEqual_\(token, admin\)/);
  assert.match(CODE, /constantTimeEqual_\(token, facilitator\)/);
  assert.doesNotMatch(CODE, /ADMIN_TOKEN\s*[:=]\s*['"][^'"]{8,}/);
  assert.doesNotMatch(CODE, /FASILITATOR_TOKEN\s*[:=]\s*['"][^'"]{8,}/);
  assert.doesNotMatch(CODE, /AIza[0-9A-Za-z_-]{20,}/, 'hardcoded Google API key');
  assert.doesNotMatch(CODE, /ya29\.[0-9A-Za-z_-]{20,}/, 'hardcoded OAuth token');
});

test('backend uses Asia/Kuala_Lumpur for stored timestamps', () => {
  assert.match(CODE, /var TZ_ = 'Asia\/Kuala_Lumpur'/);
  assert.match(CODE, /var TZ_SUFFIX_ = '\+08:00'/);
  assert.match(CODE, /Utilities\.formatDate\(date, TZ_/);
  assert.match(CODE, /isoNow_\(\)/);
});

test('online fee reads the diskaun_online setting with the correct spelling', () => {
  assert.equal((CODE.match(/settings\.diskaun_online/g) || []).length, 2);
  assert.doesNotMatch(CODE, /disikaun_online/);
});

test('public stats do not expose participant personal data', () => {
  const start = CODE.indexOf('function statsPayload_');
  const end = CODE.indexOf('function registerPublic_');
  assert.ok(start > 0 && end > start);
  const stats = CODE.slice(start, end);
  assert.doesNotMatch(stats, /nama_peserta/);
  assert.doesNotMatch(stats, /tel_penjaga/);
  assert.doesNotMatch(stats, /nama_penjaga/);
});

test('browser modules never inject dynamic HTML strings', () => {
  const modules = [ADMIN_JS, REGISTER_JS, FACILITATOR_JS, UI_JS, API_JS, TIME_JS];
  modules.forEach((source, index) => {
    assert.doesNotMatch(source, /\.innerHTML\s*=/, `module ${index} assigns innerHTML`);
    assert.doesNotMatch(source, /\.outerHTML\s*=/, `module ${index} assigns outerHTML`);
    assert.doesNotMatch(source, /insertAdjacentHTML/, `module ${index} uses insertAdjacentHTML`);
    assert.doesNotMatch(source, /document\.write\(/, `module ${index} uses document.write`);
    assert.doesNotMatch(source, /\beval\s*\(/, `module ${index} uses eval`);
  });
  assert.match(UI_JS, /node\.textContent = value/);
});

test('config.js contains no secret', () => {
  const config = read('web/config.js');
  assert.doesNotMatch(config, /token/i);
  assert.doesNotMatch(config, /ADMIN_TOKEN/);
  assert.doesNotMatch(config, /FASILITATOR_TOKEN/);
});

test('CSV export starts with a UTF-8 BOM and uses CRLF', () => {
  assert.match(ADMIN_JS, /'\\uFEFF' \+ lines\.join\('\\r\\n'\)/);
  assert.match(ADMIN_JS, /text\/csv;charset=utf-8/);
});

test('facilitator page never calls finance or registration actions', () => {
  assert.doesNotMatch(FACILITATOR_JS, /budget\./);
  assert.doesNotMatch(FACILITATOR_JS, /settings\.(get|set)/);
  assert.doesNotMatch(FACILITATOR_JS, /updateRegistration/);
  assert.doesNotMatch(FACILITATOR_JS, /registration\.createManual/);
  assert.match(FACILITATOR_JS, /facilitator\.participants/);
  assert.match(FACILITATOR_JS, /attendance\.mark/);
});

function cachedIds(jsSource) {
  const block = jsSource.match(/const ids = \[([\s\S]*?)\];/);
  assert.ok(block, 'module should declare a cached id list');
  return [...block[1].matchAll(/'([^']+)'/g)].map((match) => match[1]);
}

function htmlIds(htmlSource) {
  return [...htmlSource.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
}

test('every cached DOM id exists exactly once in its page', () => {
  const pages = [
    ['web/admin.html', ADMIN_JS],
    ['web/index.html', REGISTER_JS],
    ['web/fasilitator.html', FACILITATOR_JS]
  ];
  pages.forEach(([htmlFile, jsSource]) => {
    const ids = htmlIds(read(htmlFile));
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    assert.deepEqual(duplicates, [], `duplicate ids in ${htmlFile}`);
    const set = new Set(ids);
    const missing = cachedIds(jsSource).filter((id) => !set.has(id));
    assert.deepEqual(missing, [], `missing ids in ${htmlFile}`);
  });
});

test('every page loads its controller as an ES module', () => {
  assert.match(read('web/index.html'), /<script type="module" src="js\/register\.js"><\/script>/);
  assert.match(read('web/admin.html'), /<script type="module" src="js\/admin\.js"><\/script>/);
  assert.match(read('web/fasilitator.html'), /<script type="module" src="js\/facilitator\.js"><\/script>/);
});

test('local preview server maps MIME types and blocks path traversal', () => {
  const server = read('serve.js');
  assert.match(server, /'\.html': 'text\/html; charset=utf-8'/);
  assert.match(server, /'\.js': 'text\/javascript; charset=utf-8'/);
  assert.match(server, /relative\.startsWith\('\.\.'\)/);
  assert.match(server, /path\.resolve\(ROOT, '\.' \+ pathname\)/);
  assert.doesNotMatch(server, /0\.0\.0\.0/);
});

test('repository docs do not contain real secrets or deployment ids', () => {
  const files = [
    'README.md', 'AGENTS.md', 'PLAN.md', 'TODO-PEMILIK.md', 'CHANGELOG.md',
    'backend/PASANG-GAS.md'
  ].filter((file) => fs.existsSync(file));
  files.forEach((file) => {
    const source = read(file);
    assert.doesNotMatch(source, /script\.google\.com\/macros\/s\/[A-Za-z0-9_-]{25,}\/exec/, file);
    assert.doesNotMatch(source, /AIza[0-9A-Za-z_-]{20,}/, file);
  });
});
