/**
 * KSQ 2026 — Backend Google Apps Script
 * Sistem Pengurusan Kem Sahabat Quran 2026
 * Masjid Kampung Sungai Lang Baru, Banting
 *
 * Semua masa disimpan sebagai teks ISO 8601 dengan +08:00 (Asia/Kuala_Lumpur).
 * Rahsia (ADMIN_TOKEN, FASILITATOR_TOKEN, VIEWER_TOKEN) hanya dalam Script Properties.
 */

var TZ_ = 'Asia/Kuala_Lumpur';
var TZ_SUFFIX_ = '+08:00';

var SHEETS_ = {
  Pendaftaran: [
    'id', 'masa_daftar', 'nama_peserta', 'umur', 'jantina', 'nama_penjaga',
    'tel_penjaga', 'lancar_quran', 'alahan_kesihatan', 'kaedah_daftar',
    'yuran_rm', 'status_bayaran', 'rujukan_bayaran', 'status', 'catatan'
  ],
  Tetapan: ['kunci', 'nilai'],
  Tugasan: ['id', 'kategori', 'tugasan', 'pic', 'deadline', 'status', 'catatan', 'dikemaskini'],
  Milestone: ['id', 'tajuk', 'tarikh', 'penerangan', 'status'],
  Bajet: ['id', 'item', 'kategori', 'anggaran_rm', 'sebenar_rm', 'catatan'],
  Kehadiran: ['id_peserta', 'hari1', 'hari2', 'hari3', 'catatan'],
  Hebahan: [
    'id', 'tajuk', 'kandungan', 'kategori', 'tarikh_mula', 'tarikh_tamat',
    'penting', 'status', 'dikemaskini'
  ],
  Log: ['masa', 'tindakan', 'butiran']
};

var DEFAULT_SETTINGS_ = {
  kapasiti: '40',
  yuran_asal: '180',
  yuran_promo: '120',
  diskaun_online: '10',
  tarikh_mula: '2026-12-14T08:00:00+08:00',
  tarikh_tamat: '2026-12-16T17:00:00+08:00',
  tarikh_tutup_daftar: '2026-12-07T23:59:00+08:00',
  pendaftaran_dibuka: 'true',
  tel_urus_setia: '[ISI NOMBOR TELEFON URUS SETIA]',
  butiran_bayaran: '[ISI BUTIRAN BAYARAN: contohnya pindahan bank ke akaun masjid]',
  umur_min: '10',
  umur_max: '18',
  sumber_pendaftaran: 'sistem',
  sheet_luar_id: '',
  sheet_luar_tab: ''
};

var STATUS_PENDAFTARAN_ = ['Disahkan', 'Menunggu', 'Senarai Tunggu', 'Batal'];
var STATUS_BAYARAN_ = ['Belum', 'Sudah', 'Dikecualikan'];
var STATUS_TUGAS_ = ['Belum', 'Sedang', 'Selesai'];
var STATUS_MILESTONE_ = ['Belum', 'Selesai'];
var KATEGORI_TUGAS_ = [
  'Pendaftaran', 'Destinasi', 'Logistik', 'Kandungan',
  'Kewangan', 'Promosi', 'Hari Program', 'Selepas program'
];
var KATEGORI_HEBAHAN_ = ['Umum', 'Pendaftaran', 'Bayaran', 'Jadual', 'Lawatan'];
var STATUS_HEBAHAN_ = ['Draf', 'Terbit'];

/* ------------------------------------------------------------------ */
/* Entry points                                                        */
/* ------------------------------------------------------------------ */

function doGet(e) {
  return handleRequest_(e, 'GET');
}

function doPost(e) {
  return handleRequest_(e, 'POST');
}

function onOpen() {
  try {
    SpreadsheetApp.getUi()
      .createMenu('KSQ 2026')
      .addItem('1. Sediakan helaian', 'setupSheets')
      .addItem('2. Muat data awal', 'seedData')
      .addSeparator()
      .addItem('Buka panduan pemasangan', 'showSetupHelp_')
      .addToUi();
  } catch (err) {
    // Menu only exists in a bound spreadsheet UI.
  }
}

function showSetupHelp_() {
  SpreadsheetApp.getUi().alert(
    'KSQ 2026 — Panduan ringkas\n\n' +
    'Jalankan "1. Sediakan helaian" sekali, kemudian "2. Muat data awal".\n\n' +
    'Selepas menukar Code.gs, buka Deploy > Manage deployments > Edit > ' +
    'New version > Deploy. URL Web App kekal sama.'
  );
}

/* ------------------------------------------------------------------ */
/* Router                                                              */
/* ------------------------------------------------------------------ */

function handleRequest_(e, method) {
  try {
    var params = (e && e.parameter) ? e.parameter : {};
    var payload = {};

    if (method === 'POST' && e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        return json_({ ok: false, error: 'Format permintaan tidak sah.', code: 'BAD_JSON' });
      }
    }

    var action = String(payload.action || params.action || '').trim();
    var token = String(payload.token || params.token || '');
    var db = getDb_();

    if (!action) {
      return json_({
        ok: true,
        data: {
          nama: 'KSQ 2026 API',
          versi: '1.0.0',
          mesej: 'Gunakan ?action=stats untuk maklumat awam.',
          masa: isoNow_()
        }
      });
    }

    switch (action) {
      /* Public */
      case 'stats':
        return json_(statsPayload_(db));

      case 'register':
        return json_(registerPublic_(db, payload));

      case 'announcements.list':
        return json_({ ok: true, data: { announcements: publicAnnouncements_(db) } });

      /* Admin — registrations */
      case 'list':
        requireRole_(token, ['admin']);
        return json_({ ok: true, data: { registrations: publicRows_(readRegistrations_(db)) } });

      case 'updateRegistration':
        requireRole_(token, ['admin']);
        return json_({ ok: true, data: updateRegistration_(db, payload) });

      case 'registration.createManual':
        requireRole_(token, ['admin']);
        return json_({ ok: true, data: createManualRegistration_(db, payload) });

      /* Announcements — admin */
      case 'announcements.adminList':
        requireRole_(token, ['admin']);
        return json_({ ok: true, data: { announcements: adminAnnouncements_(db) } });

      case 'announcements.upsert':
        requireRole_(token, ['admin']);
        return json_({ ok: true, data: upsertAnnouncement_(db, payload) });

      case 'announcements.delete':
        requireRole_(token, ['admin']);
        return json_({ ok: true, data: deleteRowById_(db, 'Hebahan', payload.id, 'Hebahan') });

      /* Tasks */
      case 'tasks.list':
        requireRole_(token, ['admin']);
        return json_({ ok: true, data: { tasks: publicRows_(readSimpleSheet_(db, 'Tugasan')) } });

      case 'tasks.upsert':
        requireRole_(token, ['admin']);
        return json_({ ok: true, data: upsertTask_(db, payload) });

      case 'tasks.delete':
        requireRole_(token, ['admin']);
        return json_({ ok: true, data: deleteRowById_(db, 'Tugasan', payload.id, 'Tugasan') });

      /* Milestones */
      case 'milestones.list':
        requireRole_(token, ['admin']);
        return json_({ ok: true, data: { milestones: publicRows_(readSimpleSheet_(db, 'Milestone')) } });

      case 'milestones.upsert':
        requireRole_(token, ['admin']);
        return json_({ ok: true, data: upsertMilestone_(db, payload) });

      case 'milestones.delete':
        requireRole_(token, ['admin']);
        return json_({ ok: true, data: deleteRowById_(db, 'Milestone', payload.id, 'Milestone') });

      /* Budget */
      case 'budget.list':
        requireRole_(token, ['admin']);
        return json_({ ok: true, data: { budget: publicRows_(readSimpleSheet_(db, 'Bajet')) } });

      case 'budget.upsert':
        requireRole_(token, ['admin']);
        return json_({ ok: true, data: upsertBudget_(db, payload) });

      case 'budget.delete':
        requireRole_(token, ['admin']);
        return json_({ ok: true, data: deleteRowById_(db, 'Bajet', payload.id, 'Bajet') });

      /* Attendance */
      case 'attendance.list':
        requireRole_(token, ['admin', 'fasilitator']);
        return json_({ ok: true, data: { attendance: publicRows_(readSimpleSheet_(db, 'Kehadiran')) } });

      case 'attendance.mark':
        requireRole_(token, ['admin', 'fasilitator']);
        return json_({ ok: true, data: markAttendance_(db, payload) });

      case 'facilitator.participants':
        requireRole_(token, ['admin', 'fasilitator']);
        return json_({ ok: true, data: { participants: facilitatorParticipants_(db) } });

      /* Pengurus — read-only summary */
      case 'viewer.summary':
        requireRole_(token, ['admin', 'viewer']);
        return json_({ ok: true, data: viewerSummary_(db) });

      /* Settings */
      case 'settings.get':
        requireRole_(token, ['admin']);
        return json_({ ok: true, data: settingsGet_(db) });

      case 'settings.set':
        requireRole_(token, ['admin']);
        return json_({ ok: true, data: settingsSet_(db, payload) });

      /* Seed / database */
      case 'seed':
        requireRole_(token, ['admin']);
        return json_({ ok: true, data: seedFromPayload_(db, seedPayload_(payload)) });

      case 'db.info':
        requireRole_(token, ['admin']);
        return json_({ ok: true, data: databaseInfo_(db) });

      case 'db.setup':
        requireRole_(token, ['admin']);
        ensureSheets_(db);
        ensureDefaultSettings_(db);
        return json_({ ok: true, data: databaseInfo_(db) });

      case 'db.backup':
        requireRole_(token, ['admin']);
        return json_({ ok: true, data: backupDatabase_(db) });

      default:
        return json_({ ok: false, error: 'Action tidak dikenali: ' + action, code: 'UNKNOWN_ACTION' });
    }
  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    var code = err && err.code ? err.code : 'SERVER_ERROR';
    var message = (code === 'SERVER_ERROR')
      ? 'Ralat pelayan. Sila cuba lagi atau hubungi pentadbir.'
      : String(err.message || err);
    return json_({ ok: false, error: message, code: code });
  }
}

function json_(obj) {
  var out = obj || {};
  out.serverTime = isoNow_();
  return ContentService
    .createTextOutput(JSON.stringify(out))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ------------------------------------------------------------------ */
/* Setup and seed                                                      */
/* ------------------------------------------------------------------ */

function getDb_() {
  var db = SpreadsheetApp.getActiveSpreadsheet();
  if (!db) {
    throw apiError_('Skrip mesti terikat pada Google Sheet. Buka Extensions > Apps Script dari Sheet KSQ 2026.', 'SETUP_REQUIRED');
  }
  return db;
}

function setupSheets() {
  var db = getDb_();
  ensureSheets_(db);
  ensureDefaultSettings_(db);
  var result = 'Helaian KSQ 2026 siap: ' + Object.keys(SHEETS_).join(', ') +
    '. Seterusnya jalankan seedData().';
  Logger.log(result);
  return result;
}

function seedData() {
  var db = getDb_();
  ensureSheets_(db);
  ensureDefaultSettings_(db);
  var result = seedFromPayload_(db, SEED_DATA_);
  Logger.log(JSON.stringify(result));
  return result;
}

function ensureSheets_(db) {
  Object.keys(SHEETS_).forEach(function (name) {
    var headers = SHEETS_[name];
    var sheet = db.getSheetByName(name);
    if (!sheet) {
      sheet = db.insertSheet(name);
    }

    var lastColumn = sheet.getLastColumn();
    var existing = [];
    if (lastColumn > 0) {
      existing = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(function (v) {
        return String(v).trim();
      });
    }

    var isEmpty = existing.length === 0 || existing.every(function (v) { return v === ''; });
    if (isEmpty) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    } else {
      var mismatch = existing.length !== headers.length;
      if (!mismatch) {
        for (var i = 0; i < headers.length; i++) {
          if (existing[i] !== headers[i]) { mismatch = true; break; }
        }
      }
      if (mismatch) {
        throw apiError_(
          'Pengepala helaian "' + name + '" tidak sepadan dengan versi sistem. ' +
          'Jangan ubah nama lajur. Buat salinan sandaran sebelum membaiki.',
          'HEADER_MISMATCH'
        );
      }
    }

    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#073B2A')
      .setFontColor('#FFFDF6');
    sheet.setColumnWidths(1, headers.length, 150);
  });
}

function ensureDefaultSettings_(db) {
  var sheet = requireSheet_(db, 'Tetapan');
  var values = sheet.getDataRange().getValues();
  var existing = {};
  for (var i = 1; i < values.length; i++) {
    var key = String(values[i][0] || '').trim();
    if (key) existing[key] = true;
  }
  var rows = [];
  Object.keys(DEFAULT_SETTINGS_).forEach(function (key) {
    if (!existing[key]) rows.push([key, DEFAULT_SETTINGS_[key]]);
  });
  if (rows.length) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 2).setValues(rows);
  }
}

function seedPayload_(payload) {
  if (payload && payload.seed && typeof payload.seed === 'object') return payload.seed;
  if (payload && (Array.isArray(payload.tasks) || Array.isArray(payload.milestones))) {
    return payload;
  }
  return SEED_DATA_;
}

function seedFromPayload_(db, seed) {
  ensureSheets_(db);
  ensureDefaultSettings_(db);

  var result = { inserted: {}, skipped: {} };

  if (seed && seed.settings && typeof seed.settings === 'object') {
    applySeedSettings_(db, seed.settings);
  }

  ['Milestone', 'Tugasan', 'Bajet'].forEach(function (sheetName) {
    var sheet = requireSheet_(db, sheetName);
    var key = sheetName === 'Tugasan' ? 'tasks' : (sheetName === 'Milestone' ? 'milestones' : 'budget');
    var items = seed && Array.isArray(seed[key]) ? seed[key] : [];
    result.inserted[key] = 0;
    result.skipped[key] = 0;

    if (!items.length) { result.skipped[key] = 0; return; }
    if (sheet.getLastRow() > 1) {
      result.skipped[key] = items.length;
      return;
    }

    var rows;
    if (sheetName === 'Tugasan') {
      rows = items.map(function (item, index) { return buildSeedTaskRow_(item, index + 1); });
    } else if (sheetName === 'Milestone') {
      rows = items.map(function (item, index) { return buildSeedMilestoneRow_(item, index + 1); });
    } else {
      rows = items.map(function (item, index) { return buildSeedBudgetRow_(item, index + 1); });
    }

    if (rows.length) {
      sheet.getRange(2, 1, rows.length, SHEETS_[sheetName].length).setValues(rows.map(function (row) {
        return row.map(safeCell_);
      }));
      result.inserted[key] = rows.length;
    }
  });

  logAction_('seed', 'Data awal dimuatkan: ' + JSON.stringify(result.inserted));
  return result;
}

function applySeedSettings_(db, values) {
  var sheet = requireSheet_(db, 'Tetapan');
  var data = sheet.getDataRange().getValues();
  var existing = {};
  for (var i = 1; i < data.length; i++) {
    existing[String(data[i][0] || '').trim()] = true;
  }
  var rows = [];
  Object.keys(values).forEach(function (key) {
    if (!DEFAULT_SETTINGS_.hasOwnProperty(key) || existing[key]) return;
    var coerced = coerceSetting_(key, values[key]);
    rows.push([key, coerced]);
  });
  if (rows.length) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 2).setValues(rows);
  }
}

function buildSeedTaskRow_(item, index) {
  return [
    'T' + String(index).padStart(3, '0'),
    cleanText_(item.kategori, 40) || 'Pendaftaran',
    cleanText_(item.tugasan, 200),
    cleanText_(item.pic, 80),
    normalizeDeadline_(item.deadline),
    STATUS_TUGAS_.indexOf(item.status) >= 0 ? item.status : 'Belum',
    cleanText_(item.catatan || 'Cadangan, sila sahkan', 500),
    isoNow_()
  ];
}

function buildSeedMilestoneRow_(item, index) {
  return [
    'M' + String(index).padStart(3, '0'),
    cleanText_(item.tajuk, 160),
    normalizeMilestoneDate_(item.tarikh),
    cleanText_(item.penerangan || 'Cadangan, sila sahkan', 500),
    STATUS_MILESTONE_.indexOf(item.status) >= 0 ? item.status : 'Belum'
  ];
}

function buildSeedBudgetRow_(item, index) {
  return [
    'B' + String(index).padStart(3, '0'),
    cleanText_(item.item, 160),
    cleanText_(item.kategori, 60),
    toNumber_(item.anggaran_rm, 0),
    toNumber_(item.sebenar_rm, 0),
    cleanText_(item.catatan || 'Perlu disemak bendahari', 500)
  ];
}

/* ------------------------------------------------------------------ */
/* Public stats and registration                                       */
/* ------------------------------------------------------------------ */

function statsPayload_(db) {
  var settings = getSettings_(db);
  var capacity = toInteger_(settings.kapasiti, 40);
  var now = new Date();
  var closeDate = parseDate_(settings.tarikh_tutup_daftar);
  var open = isRegistrationOpen_(settings, now);
  var source = settings.sumber_pendaftaran === 'sheet_luar' ? 'sheet_luar' : 'sistem';
  var warning = '';
  var disahkan = 0;
  var menunggu = 0;
  var waitlist = 0;
  var cancelled = 0;
  var total = 0;

  if (source === 'sheet_luar' && settings.sheet_luar_id) {
    try {
      var externalCount = getRegistrationCountFromSheet(settings.sheet_luar_id, settings.sheet_luar_tab);
      disahkan = externalCount;
      total = externalCount;
    } catch (err) {
      console.error('External sheet error: ' + err);
      warning = 'Sheet luar tidak dapat dibaca. Sistem menggunakan data dalaman buat sementara.';
      source = 'sistem';
    }
  }

  if (source === 'sistem') {
    var rows = readRegistrations_(db);
    total = rows.length;
    rows.forEach(function (row) {
      if (row.status === 'Disahkan') disahkan++;
      else if (row.status === 'Menunggu') menunggu++;
      else if (row.status === 'Senarai Tunggu') waitlist++;
      else if (row.status === 'Batal') cancelled++;
    });
  }

  var used = disahkan + menunggu;
  var remaining = Math.max(0, capacity - used);

  var stats = {
    kapasiti: capacity,
    disahkan: disahkan,
    menunggu: menunggu,
    senaraiTunggu: waitlist,
    batal: cancelled,
    jumlahPendaftaran: total,
    bakiSlot: remaining,
    penuh: used >= capacity,
    pendaftaranDibuka: open,
    tarikhTutup: settings.tarikh_tutup_daftar || '',
    tarikhMula: settings.tarikh_mula || '',
    tarikhTamat: settings.tarikh_tamat || '',
    yuran: {
      asal: toNumber_(settings.yuran_asal, 180),
      promo: toNumber_(settings.yuran_promo, 120),
      online: Math.max(0, toNumber_(settings.yuran_promo, 120) - toNumber_(settings.diskaun_online, 10))
    },
    umurMin: toInteger_(settings.umur_min, 10),
    umurMax: toInteger_(settings.umur_max, 18),
    sumber: source,
    amaranSumber: warning,
    whatsapp: whatsappNumber_(settings.tel_urus_setia)
  };

  return Object.assign({ ok: true, data: stats }, stats);
}

function registerPublic_(db, payload) {
  var settings = getSettings_(db);
  var onlineFee = Math.max(0, toNumber_(settings.yuran_promo, 120) - toNumber_(settings.diskaun_online, 10));

  // Honeypot: reply as if successful, but never save.
  if (String(payload.website || '').trim() !== '') {
    return {
      ok: true,
      data: {
        id: 'KSQ26-0000',
        status: 'Menunggu',
        yuran_rm: onlineFee,
        mesejBayaran: '',
        whatsapp: '',
        tarikhTutup: settings.tarikh_tutup_daftar || ''
      }
    };
  }

  if (settings.sumber_pendaftaran === 'sheet_luar') {
    throw apiError_('Pendaftaran untuk program ini dikendalikan melalui pautan rasmi yang disediakan urus setia. Sila hubungi urus setia.', 'EXTERNAL_SOURCE');
  }

  if (!isRegistrationOpen_(settings, new Date())) {
    throw apiError_('Pendaftaran telah ditutup. Terima kasih atas minat anda.', 'CLOSED');
  }

  var clean = validateRegistration_(payload, settings, { requireConsent: true });
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    throw apiError_('Sistem sedang sibuk. Sila cuba lagi sebentar.', 'BUSY');
  }

  try {
    if (!isRegistrationOpen_(settings, new Date())) {
      throw apiError_('Pendaftaran telah ditutup. Terima kasih atas minat anda.', 'CLOSED');
    }

    var rows = readRegistrations_(db);
    ensureNotDuplicate_(rows, clean);

    var capacity = toInteger_(settings.kapasiti, 40);
    var active = rows.filter(function (row) {
      return row.status === 'Disahkan' || row.status === 'Menunggu';
    }).length;
    var status = active >= capacity ? 'Senarai Tunggu' : 'Menunggu';
    var id = nextRegistrationId_(rows);
    var fee = onlineFee;

    appendRegistration_(db, {
      id: id,
      masa_daftar: isoNow_(),
      nama_peserta: clean.nama,
      umur: clean.umur,
      jantina: clean.jantina,
      nama_penjaga: clean.penjaga,
      tel_penjaga: clean.tel,
      lancar_quran: 'ya',
      alahan_kesihatan: clean.alahan,
      kaedah_daftar: 'online',
      yuran_rm: fee,
      status_bayaran: 'Belum',
      rujukan_bayaran: '',
      status: status,
      catatan: ''
    });

    logAction_('register', id + ' (' + status + ')');

    return {
      ok: true,
      data: {
        id: id,
        status: status,
        yuran_rm: fee,
        mesejBayaran: settings.butiran_bayaran || '',
        whatsapp: whatsappNumber_(settings.tel_urus_setia),
        tarikhTutup: settings.tarikh_tutup_daftar || '',
        bakiSlot: Math.max(0, capacity - active - (status === 'Menunggu' ? 1 : 0))
      }
    };
  } finally {
    lock.releaseLock();
  }
}

function createManualRegistration_(db, payload) {
  var settings = getSettings_(db);
  var clean = validateRegistration_(payload, settings, { requireConsent: false });
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    throw apiError_('Sistem sedang sibuk. Sila cuba lagi sebentar.', 'BUSY');
  }

  try {
    var rows = readRegistrations_(db);
    ensureNotDuplicate_(rows, clean);

    var capacity = toInteger_(settings.kapasiti, 40);
    var active = rows.filter(function (row) {
      return row.status === 'Disahkan' || row.status === 'Menunggu';
    }).length;

    var requestedStatus = STATUS_PENDAFTARAN_.indexOf(payload.status) >= 0 ? payload.status : 'Disahkan';
    var status = requestedStatus;
    if ((status === 'Disahkan' || status === 'Menunggu') && active >= capacity) {
      status = 'Senarai Tunggu';
    }

    var paymentStatus = STATUS_BAYARAN_.indexOf(payload.status_bayaran) >= 0
      ? payload.status_bayaran : 'Belum';
    var fee = toNumber_(settings.yuran_promo, 120);
    var id = nextRegistrationId_(rows);

    appendRegistration_(db, {
      id: id,
      masa_daftar: isoNow_(),
      nama_peserta: clean.nama,
      umur: clean.umur,
      jantina: clean.jantina,
      nama_penjaga: clean.penjaga,
      tel_penjaga: clean.tel,
      lancar_quran: 'ya',
      alahan_kesihatan: clean.alahan,
      kaedah_daftar: 'manual',
      yuran_rm: fee,
      status_bayaran: paymentStatus,
      rujukan_bayaran: cleanText_(payload.rujukan_bayaran, 120),
      status: status,
      catatan: cleanText_(payload.catatan, 500)
    });

    logAction_('registration.manual', id + ' (' + status + ')');
    return findRegistrationById_(db, id);
  } finally {
    lock.releaseLock();
  }
}

function updateRegistration_(db, payload) {
  var id = String(payload.id || '').trim();
  if (!id) throw apiError_('ID pendaftaran diperlukan.', 'BAD_REQUEST');

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) throw apiError_('Sistem sedang sibuk. Sila cuba lagi.', 'BUSY');

  try {
    var sheet = requireSheet_(db, 'Pendaftaran');
    var rows = readRegistrations_(db);
    var row = rows.filter(function (r) { return String(r.id) === id; })[0];
    if (!row) throw apiError_('Pendaftaran tidak dijumpai.', 'NOT_FOUND');

    var newStatus = row.status;
    if (payload.status !== undefined) {
      if (STATUS_PENDAFTARAN_.indexOf(payload.status) < 0) {
        throw apiError_('Status pendaftaran tidak sah.', 'BAD_REQUEST');
      }
      newStatus = payload.status;
    }

    if (newStatus === 'Disahkan' && row.status !== 'Disahkan') {
      var settings = getSettings_(db);
      var capacity = toInteger_(settings.kapasiti, 40);
      var activeOthers = rows.filter(function (r) {
        return String(r.id) !== id && (r.status === 'Disahkan' || r.status === 'Menunggu');
      }).length;
      if (activeOthers >= capacity) {
        throw apiError_('Slot penuh. Batal atau tunggu sehingga ada slot sebelum mengesahkan peserta ini.', 'FULL');
      }
    }

    var paymentStatus = row.status_bayaran;
    if (payload.status_bayaran !== undefined) {
      if (STATUS_BAYARAN_.indexOf(payload.status_bayaran) < 0) {
        throw apiError_('Status bayaran tidak sah.', 'BAD_REQUEST');
      }
      paymentStatus = payload.status_bayaran;
    }

    var reference = payload.rujukan_bayaran !== undefined
      ? cleanText_(payload.rujukan_bayaran, 120) : String(row.rujukan_bayaran || '');
    var notes = payload.catatan !== undefined
      ? cleanText_(payload.catatan, 500) : String(row.catatan || '');

    sheet.getRange(row._row, 12, 1, 4).setValues([[
      paymentStatus, safeCell_(reference), newStatus, safeCell_(notes)
    ]]);

    logAction_('registration.update', id + ' -> ' + newStatus + '/' + paymentStatus);
    return findRegistrationById_(db, id);
  } finally {
    lock.releaseLock();
  }
}

function validateRegistration_(payload, settings, options) {
  var minAge = toInteger_(settings.umur_min, 10);
  var maxAge = toInteger_(settings.umur_max, 18);
  var name = cleanText_(payload.nama_peserta, 80);
  if (name.length < 2) {
    throw apiError_('Nama peserta mesti antara 2 hingga 80 aksara.', 'VALIDATION');
  }

  var age = Number(payload.umur);
  if (!isFinite(age) || Math.floor(age) !== age) {
    throw apiError_('Umur mesti nombor bulat.', 'VALIDATION');
  }
  if (age < minAge || age > maxAge) {
    throw apiError_('Umur peserta mesti antara ' + minAge + ' hingga ' + maxAge + ' tahun.', 'VALIDATION');
  }

  var gender = normalizeGender_(payload.jantina);
  if (!gender) throw apiError_('Sila pilih jantina peserta.', 'VALIDATION');

  var guardian = cleanText_(payload.nama_penjaga, 80);
  if (guardian.length < 2) {
    throw apiError_('Nama penjaga mesti antara 2 hingga 80 aksara.', 'VALIDATION');
  }

  var phone = normalizePhone_(payload.tel_penjaga);
  if (!phone) {
    throw apiError_('Nombor telefon penjaga tidak sah. Gunakan format 01x-xxxxxxx.', 'VALIDATION');
  }

  if (normalizeYesNo_(payload.lancar_quran) !== 'ya') {
    throw apiError_('Peserta mesti lancar membaca Al-Quran untuk menyertai program ini.', 'NOT_ELIGIBLE');
  }

  if (options && options.requireConsent && !isTruthy_(payload.persetujuan_data)) {
    throw apiError_('Persetujuan penggunaan data peribadi diperlukan.', 'CONSENT_REQUIRED');
  }

  return {
    nama: name,
    umur: age,
    jantina: gender,
    penjaga: guardian,
    tel: phone,
    alahan: cleanText_(payload.alahan_kesihatan, 300) || 'Tiada'
  };
}

function isRegistrationOpen_(settings, now) {
  if (String(settings.pendaftaran_dibuka).toLowerCase() !== 'true') return false;
  var closeDate = parseDate_(settings.tarikh_tutup_daftar);
  if (closeDate && now.getTime() > closeDate.getTime()) return false;
  return true;
}

function ensureNotDuplicate_(rows, clean) {
  var nameKey = normalizeNameKey_(clean.nama);
  var phoneKey = normalizePhone_(clean.tel);
  var duplicate = rows.some(function (row) {
    if (row.status === 'Batal') return false;
    return normalizePhone_(row.tel_penjaga) === phoneKey &&
      normalizeNameKey_(row.nama_peserta) === nameKey;
  });
  if (duplicate) {
    throw apiError_('Pendaftaran dengan nama dan nombor telefon ini sudah wujud. Hubungi urus setia jika perlu perubahan.', 'DUPLICATE');
  }
}

function appendRegistration_(db, record) {
  var sheet = requireSheet_(db, 'Pendaftaran');
  sheet.appendRow([
    safeCell_(record.id),
    safeCell_(record.masa_daftar),
    safeCell_(record.nama_peserta),
    record.umur,
    safeCell_(record.jantina),
    safeCell_(record.nama_penjaga),
    safeCell_(record.tel_penjaga),
    safeCell_(record.lancar_quran),
    safeCell_(record.alahan_kesihatan),
    safeCell_(record.kaedah_daftar),
    record.yuran_rm,
    safeCell_(record.status_bayaran),
    safeCell_(record.rujukan_bayaran),
    safeCell_(record.status),
    safeCell_(record.catatan)
  ]);
}

/* ------------------------------------------------------------------ */
/* Tasks / milestones / budget                                         */
/* ------------------------------------------------------------------ */

function upsertTask_(db, payload) {
  var input = payload.task || payload;
  var sheet = requireSheet_(db, 'Tugasan');
  var rows = readSimpleSheet_(db, 'Tugasan');
  var id = String(input.id || '').trim();

  var category = cleanText_(input.kategori, 40);
  if (KATEGORI_TUGAS_.indexOf(category) < 0) {
    throw apiError_('Kategori tugasan tidak sah.', 'VALIDATION');
  }
  var title = cleanText_(input.tugasan, 200);
  if (title.length < 2) throw apiError_('Tugasan diperlukan.', 'VALIDATION');

  var status = STATUS_TUGAS_.indexOf(input.status) >= 0 ? input.status : 'Belum';
  var deadline = normalizeDeadline_(input.deadline);
  if (!deadline) throw apiError_('Tarikh akhir tugasan tidak sah.', 'VALIDATION');

  var record = [
    id || nextSimpleId_(rows, 'T'),
    category,
    title,
    cleanText_(input.pic, 80),
    deadline,
    status,
    cleanText_(input.catatan, 500),
    isoNow_()
  ];

  if (id) {
    var existing = rows.filter(function (r) { return String(r.id) === id; })[0];
    if (!existing) throw apiError_('Tugasan tidak dijumpai.', 'NOT_FOUND');
    sheet.getRange(existing._row, 1, 1, 8).setValues([record.map(safeCell_)]);
    logAction_('tasks.upsert', id);
    return objectFromRow_(SHEETS_.Tugasan, record, existing._row);
  }

  sheet.appendRow(record.map(safeCell_));
  logAction_('tasks.upsert', record[0]);
  return objectFromRow_(SHEETS_.Tugasan, record, sheet.getLastRow());
}

function upsertMilestone_(db, payload) {
  var input = payload.milestone || payload;
  var sheet = requireSheet_(db, 'Milestone');
  var rows = readSimpleSheet_(db, 'Milestone');
  var id = String(input.id || '').trim();

  var title = cleanText_(input.tajuk, 160);
  if (title.length < 2) throw apiError_('Tajuk milestone diperlukan.', 'VALIDATION');
  var date = normalizeMilestoneDate_(input.tarikh);
  if (!date) throw apiError_('Tarikh milestone tidak sah.', 'VALIDATION');

  var record = [
    id || nextSimpleId_(rows, 'M'),
    title,
    date,
    cleanText_(input.penerangan, 500),
    STATUS_MILESTONE_.indexOf(input.status) >= 0 ? input.status : 'Belum'
  ];

  if (id) {
    var existing = rows.filter(function (r) { return String(r.id) === id; })[0];
    if (!existing) throw apiError_('Milestone tidak dijumpai.', 'NOT_FOUND');
    sheet.getRange(existing._row, 1, 1, 5).setValues([record.map(safeCell_)]);
    logAction_('milestones.upsert', id);
    return objectFromRow_(SHEETS_.Milestone, record, existing._row);
  }

  sheet.appendRow(record.map(safeCell_));
  logAction_('milestones.upsert', record[0]);
  return objectFromRow_(SHEETS_.Milestone, record, sheet.getLastRow());
}

function upsertBudget_(db, payload) {
  var input = payload.budget || payload;
  var sheet = requireSheet_(db, 'Bajet');
  var rows = readSimpleSheet_(db, 'Bajet');
  var id = String(input.id || '').trim();

  var item = cleanText_(input.item, 160);
  if (item.length < 2) throw apiError_('Nama item bajet diperlukan.', 'VALIDATION');

  var record = [
    id || nextSimpleId_(rows, 'B'),
    item,
    cleanText_(input.kategori, 60) || 'Lain-lain',
    Math.max(0, toNumber_(input.anggaran_rm, 0)),
    Math.max(0, toNumber_(input.sebenar_rm, 0)),
    cleanText_(input.catatan, 500)
  ];

  if (id) {
    var existing = rows.filter(function (r) { return String(r.id) === id; })[0];
    if (!existing) throw apiError_('Item bajet tidak dijumpai.', 'NOT_FOUND');
    sheet.getRange(existing._row, 1, 1, 6).setValues([record.map(safeCell_)]);
    logAction_('budget.upsert', id);
    return objectFromRow_(SHEETS_.Bajet, record, existing._row);
  }

  sheet.appendRow(record.map(safeCell_));
  logAction_('budget.upsert', record[0]);
  return objectFromRow_(SHEETS_.Bajet, record, sheet.getLastRow());
}

function deleteRowById_(db, sheetName, id, label) {
  var cleanId = String(id || '').trim();
  if (!cleanId) throw apiError_('ID diperlukan.', 'BAD_REQUEST');
  var sheet = requireSheet_(db, sheetName);
  var rows = readSimpleSheet_(db, sheetName);
  var existing = rows.filter(function (r) { return String(r.id) === cleanId; })[0];
  if (!existing) throw apiError_(label + ' tidak dijumpai.', 'NOT_FOUND');
  sheet.deleteRow(existing._row);
  logAction_(sheetName.toLowerCase() + '.delete', cleanId);
  return { id: cleanId, deleted: true };
}

/* ------------------------------------------------------------------ */
/* Attendance / facilitator                                            */
/* ------------------------------------------------------------------ */

function markAttendance_(db, payload) {
  var id = String(payload.id_peserta || '').trim();
  var day = Number(payload.hari);
  if (!id) throw apiError_('ID peserta diperlukan.', 'BAD_REQUEST');
  if ([1, 2, 3].indexOf(day) < 0) throw apiError_('Hari mesti 1, 2 atau 3.', 'BAD_REQUEST');

  var registrations = readRegistrations_(db);
  var participant = registrations.filter(function (r) { return String(r.id) === id; })[0];
  if (!participant) throw apiError_('Peserta tidak dijumpai.', 'NOT_FOUND');
  if (participant.status !== 'Disahkan') {
    throw apiError_('Kehadiran hanya boleh direkod untuk peserta Disahkan.', 'NOT_CONFIRMED');
  }

  var sheet = requireSheet_(db, 'Kehadiran');
  var rows = readSimpleSheet_(db, 'Kehadiran');
  var existing = rows.filter(function (r) { return String(r.id_peserta) === id; })[0];
  var value = isTruthy_(payload.hadir) ? 'Hadir' : 'Tidak';
  var notes = payload.catatan !== undefined
    ? cleanText_(payload.catatan, 300)
    : (existing ? String(existing.catatan || '') : '');

  if (existing) {
    var col = day + 1; // hari1=2, hari2=3, hari3=4
    sheet.getRange(existing._row, col).setValue(value);
    if (payload.catatan !== undefined) {
      sheet.getRange(existing._row, 5).setValue(safeCell_(notes));
    }
    logAction_('attendance.mark', id + ' hari' + day + '=' + value);
    return { id_peserta: id, hari: day, nilai: value, catatan: notes };
  }

  var record = [id, '', '', '', safeCell_(notes)];
  record[day] = value;
  sheet.appendRow(record);
  logAction_('attendance.mark', id + ' hari' + day + '=' + value);
  return { id_peserta: id, hari: day, nilai: value, catatan: notes };
}

function facilitatorParticipants_(db) {
  return readRegistrations_(db)
    .filter(function (row) { return row.status === 'Disahkan'; })
    .sort(function (a, b) {
      return String(a.nama_peserta).localeCompare(String(b.nama_peserta), 'ms');
    })
    .map(function (row) {
      return {
        id: row.id,
        nama_peserta: row.nama_peserta,
        umur: row.umur,
        jantina: row.jantina,
        nama_penjaga: row.nama_penjaga,
        tel_penjaga: row.tel_penjaga,
        alahan_kesihatan: row.alahan_kesihatan,
        catatan: row.catatan
      };
    });
}

/* ------------------------------------------------------------------ */
/* Announcements / pengurus                                            */
/* ------------------------------------------------------------------ */

function publicAnnouncements_(db) {
  var todayKey = Utilities.formatDate(new Date(), TZ_, 'yyyy-MM-dd');
  return readSimpleSheet_(db, 'Hebahan')
    .filter(function (row) { return announcementVisible_(row, todayKey); })
    .sort(announcementSort_)
    .map(function (row) {
      return {
        id: row.id,
        tajuk: row.tajuk,
        kandungan: row.kandungan,
        kategori: row.kategori,
        tarikh_mula: row.tarikh_mula,
        tarikh_tamat: row.tarikh_tamat,
        penting: row.penting,
        dikemaskini: row.dikemaskini
      };
    });
}

function adminAnnouncements_(db) {
  return readSimpleSheet_(db, 'Hebahan')
    .sort(announcementSort_)
    .map(publicRow_);
}

function announcementVisible_(row, todayKey) {
  if (String(row.status || '') !== 'Terbit') return false;
  var start = String(row.tarikh_mula || '').slice(0, 10);
  var end = String(row.tarikh_tamat || '').slice(0, 10);
  if (start && todayKey < start) return false;
  if (end && todayKey > end) return false;
  return true;
}

function announcementSort_(a, b) {
  var pinnedA = String(a.penting || '').toLowerCase() === 'ya' ? 1 : 0;
  var pinnedB = String(b.penting || '').toLowerCase() === 'ya' ? 1 : 0;
  if (pinnedA !== pinnedB) return pinnedB - pinnedA;
  var dateA = String(a.tarikh_mula || a.dikemaskini || '');
  var dateB = String(b.tarikh_mula || b.dikemaskini || '');
  var byDate = dateB.localeCompare(dateA);
  if (byDate !== 0) return byDate;
  return String(b.dikemaskini || '').localeCompare(String(a.dikemaskini || ''));
}

function upsertAnnouncement_(db, payload) {
  var input = payload.announcement || payload;
  var sheet = requireSheet_(db, 'Hebahan');
  var rows = readSimpleSheet_(db, 'Hebahan');
  var id = String(input.id || '').trim();

  var title = cleanText_(input.tajuk, 160);
  if (title.length < 2) throw apiError_('Tajuk hebahan diperlukan.', 'VALIDATION');
  var content = cleanMultiline_(input.kandungan, 5000);
  if (content.length < 2) throw apiError_('Kandungan hebahan diperlukan.', 'VALIDATION');

  var category = KATEGORI_HEBAHAN_.indexOf(input.kategori) >= 0 ? input.kategori : 'Umum';
  var start = normalizeAnnouncementDate_(input.tarikh_mula);
  var end = normalizeAnnouncementDate_(input.tarikh_tamat);
  if (input.tarikh_mula && !start) throw apiError_('Tarikh mula hebahan tidak sah.', 'VALIDATION');
  if (input.tarikh_tamat && !end) throw apiError_('Tarikh tamat hebahan tidak sah.', 'VALIDATION');
  if (start && end && end < start) {
    throw apiError_('Tarikh tamat hebahan mesti selepas tarikh mula.', 'VALIDATION');
  }

  var record = [
    id || nextSimpleId_(rows, 'H'),
    title,
    content,
    category,
    start,
    end,
    isTruthy_(input.penting) ? 'ya' : 'tidak',
    STATUS_HEBAHAN_.indexOf(input.status) >= 0 ? input.status : 'Draf',
    isoNow_()
  ];

  if (id) {
    var existing = rows.filter(function (r) { return String(r.id) === id; })[0];
    if (!existing) throw apiError_('Hebahan tidak dijumpai.', 'NOT_FOUND');
    sheet.getRange(existing._row, 1, 1, 9).setValues([record.map(safeCell_)]);
    logAction_('announcements.upsert', id);
    return objectFromRow_(SHEETS_.Hebahan, record, existing._row);
  }

  sheet.appendRow(record.map(safeCell_));
  logAction_('announcements.upsert', record[0]);
  return objectFromRow_(SHEETS_.Hebahan, record, sheet.getLastRow());
}

function normalizeAnnouncementDate_(value) {
  if (!value) return '';
  var date = parseDate_(value);
  if (!date) return '';
  return Utilities.formatDate(date, TZ_, 'yyyy-MM-dd');
}

function cleanMultiline_(value, maxLength) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, maxLength || 5000);
}

function viewerSummary_(db) {
  var stats = statsPayload_(db).data;
  var tasks = publicRows_(readSimpleSheet_(db, 'Tugasan'));
  var milestones = publicRows_(readSimpleSheet_(db, 'Milestone'));
  var confirmed = readRegistrations_(db).filter(function (row) {
    return row.status === 'Disahkan';
  });
  var attendance = { hari1: 0, hari2: 0, hari3: 0 };
  readSimpleSheet_(db, 'Kehadiran').forEach(function (row) {
    ['hari1', 'hari2', 'hari3'].forEach(function (day) {
      if (String(row[day] || '') === 'Hadir') attendance[day] += 1;
    });
  });

  return {
    stats: stats,
    tasks: tasks,
    milestones: milestones,
    attendance: {
      disahkan: confirmed.length,
      hari1: attendance.hari1,
      hari2: attendance.hari2,
      hari3: attendance.hari3
    },
    announcements: publicAnnouncements_(db),
    dikemaskini: isoNow_()
  };
}

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

function settingsGet_(db) {
  var settings = getSettings_(db);
  var props = PropertiesService.getScriptProperties();
  return {
    settings: settings,
    tokens: {
      admin: Boolean(props.getProperty('ADMIN_TOKEN')),
      fasilitator: Boolean(props.getProperty('FASILITATOR_TOKEN'))
    },
    sheets: Object.keys(SHEETS_)
  };
}

function settingsSet_(db, payload) {
  var updates = payload.settings && typeof payload.settings === 'object'
    ? payload.settings
    : payload;
  var current = getSettings_(db);
  var next = Object.assign({}, current);
  var changed = {};

  Object.keys(updates).forEach(function (key) {
    if (key === 'action' || key === 'token' || !DEFAULT_SETTINGS_.hasOwnProperty(key)) return;
    next[key] = coerceSetting_(key, updates[key]);
    changed[key] = next[key];
  });

  var minAge = toInteger_(next.umur_min, 10);
  var maxAge = toInteger_(next.umur_max, 18);
  if (minAge > maxAge) throw apiError_('Umur minimum tidak boleh melebihi umur maksimum.', 'VALIDATION');

  var start = parseDate_(next.tarikh_mula);
  var end = parseDate_(next.tarikh_tamat);
  var close = parseDate_(next.tarikh_tutup_daftar);
  if (start && end && start.getTime() > end.getTime()) {
    throw apiError_('Tarikh mula program mesti sebelum tarikh tamat.', 'VALIDATION');
  }
  if (close && start && close.getTime() > start.getTime()) {
    throw apiError_('Tarikh tutup pendaftaran mesti sebelum program bermula.', 'VALIDATION');
  }
  if (next.sumber_pendaftaran === 'sheet_luar' && !next.sheet_luar_id) {
    throw apiError_('Masukkan pautan atau ID Google Sheet luar.', 'VALIDATION');
  }

  var sheet = requireSheet_(db, 'Tetapan');
  var rows = sheet.getDataRange().getValues();
  var keyRows = {};
  for (var i = 1; i < rows.length; i++) {
    var key = String(rows[i][0] || '').trim();
    if (key) keyRows[key] = i + 1;
  }

  var appended = [];
  Object.keys(changed).forEach(function (key) {
    if (keyRows[key]) {
      sheet.getRange(keyRows[key], 2).setValue(safeCell_(changed[key]));
    } else {
      appended.push([key, changed[key]]);
    }
  });
  if (appended.length) {
    sheet.getRange(sheet.getLastRow() + 1, 1, appended.length, 2).setValues(appended);
  }

  logAction_('settings.set', Object.keys(changed).join(', '));
  return settingsGet_(db);
}

function getSettings_(db) {
  var sheet = requireSheet_(db, 'Tetapan');
  var values = sheet.getDataRange().getValues();
  var settings = Object.assign({}, DEFAULT_SETTINGS_);
  for (var i = 1; i < values.length; i++) {
    var key = String(values[i][0] || '').trim();
    if (key) settings[key] = String(values[i][1] === null ? '' : values[i][1]);
  }
  return settings;
}

function coerceSetting_(key, value) {
  switch (key) {
    case 'kapasiti':
      return String(clampInteger_(value, 1, 500, 40));
    case 'yuran_asal':
    case 'yuran_promo':
    case 'diskaun_online':
      var n = toNumber_(value, 0);
      if (n < 0 || n > 100000) throw apiError_('Nilai yuran tidak sah.', 'VALIDATION');
      return String(n);
    case 'umur_min':
      return String(clampInteger_(value, 5, 99, 10));
    case 'umur_max':
      return String(clampInteger_(value, 5, 99, 18));
    case 'pendaftaran_dibuka':
      return isTruthy_(value) ? 'true' : 'false';
    case 'tarikh_mula':
    case 'tarikh_tamat':
    case 'tarikh_tutup_daftar':
      var iso = normalizeDateTime_(value);
      if (!iso) throw apiError_('Tarikh tidak sah: ' + key, 'VALIDATION');
      return iso;
    case 'sumber_pendaftaran':
      if (value !== 'sistem' && value !== 'sheet_luar') {
        throw apiError_('Sumber pendaftaran tidak sah.', 'VALIDATION');
      }
      return value;
    case 'sheet_luar_id':
      var id = extractSheetId_(value);
      if (id && !/^[A-Za-z0-9_-]{20,}$/.test(id)) {
        throw apiError_('ID Google Sheet luar tidak sah.', 'VALIDATION');
      }
      return id;
    case 'sheet_luar_tab':
      return cleanText_(value, 100);
    case 'tel_urus_setia':
      return cleanText_(value, 40);
    case 'butiran_bayaran':
      return cleanText_(value, 800);
    default:
      return cleanText_(value, 800);
  }
}

/* ------------------------------------------------------------------ */
/* Database management                                                 */
/* ------------------------------------------------------------------ */

function databaseInfo_(db) {
  var info = {
    nama: db.getName(),
    url: db.getUrl(),
    dikemaskini: isoNow_(),
    sheets: [],
    checks: {
      missingSheets: [],
      headerMismatch: [],
      duplicateIds: {},
      attendanceOrphans: 0
    }
  };

  Object.keys(SHEETS_).forEach(function (name) {
    var sheet = db.getSheetByName(name);
    if (!sheet) {
      info.checks.missingSheets.push(name);
      info.sheets.push({ nama: name, wujud: false, baris: 0, headerOk: false });
      return;
    }
    var values = sheet.getDataRange().getValues();
    var headers = values.length ? values[0].map(function (v) { return String(v).trim(); }) : [];
    var expected = SHEETS_[name];
    var headerOk = headers.length === expected.length &&
      expected.every(function (h, index) { return headers[index] === h; });
    if (!headerOk) info.checks.headerMismatch.push(name);

    var dataRows = 0;
    for (var r = 1; r < values.length; r++) {
      if (values[r].some(function (v) { return v !== '' && v !== null; })) dataRows++;
    }
    info.sheets.push({
      nama: name,
      wujud: true,
      baris: dataRows,
      headerOk: headerOk,
      url: db.getUrl() + '#gid=' + sheet.getSheetId()
    });
  });

  var registrations = readRegistrations_(db);
  var ids = {};
  registrations.forEach(function (row) {
    var id = String(row.id || '');
    if (!id) return;
    ids[id] = (ids[id] || 0) + 1;
  });
  Object.keys(ids).forEach(function (id) {
    if (ids[id] > 1) info.checks.duplicateIds[id] = ids[id];
  });

  var attendance = readSimpleSheet_(db, 'Kehadiran');
  var known = {};
  registrations.forEach(function (row) { known[String(row.id)] = true; });
  info.checks.attendanceOrphans = attendance.filter(function (row) {
    return !known[String(row.id_peserta)];
  }).length;

  var settings = getSettings_(db);
  info.sumber = settings.sumber_pendaftaran;
  return info;
}

function backupDatabase_(db) {
  var stamp = Utilities.formatDate(new Date(), TZ_, 'yyyy-MM-dd HHmm');
  var name = 'KSQ 2026 - Sandaran ' + stamp;
  var file = DriveApp.getFileById(db.getId()).makeCopy(name);
  logAction_('db.backup', file.getId());
  return { id: file.getId(), nama: file.getName(), url: file.getUrl() };
}

function getRegistrationCountFromSheet(sheetId, tabName) {
  var id = extractSheetId_(sheetId);
  if (!id) throw new Error('ID Sheet luar kosong.');
  var external = SpreadsheetApp.openById(id);
  var sheet = tabName ? external.getSheetByName(tabName) : external.getSheets()[0];
  if (!sheet) throw new Error('Tab Sheet luar tidak dijumpai: ' + tabName);
  var values = sheet.getDataRange().getValues();
  var count = 0;
  for (var r = 1; r < values.length; r++) {
    if (values[r].some(function (v) { return v !== '' && v !== null; })) count++;
  }
  return count;
}

/* ------------------------------------------------------------------ */
/* Sheet helpers                                                       */
/* ------------------------------------------------------------------ */

function requireSheet_(db, name) {
  var sheet = db.getSheetByName(name);
  if (!sheet) {
    throw apiError_('Helaian "' + name + '" tiada. Jalankan setupSheets() terlebih dahulu.', 'SETUP_REQUIRED');
  }
  return sheet;
}

function readRegistrations_(db) {
  return readSimpleSheet_(db, 'Pendaftaran').map(function (row) {
    row.umur = toNumber_(row.umur, 0);
    row.yuran_rm = toNumber_(row.yuran_rm, 0);
    return row;
  });
}

function readSimpleSheet_(db, name) {
  var sheet = requireSheet_(db, name);
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0].map(function (h) { return String(h).trim(); });
  var rows = [];
  for (var r = 1; r < values.length; r++) {
    var hasData = values[r].some(function (v) { return v !== '' && v !== null; });
    if (!hasData) continue;
    var obj = { _row: r + 1 };
    for (var c = 0; c < headers.length; c++) {
      if (headers[c]) obj[headers[c]] = values[r][c];
    }
    rows.push(obj);
  }
  return rows;
}

function findRegistrationById_(db, id) {
  var row = readRegistrations_(db).filter(function (r) { return String(r.id) === String(id); })[0];
  if (!row) throw apiError_('Pendaftaran tidak dijumpai.', 'NOT_FOUND');
  return publicRow_(row);
}

function objectFromRow_(headers, row, sheetRow) {
  var obj = { _row: sheetRow };
  headers.forEach(function (key, index) { obj[key] = row[index]; });
  return publicRow_(obj);
}

function publicRows_(rows) {
  return rows.map(publicRow_);
}

function publicRow_(row) {
  var copy = Object.assign({}, row);
  delete copy._row;
  return copy;
}

function nextRegistrationId_(rows) {
  var max = 0;
  rows.forEach(function (row) {
    var match = /^KSQ26-(\d+)$/.exec(String(row.id || '').trim());
    if (match) max = Math.max(max, parseInt(match[1], 10));
  });
  return 'KSQ26-' + String(max + 1).padStart(4, '0');
}

function nextSimpleId_(rows, prefix) {
  var max = 0;
  var regex = new RegExp('^' + prefix + '(\\d+)$');
  rows.forEach(function (row) {
    var match = regex.exec(String(row.id || '').trim());
    if (match) max = Math.max(max, parseInt(match[1], 10));
  });
  return prefix + String(max + 1).padStart(3, '0');
}

/* ------------------------------------------------------------------ */
/* Auth                                                                */
/* ------------------------------------------------------------------ */

function requireRole_(token, allowed) {
  var role = roleForToken_(String(token || ''));
  if (!role) {
    throw apiError_('Token tidak sah atau tiada. Sila log masuk semula.', 'UNAUTHORIZED');
  }
  if (allowed.indexOf(role) < 0) {
    throw apiError_('Akses tidak dibenarkan untuk peranan ini.', 'FORBIDDEN');
  }
  return role;
}

function roleForToken_(token) {
  if (!token) return '';
  var props = PropertiesService.getScriptProperties();
  var admin = props.getProperty('ADMIN_TOKEN') || '';
  var facilitator = props.getProperty('FASILITATOR_TOKEN') || '';
  if (admin && constantTimeEqual_(token, admin)) return 'admin';
  if (facilitator && constantTimeEqual_(token, facilitator)) return 'fasilitator';
  return '';
}

function constantTimeEqual_(a, b) {
  var left = String(a);
  var right = String(b);
  var length = Math.max(left.length, right.length);
  var diff = left.length ^ right.length;
  for (var i = 0; i < length; i++) {
    diff |= (left.charCodeAt(i) || 0) ^ (right.charCodeAt(i) || 0);
  }
  return diff === 0;
}

/* ------------------------------------------------------------------ */
/* Logging                                                             */
/* ------------------------------------------------------------------ */

function logAction_(action, details) {
  try {
    var db = SpreadsheetApp.getActiveSpreadsheet();
    if (!db) return;
    var sheet = db.getSheetByName('Log');
    if (!sheet) return;
    sheet.appendRow([
      isoNow_(),
      safeCell_(action),
      safeCell_(cleanText_(details, 300))
    ]);
  } catch (err) {
    console.error('Log failed: ' + err);
  }
}

/* ------------------------------------------------------------------ */
/* Formatting and validation helpers                                   */
/* ------------------------------------------------------------------ */

function apiError_(message, code) {
  var err = new Error(message);
  err.code = code || 'BAD_REQUEST';
  return err;
}

function cleanText_(value, maxLength) {
  if (value === null || value === undefined) return '';
  var text = String(value)
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.slice(0, maxLength || 300);
}

function safeCell_(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  var text = String(value);
  if (/^[=+\-@\t\r]/.test(text.trim())) return "'" + text;
  return text;
}

function normalizeNameKey_(value) {
  return String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function normalizePhone_(value) {
  var digits = String(value || '').replace(/\D/g, '');
  if (digits.indexOf('60') === 0) digits = '0' + digits.slice(2);
  if (!/^01\d{8,9}$/.test(digits)) return '';
  return digits;
}

function normalizeGender_(value) {
  var text = String(value || '').toLowerCase().trim();
  if (text === 'lelaki' || text === 'l' || text === 'male') return 'Lelaki';
  if (text === 'perempuan' || text === 'p' || text === 'female') return 'Perempuan';
  return '';
}

function normalizeYesNo_(value) {
  if (value === true || value === 1) return 'ya';
  if (value === false || value === 0) return 'tidak';
  var text = String(value || '').toLowerCase().trim();
  if (['ya', 'y', 'yes', 'true', '1', 'on'].indexOf(text) >= 0) return 'ya';
  if (['tidak', 'no', 'false', '0', 'off'].indexOf(text) >= 0) return 'tidak';
  return '';
}

function isTruthy_(value) {
  return normalizeYesNo_(value) === 'ya';
}

function toNumber_(value, fallback) {
  var n = Number(value);
  return isFinite(n) ? n : fallback;
}

function toInteger_(value, fallback) {
  var n = Number(value);
  return isFinite(n) ? Math.floor(n) : fallback;
}

function clampInteger_(value, min, max, fallback) {
  var n = toInteger_(value, fallback);
  return Math.min(max, Math.max(min, n));
}

function parseDate_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) return value;
  if (value === null || value === undefined || value === '') return null;
  var text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return new Date(text + 'T00:00:00' + TZ_SUFFIX_);
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(text)) return new Date(text + ':00' + TZ_SUFFIX_);
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(text)) return new Date(text + TZ_SUFFIX_);
  var date = new Date(text);
  return isNaN(date.getTime()) ? null : date;
}

function normalizeDateTime_(value) {
  var date = parseDate_(value);
  return date ? isoKl_(date) : '';
}

function normalizeDeadline_(value) {
  if (!value) return '';
  var text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text + 'T23:59:00' + TZ_SUFFIX_;
  }
  var date = parseDate_(value);
  return date ? isoKl_(date) : '';
}

function normalizeMilestoneDate_(value) {
  if (!value) return '';
  var text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text + 'T00:00:00' + TZ_SUFFIX_;
  }
  var date = parseDate_(value);
  return date ? isoKl_(date) : '';
}

function isoNow_() {
  return isoKl_(new Date());
}

function isoKl_(date) {
  return Utilities.formatDate(date, TZ_, "yyyy-MM-dd'T'HH:mm:ss") + TZ_SUFFIX_;
}

function extractSheetId_(value) {
  var text = String(value || '').trim();
  if (!text) return '';
  var match = /\/spreadsheets\/d\/([A-Za-z0-9_-]+)/.exec(text);
  if (match) return match[1];
  var idMatch = /[?&]id=([A-Za-z0-9_-]+)/.exec(text);
  if (idMatch) return idMatch[1];
  return text;
}

function whatsappNumber_(value) {
  var digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.indexOf('60') === 0) return digits;
  if (digits.indexOf('0') === 0) return '60' + digits.slice(1);
  return digits.length >= 9 ? digits : '';
}

/* ------------------------------------------------------------------ */
/* Seed data (salinan kepada web/data/seed-tasks.json)                 */
/* ------------------------------------------------------------------ */

var SEED_DATA_ = {
  milestones: [
    { tajuk: 'Pelancaran program dan sebar pautan pendaftaran di WhatsApp', tarikh: '2026-11-18', penerangan: 'Cadangan, sila sahkan tarikh pelancaran.', status: 'Belum' },
    { tajuk: 'Surat lawatan dihantar kepada Yayasan Restu dan Muzium', tarikh: '2026-11-22', penerangan: 'Surat rasmi permohonan lawatan kumpulan.', status: 'Belum' },
    { tajuk: 'Bas ditempah', tarikh: '2026-11-25', penerangan: 'Bas mini untuk 40 peserta dan fasilitator.', status: 'Belum' },
    { tajuk: 'Penceramah dan fasilitator disahkan', tarikh: '2026-11-30', penerangan: 'Dua penceramah dan lima fasilitator.', status: 'Belum' },
    { tajuk: 'Tutup pendaftaran (atau apabila 40 slot penuh)', tarikh: '2026-12-07', penerangan: 'Kunci senarai peserta muktamad.', status: 'Belum' },
    { tajuk: 'Modul dan tag siap dicetak', tarikh: '2026-12-09', penerangan: 'Modul program, tag peserta dan sijil.', status: 'Belum' },
    { tajuk: 'Senarai peserta muktamad dan borang kebenaran ibu bapa dikumpul', tarikh: '2026-12-11', penerangan: 'Pastikan indemniti dan kebenaran lengkap.', status: 'Belum' },
    { tajuk: 'Taklimat ibu bapa; pengesahan akhir makanan, bas dan destinasi', tarikh: '2026-12-12', penerangan: 'Masa taklimat akan dimaklumkan.', status: 'Belum' },
    { tajuk: 'Persiapan masjid', tarikh: '2026-12-13', penerangan: 'Susun atur dewan, pendaftaran dan peralatan.', status: 'Belum' },
    { tajuk: 'Hari 1 program', tarikh: '2026-12-14', penerangan: 'Masjid Kg. Sungai Lang Baru.', status: 'Belum' },
    { tajuk: 'Hari 2 program', tarikh: '2026-12-15', penerangan: 'Masjid Kg. Sungai Lang Baru.', status: 'Belum' },
    { tajuk: 'Hari 3 program (Shah Alam)', tarikh: '2026-12-16', penerangan: 'Yayasan Restu, Muzium Sultan Alam Shah, Masjid Negeri.', status: 'Belum' },
    { tajuk: 'Laporan kewangan dan maklum balas', tarikh: '2026-12-18', penerangan: 'Laporan akhir dan maklum balas ibu bapa.', status: 'Belum' }
  ],
  tasks: [
    { kategori: 'Pendaftaran', tugasan: 'Sedia dan uji borang pendaftaran online', pic: 'Urus Setia', deadline: '2026-11-17', status: 'Belum', catatan: 'Cadangan, sila sahkan' },
    { kategori: 'Pendaftaran', tugasan: 'Sebar pautan pendaftaran di WhatsApp', pic: 'Urus Setia', deadline: '2026-11-18', status: 'Belum', catatan: 'Cadangan, sila sahkan' },
    { kategori: 'Pendaftaran', tugasan: 'Hantar mesej pengesahan kepada pendaftar', pic: 'Urus Setia', deadline: '2026-11-24', status: 'Belum', catatan: 'Cadangan, sila sahkan' },
    { kategori: 'Pendaftaran', tugasan: 'Semak bayaran pendaftaran setiap hari', pic: 'Bendahari', deadline: '2026-12-07', status: 'Belum', catatan: 'Semak sehingga pendaftaran ditutup. Cadangan, sila sahkan' },
    { kategori: 'Pendaftaran', tugasan: 'Urus senarai tunggu jika kapasiti penuh', pic: 'Urus Setia', deadline: '2026-12-01', status: 'Belum', catatan: 'Cadangan, sila sahkan' },
    { kategori: 'Pendaftaran', tugasan: 'Tutup pendaftaran dan kunci senarai peserta', pic: 'Urus Setia', deadline: '2026-12-07', status: 'Belum', catatan: 'Cadangan, sila sahkan' },

    { kategori: 'Destinasi', tugasan: 'Hubungi Yayasan Restu untuk lawatan kumpulan', pic: 'AJK Lawatan', deadline: '2026-11-20', status: 'Belum', catatan: 'Kompleks Taman Seni Islam Antarabangsa, No. 2A Pesiaran Damai, Seksyen 10, Shah Alam. Sahkan yuran kumpulan.' },
    { kategori: 'Destinasi', tugasan: 'Hantar surat rasmi lawatan ke Yayasan Restu', pic: 'AJK Lawatan', deadline: '2026-11-22', status: 'Belum', catatan: 'Cadangan, sila sahkan' },
    { kategori: 'Destinasi', tugasan: 'Hubungi Muzium Sultan Alam Shah', pic: 'AJK Lawatan', deadline: '2026-11-20', status: 'Belum', catatan: '+60 3-5519 0050. Selasa-Ahad 9:30-5:30. Sahkan kadar tiket kumpulan.' },
    { kategori: 'Destinasi', tugasan: 'Hantar surat rasmi lawatan ke Muzium', pic: 'AJK Lawatan', deadline: '2026-11-22', status: 'Belum', catatan: 'Cadangan, sila sahkan' },
    { kategori: 'Destinasi', tugasan: 'Sahkan kadar tiket muzium untuk 40 peserta', pic: 'AJK Lawatan', deadline: '2026-11-27', status: 'Belum', catatan: 'Laporan pelawat: RM5 dewasa, RM2 kanak-kanak 7-12. Sahkan dengan muzium.' },
    { kategori: 'Destinasi', tugasan: 'Maklumkan Masjid Negeri Shah Alam (Zohor, makan, tasmik)', pic: 'AJK Lawatan', deadline: '2026-11-25', status: 'Belum', catatan: 'Solat Zohor berjemaah, makan tengah hari dan tasmik di kawasan tasik.' },
    { kategori: 'Destinasi', tugasan: 'Sahkan kebenaran penggunaan kawasan tasik dan masjid', pic: 'AJK Lawatan', deadline: '2026-12-04', status: 'Belum', catatan: 'Cadangan, sila sahkan' },

    { kategori: 'Logistik', tugasan: 'Tempah bas mini 40 peserta + fasilitator', pic: 'AJK Logistik', deadline: '2026-11-25', status: 'Belum', catatan: 'Cadangan, sila sahkan' },
    { kategori: 'Logistik', tugasan: 'Sahkan katering (minum pagi, tengah hari, petang)', pic: 'AJK Logistik', deadline: '2026-11-27', status: 'Belum', catatan: 'Draf: RM4 minum pagi, RM7 tengah hari, RM4 minum petang. Sahkan.' },
    { kategori: 'Logistik', tugasan: 'Sediakan senarai peralatan program', pic: 'AJK Logistik', deadline: '2026-12-09', status: 'Belum', catatan: 'Cadangan, sila sahkan' },
    { kategori: 'Logistik', tugasan: 'Sediakan pelan hujan dan pelan alternatif destinasi', pic: 'AJK Logistik', deadline: '2026-12-07', status: 'Belum', catatan: 'Cadangan, sila sahkan' },
    { kategori: 'Logistik', tugasan: 'Sediakan nombor kecemasan dan kit pertolongan cemas', pic: 'AJK Logistik', deadline: '2026-12-11', status: 'Belum', catatan: 'Cadangan, sila sahkan' },
    { kategori: 'Logistik', tugasan: 'Sahkan susun atur dewan dan ruang rehat', pic: 'AJK Logistik', deadline: '2026-12-13', status: 'Belum', catatan: 'Cadangan, sila sahkan' },

    { kategori: 'Kandungan', tugasan: 'Sahkan penceramah Slot Akhlak (Ust Shahril)', pic: 'AJK Program', deadline: '2026-11-27', status: 'Belum', catatan: 'Cadangan, sila sahkan' },
    { kategori: 'Kandungan', tugasan: 'Sahkan penceramah Slot Kepimpinan Remaja (Khairul Anuar)', pic: 'AJK Program', deadline: '2026-11-27', status: 'Belum', catatan: 'Cadangan, sila sahkan' },
    { kategori: 'Kandungan', tugasan: 'Sahkan 3 fasilitator tambahan (jumlah 5)', pic: 'AJK Program', deadline: '2026-11-30', status: 'Belum', catatan: 'Nama fasilitator belum ada dalam dokumen. Cadangan, sila sahkan' },
    { kategori: 'Kandungan', tugasan: 'Muktamadkan modul program', pic: 'AJK Program', deadline: '2026-12-04', status: 'Belum', catatan: 'Cadangan, sila sahkan' },
    { kategori: 'Kandungan', tugasan: 'Cetak modul program', pic: 'AJK Program', deadline: '2026-12-09', status: 'Belum', catatan: 'Cadangan, sila sahkan' },
    { kategori: 'Kandungan', tugasan: 'Cetak tag peserta', pic: 'AJK Program', deadline: '2026-12-09', status: 'Belum', catatan: 'Cadangan, sila sahkan' },
    { kategori: 'Kandungan', tugasan: 'Sediakan sijil penyertaan', pic: 'AJK Program', deadline: '2026-12-11', status: 'Belum', catatan: 'Cadangan, sila sahkan' },

    { kategori: 'Kewangan', tugasan: 'Sahkan bajet dengan bendahari', pic: 'Bendahari', deadline: '2026-11-20', status: 'Belum', catatan: 'Jumlah draf RM5,225; tiket muzium belum dimasukkan. Perlu disemak bendahari.' },
    { kategori: 'Kewangan', tugasan: 'Kutip yuran peserta', pic: 'Bendahari', deadline: '2026-12-07', status: 'Belum', catatan: 'Cadangan, sila sahkan' },
    { kategori: 'Kewangan', tugasan: 'Bayar deposit bas', pic: 'Bendahari', deadline: '2026-11-30', status: 'Belum', catatan: 'Cadangan, sila sahkan' },
    { kategori: 'Kewangan', tugasan: 'Bayar tiket muzium', pic: 'Bendahari', deadline: '2026-12-07', status: 'Belum', catatan: 'Anggaran RM2-RM5 x 40 = RM80-RM200. Sahkan.' },
    { kategori: 'Kewangan', tugasan: 'Bayar elaun fasilitator', pic: 'Bendahari', deadline: '2026-12-16', status: 'Belum', catatan: 'Draf RM80/hari x 3 hari x 5 orang = RM1,200. Sahkan asas pengiraan.' },
    { kategori: 'Kewangan', tugasan: 'Sediakan laporan kewangan akhir', pic: 'Bendahari', deadline: '2026-12-18', status: 'Belum', catatan: 'Cadangan, sila sahkan' },

    { kategori: 'Promosi', tugasan: 'Muktamadkan poster dan masukkan nombor telefon + QR', pic: 'AJK Promosi', deadline: '2026-11-17', status: 'Sedang', catatan: 'Poster asal belum memuatkan nombor urus setia dan QR.' },
    { kategori: 'Promosi', tugasan: 'Sebar poster di WhatsApp dan media sosial masjid', pic: 'AJK Promosi', deadline: '2026-11-18', status: 'Belum', catatan: 'Cadangan, sila sahkan' },
    { kategori: 'Promosi', tugasan: 'Pasang poster di papan kenyataan masjid', pic: 'AJK Promosi', deadline: '2026-11-19', status: 'Belum', catatan: 'Cadangan, sila sahkan' },

    { kategori: 'Hari Program', tugasan: 'Siapkan senarai semak Hari 1 (pendaftaran, kehadiran, solat, makan)', pic: 'Urus Setia', deadline: '2026-12-13', status: 'Belum', catatan: 'Cadangan, sila sahkan' },
    { kategori: 'Hari Program', tugasan: 'Siapkan senarai semak Hari 2 (hafazan, slot kepimpinan, murajaah)', pic: 'Urus Setia', deadline: '2026-12-14', status: 'Belum', catatan: 'Cadangan, sila sahkan' },
    { kategori: 'Hari Program', tugasan: 'Siapkan senarai semak Hari 3 (bas, destinasi, Zohor, tasmik)', pic: 'Urus Setia', deadline: '2026-12-15', status: 'Belum', catatan: 'Cadangan, sila sahkan' },

    { kategori: 'Selepas program', tugasan: 'Kumpul maklum balas ibu bapa', pic: 'Urus Setia', deadline: '2026-12-18', status: 'Belum', catatan: 'Cadangan, sila sahkan' },
    { kategori: 'Selepas program', tugasan: 'Tutup akaun dan sediakan laporan akhir', pic: 'Bendahari', deadline: '2026-12-23', status: 'Belum', catatan: 'Cadangan, sila sahkan' },
    { kategori: 'Selepas program', tugasan: 'Muat naik gambar dan dokumentasi', pic: 'AJK Promosi', deadline: '2026-12-23', status: 'Belum', catatan: 'Dapatkan kebenaran ibu bapa sebelum menyiarkan gambar peserta.' }
  ],
  budget: [
    { item: 'Bas mini (lawatan Hari 3)', kategori: 'Logistik', anggaran_rm: 1200, sebenar_rm: 0, catatan: 'Draf; perlu disemak bendahari' },
    { item: 'Slot ceramah (2 slot)', kategori: 'Kandungan', anggaran_rm: 600, sebenar_rm: 0, catatan: 'RM300 x 2. Perlu disemak bendahari' },
    { item: 'Tag peserta', kategori: 'Logistik', anggaran_rm: 100, sebenar_rm: 0, catatan: 'Draf; perlu disemak bendahari' },
    { item: 'Modul program', kategori: 'Kandungan', anggaran_rm: 100, sebenar_rm: 0, catatan: 'Draf; perlu disemak bendahari' },
    { item: 'Elaun fasilitator (5 orang)', kategori: 'Kandungan', anggaran_rm: 1200, sebenar_rm: 0, catatan: 'Draf; asas pengiraan perlu disahkan' },
    { item: 'Makanan dan minuman', kategori: 'Logistik', anggaran_rm: 2025, sebenar_rm: 0, catatan: 'RM45 x 45 orang. Perlu disemak bendahari' },
    { item: 'Tiket muzium (anggaran, belum dimasukkan)', kategori: 'Destinasi', anggaran_rm: 0, sebenar_rm: 0, catatan: 'Anggaran RM2-RM5 x 40 = RM80-RM200. Belum dimasukkan dalam jumlah draf.' }
  ]
};
