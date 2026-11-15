/**
 * Finance and privacy helpers shared by MCP tools.
 * All amounts are Malaysian ringgit (RM).
 */

export const BUDGET_CEILING_RM = 5500;
export const CORE_ESTIMATE_RM = 5495;
export const EXCLUDED_BUDGET_STATUSES = ['Cadangan', 'Ditolak'];

export function number(value, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function formatRM(value, decimals = 2) {
  const amount = number(value, 0);
  return 'RM ' + new Intl.NumberFormat('en-MY', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(amount);
}

export function maskPhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length >= 8) {
    return `${digits.slice(0, 3)}-${'x'.repeat(Math.max(2, digits.length - 7))}${digits.slice(-4)}`;
  }
  return 'x'.repeat(digits.length);
}

function isCountedBudgetRow(row) {
  return !EXCLUDED_BUDGET_STATUSES.includes(String(row.status_kelulusan || ''));
}

export function budgetSummary(rows = []) {
  const countedRows = rows.filter(isCountedBudgetRow);
  const optionalRows = rows.filter((row) => !isCountedBudgetRow(row));
  const estimate = countedRows.reduce((sum, row) => sum + number(row.anggaran_rm), 0);
  const actual = countedRows.reduce((sum, row) => sum + number(row.sebenar_rm), 0);
  const optionalEstimate = optionalRows.reduce((sum, row) => sum + number(row.anggaran_rm), 0);
  return {
    items: rows.length,
    countedItems: countedRows.length,
    optionalItems: optionalRows.length,
    estimate,
    actual,
    remaining: estimate - actual,
    optionalEstimate,
    overCeiling: estimate > BUDGET_CEILING_RM,
    ceiling: BUDGET_CEILING_RM,
    headroom: BUDGET_CEILING_RM - estimate
  };
}

export function registrationSummary(rows = []) {
  const active = rows.filter((row) => row.status === 'Disahkan' || row.status === 'Menunggu');
  const confirmed = rows.filter((row) => row.status === 'Disahkan');
  const waitlist = rows.filter((row) => row.status === 'Senarai Tunggu');
  const cancelled = rows.filter((row) => row.status === 'Batal');
  const paid = rows.filter((row) => row.status !== 'Batal' && row.status_bayaran === 'Sudah');
  const target = confirmed.reduce((sum, row) => sum + number(row.yuran_rm), 0);
  const collected = paid.reduce((sum, row) => sum + number(row.yuran_rm), 0);
  return {
    total: rows.length,
    active: active.length,
    confirmed: confirmed.length,
    pending: rows.filter((row) => row.status === 'Menunggu').length,
    waitlist: waitlist.length,
    cancelled: cancelled.length,
    paid: paid.length,
    target,
    collected,
    unpaid: Math.max(0, target - collected)
  };
}

export function financialSummary({ registrations = [], budget = [], ceiling = BUDGET_CEILING_RM } = {}) {
  const regs = registrationSummary(registrations);
  const costs = budgetSummary(budget);
  const fundingNeeded = Math.max(0, costs.estimate - regs.collected);
  const fundingAtCeiling = Math.max(0, ceiling - regs.collected);
  const warnings = [];
  if (costs.estimate > ceiling) {
    warnings.push(`Anggaran RM${costs.estimate.toFixed(2)} melebihi siling ${formatRM(ceiling)}.`);
  }
  if (costs.estimate > regs.collected) {
    warnings.push(`Dana masjid diperlukan: ${formatRM(fundingNeeded)} (formula max(0, kos dikira - yuran diterima)).`);
  }
  const cadangan = budget.filter((row) => row.status_kelulusan === 'Cadangan');
  if (cadangan.length) {
    warnings.push(`${cadangan.length} item Cadangan dikecualikan sehingga diluluskan.`);
  }
  return {
    ceiling,
    coreEstimate: CORE_ESTIMATE_RM,
    registrations: regs,
    budget: costs,
    fundingNeeded,
    fundingAtCeiling,
    withinCeiling: costs.estimate <= ceiling,
    warnings
  };
}
