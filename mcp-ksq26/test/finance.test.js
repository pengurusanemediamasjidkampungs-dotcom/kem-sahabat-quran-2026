/**
 * Unit tests for MCP finance helpers.
 * Run from mcp-ksq26: node --test "test/*.test.js"
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  BUDGET_CEILING_RM,
  CORE_ESTIMATE_RM,
  budgetSummary,
  financialSummary,
  formatRM,
  maskPhone,
  number,
  registrationSummary
} from '../lib/finance.js';

const budgetRows = [
  { id: 'B01', kategori: 'Pengangkutan', anggaran_rm: 1200, sebenar_rm: 0, status_kelulusan: 'Draf' },
  { id: 'B02', kategori: 'Kandungan', anggaran_rm: 600, sebenar_rm: 0, status_kelulusan: 'Dicadangkan' },
  { id: 'B03', kategori: 'Logistik', anggaran_rm: 1200, sebenar_rm: 300, status_kelulusan: 'Diluluskan' },
  { id: 'P01', kategori: 'Merchandise', anggaran_rm: 900, sebenar_rm: 0, status_kelulusan: 'Cadangan' },
  { id: 'P02', kategori: 'Merchandise', anggaran_rm: 100, sebenar_rm: 0, status_kelulusan: 'Ditolak' }
];

test('number falls back for invalid values', () => {
  assert.equal(number('120.5'), 120.5);
  assert.equal(number('abc', 7), 7);
  assert.equal(number(null, 3), 3);
  assert.equal(number(undefined), 0);
});

test('formatRM uses two decimals and the RM prefix', () => {
  assert.equal(formatRM(5495), 'RM 5,495.00');
  assert.equal(formatRM(0), 'RM 0.00');
  assert.equal(formatRM('120.5'), 'RM 120.50');
});

test('maskPhone hides the middle digits but keeps a prefix and suffix', () => {
  assert.equal(maskPhone('0123456789'), '012-xxx6789');
  assert.equal(maskPhone('012-345 6789'), '012-xxx6789');
  assert.equal(maskPhone(''), '');
  assert.equal(maskPhone(null), '');
  assert.match(maskPhone('12345'), /^x+$/);
});

test('budgetSummary excludes Cadangan and Ditolak from counted totals', () => {
  const summary = budgetSummary(budgetRows);
  assert.equal(summary.items, 5);
  assert.equal(summary.countedItems, 3);
  assert.equal(summary.optionalItems, 2);
  assert.equal(summary.estimate, 3000);
  assert.equal(summary.actual, 300);
  assert.equal(summary.remaining, 2700);
  assert.equal(summary.optionalEstimate, 1000);
  assert.equal(summary.ceiling, BUDGET_CEILING_RM);
  assert.equal(summary.headroom, 2500);
  assert.equal(summary.overCeiling, false);
});

test('budgetSummary flags estimates above the RM5,500 ceiling', () => {
  const summary = budgetSummary([
    { anggaran_rm: 5495, status_kelulusan: 'Draf' },
    { anggaran_rm: 10, status_kelulusan: 'Diluluskan' }
  ]);
  assert.equal(summary.estimate, 5505);
  assert.equal(summary.overCeiling, true);
  assert.equal(summary.headroom, -5);
  assert.equal(CORE_ESTIMATE_RM, 5495);
});

test('registrationSummary only treats non-cancelled paid rows as collected', () => {
  const rows = [
    { status: 'Disahkan', status_bayaran: 'Sudah', yuran_rm: 110 },
    { status: 'Disahkan', status_bayaran: 'Belum', yuran_rm: 110 },
    { status: 'Menunggu', status_bayaran: 'Sudah', yuran_rm: 120 },
    { status: 'Senarai Tunggu', status_bayaran: 'Sudah', yuran_rm: 120 },
    { status: 'Batal', status_bayaran: 'Sudah', yuran_rm: 120 }
  ];
  const summary = registrationSummary(rows);
  assert.equal(summary.total, 5);
  assert.equal(summary.active, 3);
  assert.equal(summary.confirmed, 2);
  assert.equal(summary.pending, 1);
  assert.equal(summary.waitlist, 1);
  assert.equal(summary.cancelled, 1);
  assert.equal(summary.paid, 3);
  assert.equal(summary.target, 220);
  assert.equal(summary.collected, 350);
  assert.equal(summary.unpaid, 0);
});

test('financialSummary applies max(0, counted cost - fees received)', () => {
  const summary = financialSummary({
    registrations: [
      { status: 'Disahkan', status_bayaran: 'Sudah', yuran_rm: 110 },
      { status: 'Disahkan', status_bayaran: 'Sudah', yuran_rm: 110 }
    ],
    budget: budgetRows
  });
  assert.equal(summary.ceiling, 5500);
  assert.equal(summary.budget.estimate, 3000);
  assert.equal(summary.registrations.collected, 220);
  assert.equal(summary.fundingNeeded, 2780);
  assert.equal(summary.fundingAtCeiling, 5280);
  assert.equal(summary.withinCeiling, true);
  assert.ok(summary.warnings.some((line) => line.includes('Dana masjid diperlukan')));
  assert.ok(summary.warnings.some((line) => line.includes('Cadangan')));
});

test('financialSummary never returns a negative funding need', () => {
  const summary = financialSummary({
    registrations: [{ status: 'Disahkan', status_bayaran: 'Sudah', yuran_rm: 4800 }],
    budget: [{ anggaran_rm: 1200, status_kelulusan: 'Draf' }]
  });
  assert.equal(summary.fundingNeeded, 0);
  assert.equal(summary.fundingAtCeiling, 700);
  assert.equal(summary.warnings.some((line) => line.includes('Dana masjid diperlukan')), false);
});
