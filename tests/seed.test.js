/**
 * Static validation for seed data and owner documentation.
 * These tests never call the live Google Apps Script API.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseDate } from '../web/js/time.js';

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = path.join(PROJECT_ROOT, 'web', 'data');
const readJson = (name) => JSON.parse(fs.readFileSync(path.join(DATA_DIR, name), 'utf8'));

const BUDGET_STATUSES = ['Cadangan', 'Dicadangkan', 'Draf', 'Diluluskan', 'Ditolak'];
const TASK_CATEGORIES = [
  'Pendaftaran', 'Destinasi', 'Logistik', 'Kandungan',
  'Kewangan', 'Promosi', 'Hari Program', 'Selepas program'
];

test('all seed JSON files parse and have the expected root shape', () => {
  const tasks = readJson('seed-tasks.json');
  assert.ok(Array.isArray(tasks.tasks));
  assert.ok(Array.isArray(tasks.milestones));
  assert.ok(tasks.meta && tasks.meta.nama);

  const extended = readJson('seed-tugasan-lanjutan.json');
  assert.ok(Array.isArray(extended));

  const budget = readJson('seed-bajet.json');
  assert.ok(Array.isArray(budget.items));

  const facilitators = readJson('seed-fasilitator.json');
  assert.ok(Array.isArray(facilitators.orang));

  const committee = readJson('seed-jawatankuasa.json');
  assert.ok(Array.isArray(committee));
});

test('official task seed uses backend categories and unique tasks', () => {
  const { tasks } = readJson('seed-tasks.json');
  assert.ok(tasks.length >= 30);
  const titles = new Set();
  tasks.forEach((task, index) => {
    assert.ok(TASK_CATEGORIES.includes(task.kategori), `task ${index} category: ${task.kategori}`);
    assert.ok(String(task.tugasan || '').trim().length >= 5, `task ${index} title too short`);
    assert.ok(['Belum', 'Sedang', 'Selesai'].includes(task.status), `task ${index} status: ${task.status}`);
    assert.ok(parseDate(task.deadline), `task ${index} has invalid deadline`);
    assert.ok(!titles.has(task.tugasan), `duplicate task title: ${task.tugasan}`);
    titles.add(task.tugasan);
  });
});

test('extended task seed has unique IDs and valid dates', () => {
  const rows = readJson('seed-tugasan-lanjutan.json');
  assert.equal(rows.length, 40);
  const ids = new Set();
  rows.forEach((row) => {
    assert.match(row.id, /^L\d{2}$/);
    assert.ok(!ids.has(row.id), `duplicate extended task id: ${row.id}`);
    ids.add(row.id);
    assert.ok(String(row.tugasan || '').trim().length >= 5);
    assert.ok(['Belum', 'Sedang', 'Selesai'].includes(row.status));
    assert.ok(parseDate(row.deadline), `invalid deadline: ${row.id}`);
    assert.ok(String(row.pic_jawatan || '').trim(), `missing PIC: ${row.id}`);
  });
});

test('milestones have valid dates and statuses', () => {
  const { milestones } = readJson('seed-tasks.json');
  assert.ok(milestones.length >= 10);
  milestones.forEach((milestone, index) => {
    assert.ok(String(milestone.tajuk || '').trim().length >= 5, `milestone ${index} title`);
    assert.ok(['Belum', 'Selesai'].includes(milestone.status), `milestone ${index} status`);
    assert.ok(parseDate(milestone.tarikh), `milestone ${index} invalid date`);
  });
});

test('budget stays within the RM5,500 ceiling after excluding Cadangan items', () => {
  const budget = readJson('seed-bajet.json');
  assert.equal(budget.siling_rm, 5500);
  assert.equal(budget.kos_teras_anggaran_rm, 5495);
  assert.ok(budget.kos_teras_anggaran_rm <= budget.siling_rm);

  budget.items.forEach((item) => {
    assert.ok(BUDGET_STATUSES.includes(item.status_kelulusan), `invalid status ${item.id}`);
    assert.ok(Number.isFinite(Number(item.anggaran_rm)), `invalid amount ${item.id}`);
    assert.ok(Number(item.anggaran_rm) >= 0, `negative amount ${item.id}`);
    if (item.harga_unit !== null && item.harga_unit !== undefined) {
      assert.equal(
        Number(item.kuantiti) * Number(item.harga_unit),
        Number(item.anggaran_rm),
        `quantity x unit price mismatch for ${item.id}`
      );
    }
  });

  const counted = budget.items.filter((item) => {
    return !['Cadangan', 'Ditolak'].includes(item.status_kelulusan);
  });
  const countedTotal = counted.reduce((sum, item) => sum + Number(item.anggaran_rm), 0);
  assert.equal(countedTotal, 5495);

  const optional = budget.items.filter((item) => item.status_kelulusan === 'Cadangan');
  assert.ok(optional.length > 0, 'optional merchandise/kit items should remain excluded');
  optional.forEach((item) => {
    assert.equal(Number(item.anggaran_rm), 0, `Cadangan item ${item.id} must not carry a cost yet`);
  });
});

test('budget funding formula matches the addendum', () => {
  const budget = readJson('seed-bajet.json');
  const finance = budget.pembiayaan;
  assert.match(finance.formula, /max\(0, jumlah_kos_dikira - hasil_yuran_diterima\)/);
  assert.equal(budget.kapasiti, 40);
  assert.equal(budget.yuran_online_rm, 110);
  assert.equal(budget.yuran_manual_rm, 120);

  assert.equal(finance.hasil_yuran_semua_online_rm, 40 * 110);
  assert.equal(finance.hasil_yuran_semua_manual_rm, 40 * 120);
  assert.equal(finance.dana_masjid_diperlukan_pada_siling_rm.semua_online, 5500 - 4400);
  assert.equal(finance.dana_masjid_diperlukan_pada_siling_rm.semua_manual, 5500 - 4800);
  assert.equal(finance.dana_masjid_diperlukan_pada_kos_teras_rm.semua_online, 5495 - 4400);
  assert.equal(finance.dana_masjid_diperlukan_pada_kos_teras_rm.semua_manual, 5495 - 4800);
});

test('facilitator and committee seeds leave unconfirmed names as placeholders', () => {
  const facilitators = readJson('seed-fasilitator.json');
  assert.ok(facilitators.orang.length >= 3);
  facilitators.orang.forEach((person) => {
    assert.ok(String(person.nama || '').trim());
    assert.ok(['Belum', 'Sudah'].includes(person.status_pengesahan), person.id);
    assert.ok(Number(person.elaun_rm) >= 0, person.id);
  });

  const committee = readJson('seed-jawatankuasa.json');
  assert.ok(committee.length >= 10);
  committee.forEach((member) => {
    assert.match(member.id, /^J\d{2}$/);
    assert.ok(String(member.jawatan || '').trim());
    assert.ok(String(member.nama || '').includes('[ISI'), `unconfirmed name should stay a placeholder: ${member.id}`);
  });
});

test('CSV import template has the documented header and placeholder row', () => {
  const csv = fs.readFileSync(path.join(DATA_DIR, 'peserta-import-templat.csv'), 'utf8').replace(/^\uFEFF/, '');
  const lines = csv.trim().split(/\r?\n/);
  assert.equal(
    lines[0],
    'nama_peserta,umur,jantina,nama_penjaga,tel_penjaga,alahan_kesihatan,kaedah_daftar,saiz_baju,catatan'
  );
  assert.ok(lines.length >= 2);
  assert.match(lines[1], /^Contoh Nama Peserta,/);
});
