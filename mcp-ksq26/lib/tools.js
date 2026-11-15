/**
 * MCP tool definitions and handlers for KSQ 2026.
 * The server is intentionally thin: it exposes the existing Apps Script API.
 */

import { ApiError } from './api-client.js';
import {
  BUDGET_CEILING_RM,
  CORE_ESTIMATE_RM,
  budgetSummary,
  financialSummary,
  formatRM,
  maskPhone,
  number,
  registrationSummary
} from './finance.js';

const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true };
const MUTATING = { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true };

function text(value, max = 200) {
  return String(value ?? '').trim().slice(0, max);
}

function clampLimit(value, fallback = 20, max = 100) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(max, Math.floor(parsed));
}

function sortNewest(rows) {
  return rows.slice().sort((a, b) => String(b.masa_daftar || '').localeCompare(String(a.masa_daftar || '')));
}

export const toolDefinitions = [
  {
    name: 'ksq_stats',
    title: 'Statistik awam KSQ',
    description: 'Baca statistik awam: kapasiti, bilangan disahkan/menunggu, baki slot, yuran dan tarikh tutup. Tiada data peribadi. Tidak memerlukan token.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: READ_ONLY
  },
  {
    name: 'ksq_dashboard',
    title: 'Ringkasan dashboard',
    description: 'Ringkasan pentadbir: slot, kewangan, tugasan lewat/hari ini, milestone seterusnya dan amaran. Memerlukan KSQ_ADMIN_TOKEN.',
    inputSchema: {
      type: 'object',
      properties: {
        days_ahead: { type: 'integer', minimum: 1, maximum: 30, default: 7, description: 'Tetingkap tugasan akan datang.' }
      },
      additionalProperties: false
    },
    annotations: READ_ONLY
  },
  {
    name: 'ksq_list_registrations',
    title: 'Senarai pendaftaran',
    description: 'Senarai pendaftaran dengan tapisan status, bayaran, kaedah dan carian. Nombor telefon disamarkan secara lalai. Memerlukan KSQ_ADMIN_TOKEN.',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['Disahkan', 'Menunggu', 'Senarai Tunggu', 'Batal'] },
        status_bayaran: { type: 'string', enum: ['Belum', 'Sudah', 'Dikecualikan'] },
        kaedah_daftar: { type: 'string', enum: ['online', 'manual'] },
        search: { type: 'string', description: 'Carian pada ID, nama peserta, nama penjaga atau telefon.' },
        limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
        include_phones: { type: 'boolean', default: false, description: 'Jika true, pulangkan nombor telefon penuh. Gunakan hanya bila perlu.' },
        include_health_notes: { type: 'boolean', default: false, description: 'Jika true, pulangkan teks alahan/kesihatan penuh.' }
      },
      additionalProperties: false
    },
    annotations: READ_ONLY
  },
  {
    name: 'ksq_get_settings',
    title: 'Tetapan program',
    description: 'Baca tetapan program (kapasiti, yuran, tarikh, urus setia, sumber pendaftaran). Token tidak dipulangkan. Memerlukan KSQ_ADMIN_TOKEN.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: READ_ONLY
  },
  {
    name: 'ksq_list_tasks',
    title: 'Senarai tugasan',
    description: 'Senarai tugasan checklist dengan tapisan kategori/status dan carian. Memerlukan KSQ_ADMIN_TOKEN.',
    inputSchema: {
      type: 'object',
      properties: {
        kategori: { type: 'string' },
        status: { type: 'string', enum: ['Belum', 'Sedang', 'Selesai'] },
        search: { type: 'string' },
        limit: { type: 'integer', minimum: 1, maximum: 200, default: 100 }
      },
      additionalProperties: false
    },
    annotations: READ_ONLY
  },
  {
    name: 'ksq_set_task_status',
    title: 'Kemas kini status tugasan',
    description: 'Tukar status satu tugasan kepada Belum, Sedang atau Selesai. Mengubah Google Sheets. Memerlukan KSQ_ADMIN_TOKEN.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID tugasan, contoh T001.' },
        status: { type: 'string', enum: ['Belum', 'Sedang', 'Selesai'] }
      },
      required: ['id', 'status'],
      additionalProperties: false
    },
    annotations: MUTATING
  },
  {
    name: 'ksq_list_milestones',
    title: 'Senarai milestone',
    description: 'Senarai milestone program dan statusnya. Memerlukan KSQ_ADMIN_TOKEN.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: READ_ONLY
  },
  {
    name: 'ksq_list_budget',
    title: 'Senarai bajet',
    description: 'Senarai item bajet, jumlah dikira (tidak termasuk Cadangan/Ditolak), baki dan amaran siling RM5,500. Memerlukan KSQ_ADMIN_TOKEN.',
    inputSchema: {
      type: 'object',
      properties: {
        kategori: { type: 'string' },
        include_excluded: { type: 'boolean', default: true, description: 'Sertakan item Cadangan/Ditolak dalam senarai.' }
      },
      additionalProperties: false
    },
    annotations: READ_ONLY
  },
  {
    name: 'ksq_financial_summary',
    title: 'Ringkasan kewangan',
    description: 'Kira hasil yuran diterima, sasaran, kos dikira, dana masjid diperlukan (max(0, kos - yuran diterima)), siling dan jurang. Memerlukan KSQ_ADMIN_TOKEN.',
    inputSchema: {
      type: 'object',
      properties: {
        ceiling_rm: { type: 'number', minimum: 0, default: 5500, description: 'Siling perbelanjaan. Lalai RM5,500.' }
      },
      additionalProperties: false
    },
    annotations: READ_ONLY
  },
  {
    name: 'ksq_list_attendance',
    title: 'Senarai kehadiran',
    description: 'Baca rekod kehadiran peserta. Memerlukan KSQ_FASILITATOR_TOKEN atau KSQ_ADMIN_TOKEN.',
    inputSchema: {
      type: 'object',
      properties: {
        hari: { type: 'integer', enum: [1, 2, 3], description: 'Tapis kepada hari tertentu (pilihan).' },
        nilai: { type: 'string', enum: ['Hadir', 'Tidak', 'Belum'], description: 'Tapis status hari yang dipilih.' }
      },
      additionalProperties: false
    },
    annotations: READ_ONLY
  },
  {
    name: 'ksq_mark_attendance',
    title: 'Tanda kehadiran',
    description: 'Tanda peserta Disahkan hadir atau tidak hadir untuk Hari 1, 2 atau 3. Mengubah Google Sheets. Memerlukan KSQ_FASILITATOR_TOKEN atau KSQ_ADMIN_TOKEN.',
    inputSchema: {
      type: 'object',
      properties: {
        id_peserta: { type: 'string', description: 'ID peserta, contoh KSQ26-0001.' },
        hari: { type: 'integer', enum: [1, 2, 3] },
        hadir: { type: 'boolean' }
      },
      required: ['id_peserta', 'hari', 'hadir'],
      additionalProperties: false
    },
    annotations: MUTATING
  },
  {
    name: 'ksq_export_registrations_csv',
    title: 'Eksport CSV pendaftaran',
    description: 'Hasilkan kandungan CSV pendaftaran (UTF-8 BOM, CRLF) untuk disimpan oleh klien. Nombor telefon disamarkan kecuali include_phones=true. Memerlukan KSQ_ADMIN_TOKEN.',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['Disahkan', 'Menunggu', 'Senarai Tunggu', 'Batal'] },
        status_bayaran: { type: 'string', enum: ['Belum', 'Sudah', 'Dikecualikan'] },
        include_phones: { type: 'boolean', default: false }
      },
      additionalProperties: false
    },
    annotations: READ_ONLY
  },
  {
    name: 'ksq_db_info',
    title: 'Maklumat pangkalan data',
    description: 'Semak kewujudan helaian, pengepala, ID berganda dan rekod kehadiran yatim. Memerlukan KSQ_ADMIN_TOKEN.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: READ_ONLY
  }
];

function csvEscape(value) {
  let valueText = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(valueText.trim())) valueText = "'" + valueText;
  if (/[",\r\n]/.test(valueText)) return '"' + valueText.replace(/"/g, '""') + '"';
  return valueText;
}

function publicRegistration(row, options) {
  const result = {
    id: row.id,
    masa_daftar: row.masa_daftar,
    nama_peserta: row.nama_peserta,
    umur: number(row.umur),
    jantina: row.jantina,
    nama_penjaga: row.nama_penjaga,
    tel_penjaga: options.includePhones ? row.tel_penjaga : maskPhone(row.tel_penjaga),
    kaedah_daftar: row.kaedah_daftar,
    yuran_rm: number(row.yuran_rm),
    status_bayaran: row.status_bayaran,
    rujukan_bayaran: row.rujukan_bayaran,
    status: row.status,
    ada_alahan: Boolean(text(row.alahan_kesihatan) && text(row.alahan_kesihatan).toLowerCase() !== 'tiada'),
    catatan: row.catatan
  };
  if (options.includeHealth) result.alahan_kesihatan = row.alahan_kesihatan;
  return result;
}

function filterRegistrations(rows, args) {
  const term = text(args.search, 120).toLowerCase();
  return rows.filter((row) => {
    if (args.status && row.status !== args.status) return false;
    if (args.status_bayaran && row.status_bayaran !== args.status_bayaran) return false;
    if (args.kaedah_daftar && row.kaedah_daftar !== args.kaedah_daftar) return false;
    if (!term) return true;
    return [row.id, row.nama_peserta, row.nama_penjaga, row.tel_penjaga, row.catatan]
      .join(' ')
      .toLowerCase()
      .includes(term);
  });
}

async function attendanceCall(api, action, payload) {
  if (api.hasFacilitatorToken) return api.facilitatorPost(action, payload);
  return api.adminPost(action, payload);
}

function taskTemporalStatus(task, now = new Date()) {
  if (task.status === 'Selesai') return 'Selesai';
  const deadline = Date.parse(task.deadline);
  if (!Number.isFinite(deadline)) return 'Tiada tarikh';
  if (now.getTime() > deadline) return 'Lewat';
  const key = (date) => new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kuala_Lumpur', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(date);
  return key(now) === key(new Date(deadline)) ? 'Hari ini' : 'Akan datang';
}

function daysBetweenKeys(fromKey, toKey) {
  const toDay = (key) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(key || ''));
    if (!match) return NaN;
    return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / 86400000;
  };
  const from = toDay(fromKey);
  const to = toDay(toKey);
  if (!Number.isFinite(from) || !Number.isFinite(to)) return 0;
  return Math.round(to - from);
}

function dateKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kuala_Lumpur', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(date);
  const map = {};
  parts.forEach((part) => { map[part.type] = part.value; });
  return `${map.year}-${map.month}-${map.day}`;
}

export async function callTool(name, args = {}, api) {
  switch (name) {
    case 'ksq_stats': {
      const stats = await api.stats();
      return {
        kapasiti: number(stats.kapasiti),
        disahkan: number(stats.disahkan),
        menunggu: number(stats.menunggu),
        senarai_tunggu: number(stats.senaraiTunggu),
        baki_slot: number(stats.bakiSlot),
        pendaftaran_dibuka: Boolean(stats.pendaftaranDibuka),
        tarikh_tutup: stats.tarikhTutup,
        yuran: stats.yuran,
        sumber: stats.sumber
      };
    }

    case 'ksq_list_registrations': {
      const data = await api.adminPost('list', {});
      const all = Array.isArray(data.registrations) ? data.registrations : [];
      const matched = filterRegistrations(all, args);
      const limit = clampLimit(args.limit, 20, 100);
      const rows = sortNewest(matched).slice(0, limit).map((row) => publicRegistration(row, {
        includePhones: args.include_phones === true,
        includeHealth: args.include_health_notes === true
      }));
      return {
        total: all.length,
        matched: matched.length,
        returned: rows.length,
        phones_included: args.include_phones === true,
        rows,
        nota: args.include_phones === true ? 'Nombor telefon penuh dipulangkan.' : 'Nombor telefon disamarkan.'
      };
    }

    case 'ksq_get_settings': {
      const data = await api.adminPost('settings.get', {});
      return {
        settings: data.settings,
        tokens: data.tokens,
        sheets: data.sheets
      };
    }

    case 'ksq_list_tasks': {
      const data = await api.adminPost('tasks.list', {});
      const all = Array.isArray(data.tasks) ? data.tasks : [];
      const term = text(args.search, 120).toLowerCase();
      const filtered = all.filter((task) => {
        if (args.kategori && task.kategori !== args.kategori) return false;
        if (args.status && task.status !== args.status) return false;
        if (!term) return true;
        return [task.id, task.tugasan, task.pic, task.catatan, task.kategori].join(' ').toLowerCase().includes(term);
      });
      const limit = clampLimit(args.limit, 100, 200);
      const rows = filtered.slice(0, limit).map((task) => ({
        ...task,
        temporal: taskTemporalStatus(task)
      }));
      return {
        total: all.length,
        matched: filtered.length,
        returned: rows.length,
        done: all.filter((task) => task.status === 'Selesai').length,
        rows
      };
    }

    case 'ksq_set_task_status': {
      const id = text(args.id, 40);
      if (!id) throw new ApiError('id tugasan diperlukan.', 'VALIDATION');
      if (!['Belum', 'Sedang', 'Selesai'].includes(args.status)) {
        throw new ApiError('status mesti Belum, Sedang atau Selesai.', 'VALIDATION');
      }
      const data = await api.adminPost('tasks.list', {});
      const tasks = Array.isArray(data.tasks) ? data.tasks : [];
      const existing = tasks.find((task) => String(task.id) === id);
      if (!existing) throw new ApiError(`Tugasan ${id} tidak dijumpai.`, 'NOT_FOUND');
      const updated = await api.adminPost('tasks.upsert', {
        task: { ...existing, status: args.status }
      });
      return {
        ok: true,
        id,
        previous_status: existing.status,
        new_status: args.status,
        task: updated
      };
    }

    case 'ksq_list_milestones': {
      const data = await api.adminPost('milestones.list', {});
      const rows = (Array.isArray(data.milestones) ? data.milestones : [])
        .slice()
        .sort((a, b) => String(a.tarikh).localeCompare(String(b.tarikh)));
      return { count: rows.length, rows };
    }

    case 'ksq_list_budget': {
      const data = await api.adminPost('budget.list', {});
      const all = Array.isArray(data.budget) ? data.budget : [];
      const filtered = args.kategori
        ? all.filter((row) => String(row.kategori || '').toLowerCase() === String(args.kategori).toLowerCase())
        : all;
      const summary = budgetSummary(filtered);
      const rows = (args.include_excluded === false
        ? filtered.filter((row) => !['Cadangan', 'Ditolak'].includes(String(row.status_kelulusan || '')))
        : filtered
      ).map((row) => ({
        ...row,
        anggaran_rm: number(row.anggaran_rm),
        sebenar_rm: number(row.sebenar_rm),
        dikira: !['Cadangan', 'Ditolak'].includes(String(row.status_kelulusan || ''))
      }));
      return {
        ceiling: BUDGET_CEILING_RM,
        core_estimate_reference: CORE_ESTIMATE_RM,
        summary,
        rows
      };
    }

    case 'ksq_financial_summary': {
      const [regData, budgetData] = await Promise.all([
        api.adminPost('list', {}),
        api.adminPost('budget.list', {})
      ]);
      const registrations = Array.isArray(regData.registrations) ? regData.registrations : [];
      const budget = Array.isArray(budgetData.budget) ? budgetData.budget : [];
      const ceiling = number(args.ceiling_rm, BUDGET_CEILING_RM) || BUDGET_CEILING_RM;
      const summary = financialSummary({ registrations, budget, ceiling });
      return {
        ...summary,
        ringkasan_teks: {
          yuran: `${formatRM(summary.registrations.collected)} diterima daripada sasaran ${formatRM(summary.registrations.target)}`,
          kos: `${formatRM(summary.budget.estimate)} dikira (${summary.budget.countedItems} item)`,
          dana_masjid: formatRM(summary.fundingNeeded),
          siling: `${formatRM(summary.budget.estimate)} / ${formatRM(summary.ceiling)}`
        },
        nota: 'Item Cadangan dan Ditolak tidak dikira. Angka seed ialah anggaran sehingga bendahari mengesahkan.'
      };
    }

    case 'ksq_list_attendance': {
      const [attendanceData, participantsData] = await Promise.all([
        attendanceCall(api, 'attendance.list', {}),
        attendanceCall(api, 'facilitator.participants', {})
      ]);
      const attendance = Array.isArray(attendanceData.attendance) ? attendanceData.attendance : [];
      const participants = Array.isArray(participantsData.participants) ? participantsData.participants : [];
      const map = {};
      attendance.forEach((row) => { map[String(row.id_peserta)] = row; });
      let rows = participants.map((person) => {
        const record = map[String(person.id)] || {};
        return {
          id: person.id,
          nama_peserta: person.nama_peserta,
          hari1: record.hari1 || 'Belum',
          hari2: record.hari2 || 'Belum',
          hari3: record.hari3 || 'Belum',
          catatan: record.catatan || ''
        };
      });
      if (args.hari) {
        const key = `hari${args.hari}`;
        if (args.nilai && args.nilai !== 'Belum') {
          rows = rows.filter((row) => row[key] === args.nilai);
        } else if (args.nilai === 'Belum') {
          rows = rows.filter((row) => !row[key] || row[key] === 'Belum');
        }
      }
      return {
        count: rows.length,
        hadir: {
          hari1: participants.filter((person) => map[person.id]?.hari1 === 'Hadir').length,
          hari2: participants.filter((person) => map[person.id]?.hari2 === 'Hadir').length,
          hari3: participants.filter((person) => map[person.id]?.hari3 === 'Hadir').length
        },
        rows
      };
    }

    case 'ksq_mark_attendance': {
      const id = text(args.id_peserta, 40);
      const day = Number(args.hari);
      if (!id) throw new ApiError('id_peserta diperlukan.', 'VALIDATION');
      if (![1, 2, 3].includes(day)) throw new ApiError('hari mesti 1, 2 atau 3.', 'VALIDATION');
      const result = await attendanceCall(api, 'attendance.mark', {
        id_peserta: id,
        hari: day,
        hadir: args.hadir === true
      });
      return { ok: true, ...result };
    }

    case 'ksq_export_registrations_csv': {
      const data = await api.adminPost('list', {});
      const all = Array.isArray(data.registrations) ? data.registrations : [];
      const filtered = filterRegistrations(all, args);
      const headers = [
        'id', 'masa_daftar', 'nama_peserta', 'umur', 'jantina', 'nama_penjaga', 'tel_penjaga',
        'alahan_kesihatan', 'kaedah_daftar', 'yuran_rm', 'status_bayaran', 'rujukan_bayaran',
        'status', 'catatan'
      ];
      const lines = [headers.join(',')];
      sortNewest(filtered).forEach((row) => {
        const copy = {
          ...row,
          tel_penjaga: args.include_phones === true ? row.tel_penjaga : maskPhone(row.tel_penjaga)
        };
        lines.push(headers.map((key) => csvEscape(copy[key])).join(','));
      });
      return {
        filename: `KSQ26-pendaftaran-${dateKey(new Date())}.csv`,
        rows: filtered.length,
        phones_included: args.include_phones === true,
        csv: '\uFEFF' + lines.join('\r\n')
      };
    }

    case 'ksq_db_info': {
      const info = await api.adminPost('db.info', {});
      return info;
    }

    case 'ksq_dashboard': {
      const [stats, regData, taskData, milestoneData] = await Promise.all([
        api.stats(),
        api.adminPost('list', {}),
        api.adminPost('tasks.list', {}),
        api.adminPost('milestones.list', {})
      ]);
      const registrations = Array.isArray(regData.registrations) ? regData.registrations : [];
      const tasks = Array.isArray(taskData.tasks) ? taskData.tasks : [];
      const milestones = Array.isArray(milestoneData.milestones) ? milestoneData.milestones : [];
      const regs = registrationSummary(registrations);
      const today = dateKey(new Date());
      const daysAhead = clampLimit(args.days_ahead, 7, 30);
      const due = tasks
        .filter((task) => {
          if (task.status === 'Selesai') return false;
          const temporal = taskTemporalStatus(task);
          if (temporal === 'Lewat' || temporal === 'Hari ini') return true;
          const diff = daysBetweenKeys(today, dateKey(task.deadline));
          return diff >= 0 && diff <= daysAhead;
        })
        .sort((a, b) => String(a.deadline).localeCompare(String(b.deadline)))
        .slice(0, 12)
        .map((task) => ({ ...task, temporal: taskTemporalStatus(task) }));
      const upcomingMilestones = milestones
        .filter((milestone) => milestone.status !== 'Selesai' && dateKey(milestone.tarikh) >= today)
        .sort((a, b) => String(a.tarikh).localeCompare(String(b.tarikh)))
        .slice(0, 3);
      return {
        slot: {
          kapasiti: number(stats.kapasiti),
          disahkan: number(stats.disahkan),
          menunggu: number(stats.menunggu),
          senarai_tunggu: number(stats.senaraiTunggu),
          baki: number(stats.bakiSlot),
          pendaftaran_dibuka: Boolean(stats.pendaftaranDibuka),
          tarikh_tutup: stats.tarikhTutup
        },
        pendaftaran: regs,
        tugasan: {
          jumlah: tasks.length,
          selesai: tasks.filter((task) => task.status === 'Selesai').length,
          lewat: tasks.filter((task) => taskTemporalStatus(task) === 'Lewat').length,
          hari_ini: tasks.filter((task) => taskTemporalStatus(task) === 'Hari ini').length,
          akan_datang: due
        },
        milestone_seterusnya: upcomingMilestones,
        amaran: [
          ...(number(stats.bakiSlot) > 0 && number(stats.bakiSlot) < 10
            ? [`Baki slot tinggal ${number(stats.bakiSlot)}.`]
            : []),
          ...(tasks.filter((task) => taskTemporalStatus(task) === 'Lewat').length
            ? [`${tasks.filter((task) => taskTemporalStatus(task) === 'Lewat').length} tugasan lewat.`]
            : [])
        ]
      };
    }

    default:
      throw new ApiError(`Alat tidak dikenali: ${name}`, 'UNKNOWN_TOOL');
  }
}
