/**
 * Unit tests for MCP tool handlers.
 * Uses a fake API object; no network calls are made.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { callTool, toolDefinitions } from '../lib/tools.js';

const registrationRows = [
  {
    id: 'KSQ26-0001', masa_daftar: '2026-11-19T09:00:00+08:00', nama_peserta: 'Ahmad',
    umur: 12, jantina: 'L', nama_penjaga: 'Ali', tel_penjaga: '0123456789',
    kaedah_daftar: 'online', yuran_rm: 110, status_bayaran: 'Sudah',
    rujukan_bayaran: 'REF1', status: 'Disahkan', alahan_kesihatan: 'Tiada', catatan: ''
  },
  {
    id: 'KSQ26-0002', masa_daftar: '2026-11-20T10:00:00+08:00', nama_peserta: 'Basir',
    umur: 14, jantina: 'L', nama_penjaga: 'Bakar', tel_penjaga: '0198887777',
    kaedah_daftar: 'manual', yuran_rm: 120, status_bayaran: 'Belum',
    rujukan_bayaran: '', status: 'Menunggu', alahan_kesihatan: 'Alah kacang', catatan: '=CUBA()'
  }
];

const taskRows = [
  {
    id: 'T001', kategori: 'Logistik', tugasan: 'Tempah bas', pic: 'Urus Setia',
    deadline: '2026-11-25T23:59:00+08:00', status: 'Belum', catatan: ''
  },
  {
    id: 'T002', kategori: 'Kewangan', tugasan: 'Kutip yuran', pic: 'Bendahari',
    deadline: '2020-01-01T00:00:00+08:00', status: 'Belum', catatan: ''
  },
  {
    id: 'T003', kategori: 'Logistik', tugasan: 'Beli tag', pic: 'AJK',
    deadline: '2026-12-09T23:59:00+08:00', status: 'Selesai', catatan: ''
  }
];

const budgetRows = [
  { id: 'B01', kategori: 'Pengangkutan', item: 'Bas', anggaran_rm: 1200, sebenar_rm: 0, status_kelulusan: 'Draf' },
  { id: 'B02', kategori: 'Logistik', item: 'Makanan', anggaran_rm: 2025, sebenar_rm: 0, status_kelulusan: 'Draf' },
  { id: 'P01', kategori: 'Merchandise', item: 'Baju-T', anggaran_rm: 500, sebenar_rm: 0, status_kelulusan: 'Cadangan' }
];

function createFakeApi(overrides = {}) {
  const calls = [];
  const api = {
    hasFacilitatorToken: false,
    calls,
    stats: async () => ({
      kapasiti: 40, disahkan: 2, menunggu: 1, senaraiTunggu: 0, bakiSlot: 37,
      pendaftaranDibuka: true, tarikhTutup: '2026-12-07T23:59:00+08:00',
      yuran: { asal: 180, promo: 120, online: 110 }, sumber: 'sistem'
    }),
    adminPost: async (action, payload) => {
      calls.push({ via: 'admin', action, payload });
      switch (action) {
        case 'list': return { registrations: registrationRows };
        case 'tasks.list': return { tasks: taskRows };
        case 'tasks.upsert': return payload.task;
        case 'milestones.list': return {
          milestones: [
            { id: 'M1', tajuk: 'Tutup pendaftaran', tarikh: '2026-12-07', status: 'Belum' },
            { id: 'M2', tajuk: 'Hari 1', tarikh: '2026-12-16', status: 'Belum' },
            { id: 'M3', tajuk: 'Laporan', tarikh: '2026-12-20', status: 'Selesai' }
          ]
        };
        case 'budget.list': return { budget: budgetRows };
        case 'settings.get': return {
          settings: { kapasiti: 40, yuran_online: 110 },
          tokens: { admin: true, facilitator: true },
          sheets: ['Pendaftaran', 'Tetapan']
        };
        case 'db.info': return { sheets: [{ nama: 'Pendaftaran', baris: 2 }], duplicates: [] };
        case 'attendance.list': return {
          attendance: [
            { id_peserta: 'KSQ26-0001', hari1: 'Hadir', hari2: 'Tidak', hari3: '', catatan: '' }
          ]
        };
        case 'facilitator.participants': return {
          participants: [
            { id: 'KSQ26-0001', nama_peserta: 'Ahmad', umur: 12, jantina: 'L', alahan_kesihatan: 'Tiada' },
            { id: 'KSQ26-0002', nama_peserta: 'Basir', umur: 14, jantina: 'L', alahan_kesihatan: 'Alah kacang' }
          ]
        };
        case 'attendance.mark': return { record: { id_peserta: payload.id_peserta, hari: payload.hari } };
        default: throw new Error(`Unexpected admin action: ${action}`);
      }
    },
    facilitatorPost: async (action, payload) => {
      calls.push({ via: 'facilitator', action, payload });
      if (action === 'attendance.list') {
        return { attendance: [{ id_peserta: 'KSQ26-0001', hari1: 'Hadir', hari2: '', hari3: '' }] };
      }
      if (action === 'facilitator.participants') {
        return { participants: [{ id: 'KSQ26-0001', nama_peserta: 'Ahmad', umur: 12, jantina: 'L' }] };
      }
      if (action === 'attendance.mark') {
        return { record: { id_peserta: payload.id_peserta, hari: payload.hari } };
      }
      throw new Error(`Unexpected facilitator action: ${action}`);
    },
    ...overrides
  };
  return api;
}

test('tool definitions are unique, well-formed and include required write limits', () => {
  assert.equal(toolDefinitions.length, 13);
  const names = toolDefinitions.map((tool) => tool.name);
  assert.equal(new Set(names).size, names.length);
  toolDefinitions.forEach((tool) => {
    assert.match(tool.name, /^ksq_[a-z_]+$/);
    assert.ok(tool.description.length > 20, `${tool.name} description too short`);
    assert.equal(tool.inputSchema.type, 'object');
    assert.equal(typeof tool.annotations.readOnlyHint, 'boolean');
    if (tool.inputSchema.required) {
      tool.inputSchema.required.forEach((key) => {
        assert.ok(tool.inputSchema.properties[key], `${tool.name} required key missing from properties: ${key}`);
      });
    }
  });
  const writeTools = toolDefinitions.filter((tool) => tool.annotations.readOnlyHint === false).map((tool) => tool.name);
  assert.deepEqual(writeTools.sort(), ['ksq_mark_attendance', 'ksq_set_task_status']);
});

test('ksq_stats maps the public payload without personal data', async () => {
  const api = createFakeApi();
  const result = await callTool('ksq_stats', {}, api);
  assert.equal(result.kapasiti, 40);
  assert.equal(result.disahkan, 2);
  assert.equal(result.baki_slot, 37);
  assert.equal(result.pendaftaran_dibuka, true);
  assert.equal(JSON.stringify(result).includes('nama_peserta'), false);
});

test('ksq_list_registrations masks phones and health notes by default', async () => {
  const api = createFakeApi();
  const result = await callTool('ksq_list_registrations', { limit: 1 }, api);
  assert.equal(result.total, 2);
  assert.equal(result.returned, 1);
  assert.equal(result.rows[0].id, 'KSQ26-0002');
  assert.equal(result.rows[0].tel_penjaga, '019-xxx7777');
  assert.equal('alahan_kesihatan' in result.rows[0], false);
  assert.equal(result.rows[0].ada_alahan, true);
});

test('ksq_list_registrations can include phones and health notes on request', async () => {
  const api = createFakeApi();
  const result = await callTool('ksq_list_registrations', {
    include_phones: true,
    include_health_notes: true,
    search: 'Basir'
  }, api);
  assert.equal(result.matched, 1);
  assert.equal(result.rows[0].tel_penjaga, '0198887777');
  assert.equal(result.rows[0].alahan_kesihatan, 'Alah kacang');
});

test('ksq_list_registrations filters by status and payment', async () => {
  const api = createFakeApi();
  const result = await callTool('ksq_list_registrations', { status: 'Menunggu', status_bayaran: 'Belum' }, api);
  assert.equal(result.matched, 1);
  assert.equal(result.rows[0].id, 'KSQ26-0002');
});

test('ksq_get_settings returns booleans only for tokens', async () => {
  const api = createFakeApi();
  const result = await callTool('ksq_get_settings', {}, api);
  assert.equal(result.settings.kapasiti, 40);
  assert.equal(result.tokens.admin, true);
  assert.equal(JSON.stringify(result).includes('TOKEN'), false);
});

test('ksq_list_tasks adds a temporal status and filters by category', async () => {
  const api = createFakeApi();
  const all = await callTool('ksq_list_tasks', {}, api);
  assert.equal(all.total, 3);
  assert.equal(all.done, 1);
  const late = all.rows.find((task) => task.id === 'T002');
  assert.equal(late.temporal, 'Lewat');

  const logistic = await callTool('ksq_list_tasks', { kategori: 'Logistik' }, api);
  assert.equal(logistic.matched, 2);
});

test('ksq_set_task_status validates input and updates through tasks.upsert', async () => {
  const api = createFakeApi();
  await assert.rejects(() => callTool('ksq_set_task_status', { id: '', status: 'Selesai' }, api), /id tugasan/);
  await assert.rejects(() => callTool('ksq_set_task_status', { id: 'T001', status: 'Dah' }, api), /status mesti/);
  await assert.rejects(() => callTool('ksq_set_task_status', { id: 'T999', status: 'Selesai' }, api), /tidak dijumpai/);

  const result = await callTool('ksq_set_task_status', { id: 'T001', status: 'Selesai' }, api);
  assert.equal(result.previous_status, 'Belum');
  assert.equal(result.new_status, 'Selesai');
  assert.equal(result.task.status, 'Selesai');
  assert.ok(api.calls.some((call) => call.action === 'tasks.upsert'));
});

test('ksq_list_budget excludes Cadangan items from counted totals', async () => {
  const api = createFakeApi();
  const result = await callTool('ksq_list_budget', {}, api);
  assert.equal(result.summary.items, 3);
  assert.equal(result.summary.countedItems, 2);
  assert.equal(result.summary.estimate, 3225);
  assert.equal(result.rows.find((row) => row.id === 'P01').dikira, false);
  assert.equal(result.ceiling, 5500);
});

test('ksq_financial_summary computes funding with the addendum formula', async () => {
  const api = createFakeApi();
  const result = await callTool('ksq_financial_summary', {}, api);
  assert.equal(result.budget.estimate, 3225);
  assert.equal(result.registrations.collected, 110);
  assert.equal(result.fundingNeeded, 3115);
  assert.equal(result.withinCeiling, true);
  assert.equal(result.ringkasan_teks.dana_masjid, 'RM 3,115.00');
});

test('ksq_list_attendance merges participants and attendance, with day filters', async () => {
  const api = createFakeApi();
  const all = await callTool('ksq_list_attendance', {}, api);
  assert.equal(all.count, 2);
  assert.equal(all.hadir.hari1, 1);
  assert.equal(all.rows.find((row) => row.id === 'KSQ26-0002').hari1, 'Belum');

  const hadir = await callTool('ksq_list_attendance', { hari: 1, nilai: 'Hadir' }, api);
  assert.equal(hadir.count, 1);
  assert.equal(hadir.rows[0].id, 'KSQ26-0001');

  const belum = await callTool('ksq_list_attendance', { hari: 1, nilai: 'Belum' }, api);
  assert.equal(belum.count, 1);
  assert.equal(belum.rows[0].id, 'KSQ26-0002');
});

test('ksq_mark_attendance prefers the facilitator token and validates the day', async () => {
  const api = createFakeApi({ hasFacilitatorToken: true });
  await assert.rejects(() => callTool('ksq_mark_attendance', { id_peserta: '', hari: 1, hadir: true }, api), /id_peserta/);
  await assert.rejects(() => callTool('ksq_mark_attendance', { id_peserta: 'KSQ26-0001', hari: 4, hadir: true }, api), /hari mesti/);

  const result = await callTool('ksq_mark_attendance', { id_peserta: 'KSQ26-0001', hari: 2, hadir: true }, api);
  assert.equal(result.ok, true);
  const call = api.calls.find((item) => item.action === 'attendance.mark');
  assert.equal(call.via, 'facilitator');
  assert.equal(call.payload.hadir, true);
});

test('ksq_mark_attendance falls back to the admin token', async () => {
  const api = createFakeApi();
  await callTool('ksq_mark_attendance', { id_peserta: 'KSQ26-0001', hari: 3, hadir: false }, api);
  const call = api.calls.find((item) => item.action === 'attendance.mark');
  assert.equal(call.via, 'admin');
  assert.equal(call.payload.hadir, false);
});

test('ksq_export_registrations_csv emits BOM, CRLF and masked phones', async () => {
  const api = createFakeApi();
  const result = await callTool('ksq_export_registrations_csv', {}, api);
  assert.ok(result.csv.startsWith('\uFEFF'));
  assert.ok(result.csv.includes('\r\n'));
  assert.equal(result.rows, 2);
  assert.match(result.csv, /019-xxx7777/);
  assert.doesNotMatch(result.csv, /0198887777/);
  assert.ok(result.csv.includes("'=CUBA()"), 'formula must be neutralised');
  assert.match(result.filename, /^KSQ26-pendaftaran-\d{4}-\d{2}-\d{2}\.csv$/);

  const withPhones = await callTool('ksq_export_registrations_csv', { include_phones: true }, api);
  assert.match(withPhones.csv, /0198887777/);
});

test('ksq_db_info passes maintenance data through unchanged', async () => {
  const api = createFakeApi();
  const result = await callTool('ksq_db_info', {}, api);
  assert.equal(result.sheets[0].nama, 'Pendaftaran');
  assert.deepEqual(result.duplicates, []);
});

test('ksq_dashboard aggregates slots, tasks and milestones', async () => {
  const api = createFakeApi();
  const result = await callTool('ksq_dashboard', {}, api);
  assert.equal(result.slot.kapasiti, 40);
  assert.equal(result.slot.baki, 37);
  assert.equal(result.pendaftaran.confirmed, 1);
  assert.equal(result.tugasan.jumlah, 3);
  assert.equal(result.tugasan.selesai, 1);
  assert.equal(result.tugasan.lewat, 1);
  assert.ok(result.milestone_seterusnya.every((milestone) => milestone.status !== 'Selesai'));
  assert.ok(result.amaran.some((line) => line.includes('tugasan lewat')));
});

test('unknown tools are rejected', async () => {
  const api = createFakeApi();
  await assert.rejects(() => callTool('ksq_delete_everything', {}, api), /tidak dikenali/);
});
