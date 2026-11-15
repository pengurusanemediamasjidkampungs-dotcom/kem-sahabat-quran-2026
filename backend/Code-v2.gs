/**
 * ============================================================================
 *  KEM SAHABAT QURAN (KSQ) 2026  —  Code.gs
 *  Masjid Kampung Sungai Lang Baru, Banting
 * ============================================================================
 *  Satu fail ini menyediakan:
 *   1. Struktur Google Sheets (setiap tab asing) — dibina automatik.
 *   2. API Web App (doGet / doPost) untuk laman pendaftaran, fasilitator & admin.
 *   3. Checklist & tugasan (sebelum / semasa / selepas, pengurus, pengarah).
 *   4. Semakan & penjanaan sijil PDF (Google Slides -> PDF -> Google Drive).
 *   5. Fungsi debug, sandaran dan Dashboard.
 *
 *  TAB YANG DIBINA (semua asing)
 *   Dashboard · Tetapan · Peserta_Lelaki · Peserta_Perempuan · Fasilitator
 *   Checklist_Sebelum · Checklist_Semasa · Checklist_Selepas
 *   Tugas_Pengurus · Tugas_Pengarah · Semak_Sijil · Log
 *
 *  CARA PASANG (sekali sahaja)
 *   1. Buka Google Sheets baharu -> Extensions -> Apps Script.
 *   2. Tampal kandungan fail ini ke dalam Code.gs. (Pilihan: Project Settings ->
 *      "Show appsscript.json" dan tampal fail appsscript.json yang disertakan.)
 *   3. Simpan, muat semula Sheet, kemudian pilih menu  KSQ 2026 -> 1. Sediakan sistem.
 *      (Beri kebenaran apabila diminta.)
 *   4. Menu  KSQ 2026 -> Debug -> Jana token baharu  (simpan token fasilitator & admin).
 *   5. Semak tab Tetapan (tarikh, tarikh tutup, nama pengerusi/pengarah, emel admin).
 *   6. Deploy -> New deployment -> Web app
 *        Execute as: Me   |   Who has access: Anyone
 *      Salin URL .../exec dan letakkan dalam konfigurasi laman web anda.
 *   7. Menu  KSQ 2026 -> Debug -> Semak kesihatan sistem  untuk pastikan semuanya OK.
 *   8. Selepas mengubah kod, buat "Manage deployments -> Edit -> New version".
 *
 *  KONTRAK API (POST dengan Content-Type: text/plain, badan JSON — mengelak preflight CORS)
 *   Awam   : GET  ?action=stats            -> baki slot, tarikh tutup, yuran
 *            POST {action:"register", nama_peserta, umur, jantina, tel_penjaga,
 *                  nama_penjaga, lancar_quran, alahan_kesihatan, persetujuan_data, website}
 *   Fasil. : POST {action:"fac_login"|"fac_list"|"fac_mark", token, id, hari, status}
 *   Admin  : POST {action:"admin_login"|"admin_list"|"admin_stats"|"admin_update"|"admin_add", token, ...}
 *   Respons: {ok:true, data:{...}}  atau  {ok:false, error:"...", code:"...", fields:{...}}
 * ============================================================================
 */

/* ============================================================================
 * 1. PEMALAR
 * ========================================================================== */
const VERSI = '1.0.0';
const TZ = 'Asia/Kuala_Lumpur';
const PREFIX_ID = 'KSQ26';

const TAB = {
  DASHBOARD: 'Dashboard',
  TETAPAN: 'Tetapan',
  LELAKI: 'Peserta_Lelaki',
  PEREMPUAN: 'Peserta_Perempuan',
  FASILITATOR: 'Fasilitator',
  SEBELUM: 'Checklist_Sebelum',
  SEMASA: 'Checklist_Semasa',
  SELEPAS: 'Checklist_Selepas',
  PENGURUS: 'Tugas_Pengurus',
  PENGARAH: 'Tugas_Pengarah',
  SIJIL: 'Semak_Sijil',
  LOG: 'Log'
};
const TAB_TUGAS = [TAB.SEBELUM, TAB.SEMASA, TAB.SELEPAS, TAB.PENGURUS, TAB.PENGARAH];

const STATUS = {
  MENUNGGU: 'Menunggu',
  SAH: 'Disahkan',
  SENARAI: 'Senarai menunggu',
  BATAL: 'Dibatalkan',
  TOLAK: 'Ditolak'
};
const SENARAI_STATUS = Object.keys(STATUS).map(function (k) { return STATUS[k]; });
const SENARAI_BAYAR = ['Belum', 'Dibayar', 'Diskaun', 'Dikecualikan'];
const SENARAI_KAEDAH = ['Online', 'Tunai', 'Pindahan', 'Manual'];
const SENARAI_HADIR = ['Hadir', 'Tidak hadir'];
const SENARAI_TUGAS = ['Belum', 'Sedang dibuat', 'Siap', 'Tidak berkenaan'];
const SENARAI_ELAUN = ['Belum', 'Dibayar'];

const H_PESERTA = [
  'ID', 'Tarikh daftar', 'Nama peserta', 'Umur', 'Jantina', 'Nama penjaga', 'Tel penjaga',
  'Lancar Quran', 'Alahan / kesihatan', 'Persetujuan data', 'Status', 'Kaedah daftar',
  'Yuran (RM)', 'Status bayaran', 'Tarikh bayar', 'Rujukan bayaran',
  'Hari 1', 'Hari 2', 'Hari 3', 'Kumpulan', 'Catatan', 'Dikemas kini'
];
const H_FAC = [
  'ID', 'Nama', 'Jantina', 'Tel', 'Peranan', 'Tugasan / kumpulan',
  'Hari 1', 'Hari 2', 'Hari 3', 'Elaun sehari (RM)', 'Hari hadir', 'Jumlah elaun (RM)',
  'Status elaun', 'Catatan', 'Dikemas kini'
];
const H_TUGAS = ['Bil', 'Fasa', 'Kategori', 'Tugasan', 'Penanggungjawab', 'H± (hari)', 'Tarikh akhir', 'Status', 'Siap pada', 'Catatan'];
const H_SIJIL = [
  'ID', 'Nama peserta', 'Jantina', 'Hari hadir', 'Layak (auto)', 'Nama pada sijil',
  'Semakan nama', 'Kelulusan pengarah', 'No. sijil', 'Tarikh jana', 'Pautan PDF',
  'Dicetak', 'Diserahkan', 'Catatan'
];
const H_LOG = ['Masa', 'Tahap', 'Fungsi', 'Mesej', 'Data'];

function idx_(h) { const o = {}; h.forEach(function (n, i) { o[n] = i; }); return o; }
const CP = idx_(H_PESERTA);
const CF = idx_(H_FAC);
const CT = idx_(H_TUGAS);
const CS = idx_(H_SIJIL);

/** Kunci API (snake_case) -> tajuk lajur peserta */
const KUNCI_API = {
  id: 'ID', tarikh_daftar: 'Tarikh daftar', nama_peserta: 'Nama peserta', umur: 'Umur',
  jantina: 'Jantina', nama_penjaga: 'Nama penjaga', tel_penjaga: 'Tel penjaga',
  lancar_quran: 'Lancar Quran', alahan_kesihatan: 'Alahan / kesihatan', status: 'Status',
  kaedah_daftar: 'Kaedah daftar', yuran: 'Yuran (RM)', status_bayaran: 'Status bayaran',
  tarikh_bayar: 'Tarikh bayar', rujukan_bayaran: 'Rujukan bayaran',
  hari1: 'Hari 1', hari2: 'Hari 2', hari3: 'Hari 3', kumpulan: 'Kumpulan',
  catatan: 'Catatan', dikemas_kini: 'Dikemas kini'
};
/** Medan yang boleh diubah oleh admin melalui API */
const BOLEH_KEMAS = [
  'nama_peserta', 'umur', 'nama_penjaga', 'tel_penjaga', 'alahan_kesihatan', 'status',
  'kaedah_daftar', 'yuran', 'status_bayaran', 'tarikh_bayar', 'rujukan_bayaran',
  'kumpulan', 'catatan', 'hari1', 'hari2', 'hari3'
];
const KUNCI_FAC = ['id', 'nama_peserta', 'umur', 'jantina', 'nama_penjaga', 'tel_penjaga', 'alahan_kesihatan', 'hari1', 'hari2', 'hari3', 'kumpulan'];

/** Tetapan lalai: [kunci, nilai, keterangan] */
const LALAI = [
  ['TAJUK_PROGRAM', 'Kem Sahabat Quran (KSQ) 2026', 'Nama program (dipaparkan pada sijil dan emel)'],
  ['LOKASI', 'Masjid Kampung Sungai Lang Baru, Banting, Selangor', 'Lokasi program (dipaparkan pada sijil)'],
  ['TARIKH_MULA', new Date(2026, 11, 14), 'Hari 1. Semua tarikh akhir checklist dikira daripada tarikh ini (H±).'],
  ['TARIKH_TAMAT', new Date(2026, 11, 16), 'Hari 3'],
  ['TUTUP_DAFTAR', new Date(2026, 11, 7, 23, 59), 'Pendaftaran ditutup selepas masa ini (SILA SEMAK)'],
  ['PENDAFTARAN_DIBUKA', true, 'Suis manual. Nyahtanda untuk menutup pendaftaran serta-merta.'],
  ['KAPASITI', 40, 'Jumlah slot peserta'],
  ['KIRA_SLOT_STATUS', 'Menunggu,Disahkan', 'Status yang menggunakan slot (pisahkan dengan koma)'],
  ['SENARAI_MENUNGGU', false, 'Jika slot penuh: tandakan untuk terima pendaftaran ke senarai menunggu'],
  ['UMUR_MIN', 10, 'Umur minimum peserta'],
  ['UMUR_MAX', 18, 'Umur maksimum peserta'],
  ['YURAN_ASAL', 180, 'Harga asal (RM)'],
  ['YURAN_PROMO', 120, 'Yuran promosi (RM)'],
  ['YURAN_ONLINE', 110, 'Yuran pendaftaran online (RM) — digunakan untuk pendaftaran melalui laman web'],
  ['ELAUN_FASILITATOR', 80, 'Elaun fasilitator sehari (RM)'],
  ['EMAIL_ADMIN', '', 'Emel untuk pemberitahuan pendaftaran baharu (kosong = tidak hantar)'],
  ['MIN_HADIR_SIJIL', 2, 'Minimum hari hadir untuk layak sijil (1–3). Lalai 2 supaya sijil boleh disediakan sebelum Hari 3.'],
  ['SURAH_SASARAN', 'Surah Al-Mulk, Al-Kahfi, As-Sajdah dan Al-Insan', 'Dipaparkan pada sijil'],
  ['NAMA_PENGERUSI', '[Nama Pengerusi Masjid]', 'Tandatangan kiri pada sijil'],
  ['NAMA_PENGARAH', '[Nama Pengarah Program]', 'Tandatangan kanan pada sijil'],
  ['LOGO_FILE_ID', '', 'ID fail logo (PNG lutsinar) di Google Drive — pilihan, untuk sijil'],
  ['FOLDER_SIJIL_ID', '', 'Diisi automatik: folder Google Drive untuk PDF sijil'],
  ['TEMPLAT_SIJIL_ID', '', 'Diisi automatik: ID templat Google Slides sijil']
];

/* ============================================================================
 * 2. RALAT, UTILITI & TETAPAN
 * ========================================================================== */
class RalatApi extends Error {
  constructor(mesej, kod, fields) {
    super(mesej);
    this.name = 'RalatApi';
    this.kod = kod || 'RALAT';
    this.fields = fields || null;
  }
}

const BULAN = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'];
const HARI_BM = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];

function tarikhBM_(d) { return d.getDate() + ' ' + BULAN[d.getMonth()] + ' ' + d.getFullYear(); }
function julatTarikhBM_(a, b) {
  if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) {
    return a.getDate() + ' hingga ' + b.getDate() + ' ' + BULAN[b.getMonth()] + ' ' + b.getFullYear();
  }
  return tarikhBM_(a) + ' hingga ' + tarikhBM_(b);
}
function iso_(d) {
  return (d instanceof Date && !isNaN(d)) ? Utilities.formatDate(d, TZ, "yyyy-MM-dd'T'HH:mm:ssXXX") : (d == null ? '' : String(d));
}
function sekarang_() { return new Date(); }
function huruf_(n) { let s = ''; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; }
function bool_(v) { return v === true || String(v).toUpperCase() === 'TRUE' || String(v) === '1'; }
function num_(v, lalai) { const n = Number(v); return (v === '' || v == null || isNaN(n)) ? lalai : n; }
function tarikh_(v) {
  if (v instanceof Date) return isNaN(v) ? null : v;
  const s = String(v || '').trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
  return null;
}
function bersih_(v, maks) {
  let s = String(v == null ? '' : v).replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim();
  s = s.replace(/^[=+\-@]+/, '').trim(); // elak formula injection
  return maks ? s.slice(0, maks) : s;
}
function samaSelamat_(a, b) {
  a = String(a || ''); b = String(b || '');
  if (!b) return false;
  let d = a.length ^ b.length;
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) d |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return d === 0;
}
function tajukKes_(nama) {
  const kecil = { bin: 1, binti: 1, bt: 1, 'bt.': 1, 'b.': 1, ibni: 1, al: 1, 'a/l': 1, 'a/p': 1 };
  return String(nama || '').toLowerCase().split(' ').map(function (w, i) {
    if (i > 0 && kecil[w]) return w;
    return w.replace(/(^|[-'’\/.])(\p{L})/gu, function (_, p, c) { return p + c.toUpperCase(); });
  }).join(' ');
}
function normTel_(t) {
  let d = String(t || '').replace(/\D/g, '');
  if (!d) return { ok: false };
  if (d.indexOf('60') === 0) d = '0' + d.slice(2);
  else if (d.charAt(0) !== '0') d = '0' + d;
  if (/^01\d{8,9}$/.test(d)) return { ok: true, digit: d, papar: d.slice(0, 3) + '-' + d.slice(3) };
  if (/^0[3-9]\d{7,8}$/.test(d)) return { ok: true, digit: d, papar: d.slice(0, 2) + '-' + d.slice(2) };
  return { ok: false };
}
function kunciNama_(s) { return String(s || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim(); }

let _SS = null;
function ss_() {
  if (_SS) return _SS;
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('SPREADSHEET_ID');
  if (id) { _SS = SpreadsheetApp.openById(id); return _SS; }
  const aktif = SpreadsheetApp.getActiveSpreadsheet();
  if (aktif) { props.setProperty('SPREADSHEET_ID', aktif.getId()); _SS = aktif; return _SS; }
  throw new RalatApi('Spreadsheet belum disambungkan. Jalankan menu KSQ 2026 -> Sediakan sistem.', 'SETUP');
}
function sheet_(nama) {
  const sh = ss_().getSheetByName(nama);
  if (!sh) throw new RalatApi('Tab "' + nama + '" tiada. Jalankan menu KSQ 2026 -> Sediakan sistem.', 'SETUP');
  return sh;
}

let _CFG = null;
function tetapan_(segar) {
  if (_CFG && !segar) return _CFG;
  const cfg = {};
  LALAI.forEach(function (r) { cfg[r[0]] = r[1]; });
  const sh = ss_().getSheetByName(TAB.TETAPAN);
  if (sh && sh.getLastRow() >= 2) {
    sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues().forEach(function (r) {
      const k = String(r[0]).trim();
      if (k && r[1] !== '') cfg[k] = r[1];
    });
  }
  cfg.KAPASITI = num_(cfg.KAPASITI, 40);
  cfg.UMUR_MIN = num_(cfg.UMUR_MIN, 10);
  cfg.UMUR_MAX = num_(cfg.UMUR_MAX, 18);
  cfg.YURAN_ASAL = num_(cfg.YURAN_ASAL, 180);
  cfg.YURAN_PROMO = num_(cfg.YURAN_PROMO, 120);
  cfg.YURAN_ONLINE = num_(cfg.YURAN_ONLINE, 110);
  cfg.ELAUN_FASILITATOR = num_(cfg.ELAUN_FASILITATOR, 80);
  cfg.MIN_HADIR_SIJIL = Math.min(3, Math.max(1, num_(cfg.MIN_HADIR_SIJIL, 2)));
  cfg.PENDAFTARAN_DIBUKA = bool_(cfg.PENDAFTARAN_DIBUKA);
  cfg.SENARAI_MENUNGGU = bool_(cfg.SENARAI_MENUNGGU);
  cfg.TARIKH_MULA = tarikh_(cfg.TARIKH_MULA) || new Date(2026, 11, 14);
  cfg.TARIKH_TAMAT = tarikh_(cfg.TARIKH_TAMAT) || new Date(2026, 11, 16);
  cfg.TUTUP_DAFTAR = tarikh_(cfg.TUTUP_DAFTAR);
  cfg.SLOT_STATUS = String(cfg.KIRA_SLOT_STATUS).split(',').map(function (s) { return s.trim(); }).filter(String);
  _CFG = cfg;
  return cfg;
}

function ambilKunci_() {
  const k = LockService.getScriptLock();
  try { k.waitLock(20000); } catch (e) { throw new RalatApi('Sistem sedang sibuk. Sila cuba lagi sebentar.', 'SIBUK'); }
  return k;
}

/** Tulis ke tab Log (untuk debug & audit). Tidak pernah membuang ralat. */
function log_(tahap, fungsi, mesej, data) {
  try {
    Logger.log('[' + tahap + '] ' + fungsi + ': ' + mesej);
    const sh = ss_().getSheetByName(TAB.LOG);
    if (!sh) return;
    let d = '';
    if (data !== undefined) { try { d = JSON.stringify(data).slice(0, 500); } catch (e) { d = String(data).slice(0, 500); } }
    sh.appendRow([new Date(), tahap, fungsi, String(mesej).slice(0, 500), d]);
    if (sh.getLastRow() > 3500) sh.deleteRows(2, 500);
  } catch (e) { /* abaikan */ }
}

/* ============================================================================
 * 3. MENU & PENCETUS (TRIGGER)
 * ========================================================================== */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('KSQ 2026')
    .addItem('1. Sediakan sistem (bina semua tab)', 'bina_semuaTab')
    .addItem('Isi semula checklist & tugasan lalai…', 'isi_semulaTugasLalai')
    .addItem('Kemas kini Dashboard', 'bina_dashboard')
    .addSeparator()
    .addItem('Segerak Semak Sijil', 'segerak_semakSijil')
    .addItem('Bina templat sijil', 'bina_templatSijil')
    .addSubMenu(ui.createMenu('Jana sijil')
      .addItem('Yang telah disemak & diluluskan', 'jana_sijilDisemak')
      .addItem('Semua yang layak', 'jana_sijilSemua')
      .addItem('Baris dipilih (tab Semak_Sijil)', 'jana_sijilTerpilih'))
    .addSeparator()
    .addItem('Sandar spreadsheet sekarang', 'sandar_sekarang')
    .addItem('Pasang sandaran harian (2 pagi)', 'pasang_pencetus')
    .addItem('Buang pencetus sandaran', 'buang_pencetus')
    .addSeparator()
    .addSubMenu(ui.createMenu('Debug')
      .addItem('Semak kesihatan sistem', 'debug_semakSistem')
      .addItem('Papar konfigurasi', 'debug_paparKonfigurasi')
      .addItem('Uji API (stats / fasilitator / daftar)', 'debug_ujiAPI')
      .addItem('Uji pendaftaran (1 rekod [UJIAN])', 'debug_ujiDaftar')
      .addItem('Isi 10 data contoh [UJIAN]', 'debug_isiDataContoh')
      .addItem('Padam semua data [UJIAN]', 'debug_padamDataUjian')
      .addItem('Jana token baharu', 'debug_janaToken')
      .addItem('Kosongkan Log', 'debug_kosongLog'))
    .addToUi();
}

/** Pencetus mudah: cap masa, auto "Siap pada", auto ID fasilitator. */
function onEdit(e) {
  try {
    if (!e || !e.range) return;
    const sh = e.range.getSheet();
    const nama = sh.getName();
    const r0 = e.range.getRow();
    const n = e.range.getNumRows();
    const c0 = e.range.getColumn();
    const c1 = c0 + e.range.getNumColumns() - 1;
    if (r0 < 2) return;
    const kini = new Date();

    if (nama === TAB.LELAKI || nama === TAB.PEREMPUAN) {
      const cKemas = CP['Dikemas kini'] + 1;
      if (c0 === c1 && c0 === cKemas) return;
      sh.getRange(r0, cKemas, n, 1).setValue(kini);
    } else if (nama === TAB.FASILITATOR) {
      const cNama = CF['Nama'] + 1;
      if (c0 <= cNama && c1 >= cNama) {
        for (let i = 0; i < n; i++) {
          const r = r0 + i;
          if (String(sh.getRange(r, cNama).getValue()).trim() && !String(sh.getRange(r, 1).getValue()).trim()) {
            sh.getRange(r, 1).setValue(idBerikutFasilitator_(sh));
            if (!String(sh.getRange(r, CF['Elaun sehari (RM)'] + 1).getValue())) {
              sh.getRange(r, CF['Elaun sehari (RM)'] + 1).setValue(tetapan_().ELAUN_FASILITATOR);
            }
          }
        }
      }
      sh.getRange(r0, CF['Dikemas kini'] + 1, n, 1).setValue(kini);
    } else if (TAB_TUGAS.indexOf(nama) >= 0) {
      const cStatus = CT['Status'] + 1;
      if (c0 <= cStatus && c1 >= cStatus) {
        const st = sh.getRange(r0, cStatus, n, 1).getValues();
        const siap = st.map(function (r) { return [r[0] === 'Siap' ? kini : '']; });
        sh.getRange(r0, CT['Siap pada'] + 1, n, 1).setValues(siap);
      }
    }
  } catch (err) { /* pencetus mudah: jangan ganggu pengguna */ }
}

function pasang_pencetus() {
  buang_pencetus(true);
  ScriptApp.newTrigger('sandar_harian').timeBased().everyDays(1).atHour(2).inTimezone(TZ).create();
  maklum_('Pencetus dipasang', 'Sandaran harian akan berjalan sekitar jam 2 pagi (waktu Malaysia).');
}
function buang_pencetus(senyap) {
  let n = 0;
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'sandar_harian') { ScriptApp.deleteTrigger(t); n++; }
  });
  if (!senyap) maklum_('Pencetus dibuang', n + ' pencetus sandaran dibuang.');
}

/* ============================================================================
 * 4. BINA STRUKTUR SHEETS
 * ========================================================================== */
const WARNA = { tajuk: '#06301F', tajukTeks: '#F0CC72', emas: '#D9B25E' };

function maklum_(tajuk, mesej) {
  try { SpreadsheetApp.getUi().alert(tajuk, mesej, SpreadsheetApp.getUi().ButtonSet.OK); }
  catch (e) { Logger.log(tajuk + ': ' + mesej); }
}
function paparLaporan_(tajuk, baris) {
  const html = '<div style="font-family:Consolas,monospace;font-size:12px;white-space:pre-wrap;line-height:1.5">' +
    baris.map(function (b) { return String(b).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }).join('\n') + '</div>';
  try {
    SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(html).setWidth(720).setHeight(480), tajuk);
  } catch (e) { Logger.log(tajuk + '\n' + baris.join('\n')); }
}
function toast_(mesej) { try { ss_().toast(mesej, 'KSQ 2026', 6); } catch (e) { Logger.log(mesej); } }

function pastikanTab_(ss, nama, warna) {
  let sh = ss.getSheetByName(nama);
  if (!sh) sh = ss.insertSheet(nama);
  if (warna) sh.setTabColor(warna);
  return sh;
}
function tulisTajuk_(sh, tajuk) {
  const sedia = sh.getRange(1, 1, 1, tajuk.length).getValues()[0];
  const sama = sedia.every(function (v, i) { return v === tajuk[i]; });
  if (!sama) sh.getRange(1, 1, 1, tajuk.length).setValues([tajuk]);
  sh.getRange(1, 1, 1, tajuk.length)
    .setBackground(WARNA.tajuk).setFontColor(WARNA.tajukTeks).setFontWeight('bold')
    .setHorizontalAlignment('center').setVerticalAlignment('middle').setWrap(true);
  sh.setRowHeight(1, 36);
  sh.setFrozenRows(1);
}
function lebar_(sh, arr) { arr.forEach(function (w, i) { sh.setColumnWidth(i + 1, w); }); }
function pastikanBaris_(sh, minimum) {
  const maks = sh.getMaxRows();
  if (maks < minimum) sh.insertRowsAfter(maks, minimum - maks);
}
function senaraiVal_(arr, benarKosong) {
  return SpreadsheetApp.newDataValidation().requireValueInList(arr, true).setAllowInvalid(!!benarKosong).build();
}
function kesanTeks_(sh, lajur, nilai, latar, teks) {
  return SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo(nilai).setBackground(latar).setFontColor(teks)
    .setRanges([sh.getRange(2, lajur, Math.max(sh.getMaxRows() - 1, 1), 1)]).build();
}

function bina_semuaTab() {
  const ss = ss_();
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', ss.getId());
  ss.setSpreadsheetTimeZone(TZ);
  binaTetapan_(ss);
  binaPeserta_(ss, TAB.LELAKI, '#2E7D9A');
  binaPeserta_(ss, TAB.PEREMPUAN, '#B5547A');
  binaFasilitator_(ss);
  binaTugas_(ss, TAB.SEBELUM, SEED.sebelum, '', '#D9B25E');
  binaTugas_(ss, TAB.SEMASA, SEED.semasa, '', '#D9B25E');
  binaTugas_(ss, TAB.SELEPAS, SEED.selepas, '', '#D9B25E');
  binaTugas_(ss, TAB.PENGURUS, SEED.pengurus, 'Pengurus program', '#8E141C');
  binaTugas_(ss, TAB.PENGARAH, SEED.pengarah, 'Pengarah program', '#8E141C');
  binaSijil_(ss);
  binaLog_(ss);
  bina_dashboard();
  susunTab_(ss);
  ['Sheet1', 'Helaian1', 'Sheet 1'].forEach(function (n) {
    const s = ss.getSheetByName(n);
    if (s && s.getLastRow() <= 1 && s.getLastColumn() <= 1 && ss.getSheets().length > 1) ss.deleteSheet(s);
  });
  _CFG = null;
  log_('INFO', 'bina_semuaTab', 'Struktur disediakan');
  maklum_('Siap', 'Semua tab telah disediakan.\n\nLangkah seterusnya:\n1) Debug -> Jana token baharu\n2) Semak tab Tetapan\n3) Deploy sebagai Web app.');
}

function susunTab_(ss) {
  const susunan = [TAB.DASHBOARD, TAB.TETAPAN, TAB.LELAKI, TAB.PEREMPUAN, TAB.FASILITATOR, TAB.SEBELUM, TAB.SEMASA,
    TAB.SELEPAS, TAB.PENGURUS, TAB.PENGARAH, TAB.SIJIL, TAB.LOG];
  susunan.forEach(function (n, i) {
    const sh = ss.getSheetByName(n);
    if (sh) { ss.setActiveSheet(sh); ss.moveActiveSheet(i + 1); }
  });
  ss.setActiveSheet(ss.getSheetByName(TAB.DASHBOARD));
}

/* ---- Tetapan ---- */
function binaTetapan_(ss) {
  const sh = pastikanTab_(ss, TAB.TETAPAN, '#757575');
  tulisTajuk_(sh, ['Kunci', 'Nilai', 'Keterangan']);
  const sedia = {};
  if (sh.getLastRow() >= 2) {
    sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues().forEach(function (r, i) { sedia[String(r[0]).trim()] = i + 2; });
  }
  LALAI.forEach(function (r) {
    if (!sedia[r[0]]) {
      const baris = Math.max(sh.getLastRow(), 1) + 1;
      sh.getRange(baris, 1, 1, 3).setValues([r]);
      sedia[r[0]] = baris;
    }
  });
  lebar_(sh, [210, 300, 520]);
  sh.getRange(2, 1, sh.getLastRow() - 1, 1).setFontWeight('bold');
  sh.getRange(2, 3, sh.getLastRow() - 1, 1).setFontColor('#616161').setWrap(true);
  sh.getRange(2, 2, sh.getLastRow() - 1, 1).setBackground('#FFF8E1').setHorizontalAlignment('left');
  ['TARIKH_MULA', 'TARIKH_TAMAT'].forEach(function (k) { sh.getRange(sedia[k], 2).setNumberFormat('dd/MM/yyyy (dddd)'); });
  sh.getRange(sedia.TUTUP_DAFTAR, 2).setNumberFormat('dd/MM/yyyy HH:mm');
  ['PENDAFTARAN_DIBUKA', 'SENARAI_MENUNGGU'].forEach(function (k) {
    sh.getRange(sedia[k], 2).setDataValidation(SpreadsheetApp.newDataValidation().requireCheckbox().build());
  });
  ['LOGO_FILE_ID', 'FOLDER_SIJIL_ID', 'TEMPLAT_SIJIL_ID', 'EMAIL_ADMIN'].forEach(function (k) {
    sh.getRange(sedia[k], 2).setNumberFormat('@');
  });
  ss.setNamedRange('TarikhMula', sh.getRange(sedia.TARIKH_MULA, 2));
}

/* ---- Peserta (lelaki / perempuan) ---- */
const FMT_PESERTA = (function () {
  const f = H_PESERTA.map(function () { return '@'; });
  f[CP['Tarikh daftar']] = 'dd/MM/yyyy HH:mm';
  f[CP['Umur']] = '0';
  f[CP['Yuran (RM)']] = '0.00';
  f[CP['Tarikh bayar']] = 'dd/MM/yyyy';
  f[CP['Dikemas kini']] = 'dd/MM/yyyy HH:mm';
  return f;
})();

function binaPeserta_(ss, nama, warna) {
  const sh = pastikanTab_(ss, nama, warna);
  tulisTajuk_(sh, H_PESERTA);
  pastikanBaris_(sh, 200);
  const baris = sh.getMaxRows() - 1;
  H_PESERTA.forEach(function (_, i) { sh.getRange(2, i + 1, baris, 1).setNumberFormat(FMT_PESERTA[i]); });
  lebar_(sh, [110, 120, 190, 55, 80, 170, 115, 90, 200, 90, 120, 100, 80, 110, 100, 130, 80, 80, 80, 100, 220, 120]);
  const ulang = function (lajur, senarai) { sh.getRange(2, CP[lajur] + 1, baris, 1).setDataValidation(senaraiVal_(senarai, true)); };
  ulang('Status', SENARAI_STATUS);
  ulang('Status bayaran', SENARAI_BAYAR);
  ulang('Kaedah daftar', SENARAI_KAEDAH);
  ulang('Lancar Quran', ['Ya', 'Tidak']);
  ulang('Jantina', ['Lelaki', 'Perempuan']);
  ['Hari 1', 'Hari 2', 'Hari 3'].forEach(function (h) { ulang(h, SENARAI_HADIR); });
  sh.getRange(2, CP['Umur'] + 1, baris, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireNumberBetween(5, 30).setAllowInvalid(true).build());
  sh.getRange(2, CP['Alahan / kesihatan'] + 1, baris, 1).setWrap(true);
  sh.getRange(2, CP['Catatan'] + 1, baris, 1).setWrap(true);
  const cStatus = CP['Status'] + 1, cBayar = CP['Status bayaran'] + 1;
  const rules = [
    kesanTeks_(sh, cStatus, STATUS.SAH, '#C8E6C9', '#1B5E20'),
    kesanTeks_(sh, cStatus, STATUS.MENUNGGU, '#FFF3CD', '#7A5B00'),
    kesanTeks_(sh, cStatus, STATUS.SENARAI, '#E1BEE7', '#4A148C'),
    kesanTeks_(sh, cStatus, STATUS.BATAL, '#E0E0E0', '#424242'),
    kesanTeks_(sh, cStatus, STATUS.TOLAK, '#FFCDD2', '#B71C1C'),
    kesanTeks_(sh, cBayar, 'Dibayar', '#C8E6C9', '#1B5E20'),
    kesanTeks_(sh, cBayar, 'Belum', '#FFE0B2', '#E65100')
  ];
  ['Hari 1', 'Hari 2', 'Hari 3'].forEach(function (h) {
    rules.push(kesanTeks_(sh, CP[h] + 1, 'Hadir', '#C8E6C9', '#1B5E20'));
    rules.push(kesanTeks_(sh, CP[h] + 1, 'Tidak hadir', '#FFCDD2', '#B71C1C'));
  });
  sh.setConditionalFormatRules(rules);
  sh.setFrozenColumns(3);
  if (!sh.getFilter()) sh.getRange(1, 1, sh.getMaxRows(), H_PESERTA.length).createFilter();
}

/* ---- Fasilitator ---- */
function binaFasilitator_(ss) {
  const sh = pastikanTab_(ss, TAB.FASILITATOR, '#0A6A40');
  tulisTajuk_(sh, H_FAC);
  pastikanBaris_(sh, 80);
  const baris = 60;
  const fmt = H_FAC.map(function () { return '@'; });
  fmt[CF['Elaun sehari (RM)']] = '0.00';
  fmt[CF['Hari hadir']] = '0';
  fmt[CF['Jumlah elaun (RM)']] = '0.00';
  fmt[CF['Dikemas kini']] = 'dd/MM/yyyy HH:mm';
  H_FAC.forEach(function (_, i) { sh.getRange(2, i + 1, baris, 1).setNumberFormat(fmt[i]); });
  lebar_(sh, [110, 190, 80, 115, 150, 200, 80, 80, 80, 110, 80, 120, 100, 220, 120]);
  ['Hari 1', 'Hari 2', 'Hari 3'].forEach(function (h) { sh.getRange(2, CF[h] + 1, baris, 1).setDataValidation(senaraiVal_(SENARAI_HADIR, true)); });
  sh.getRange(2, CF['Jantina'] + 1, baris, 1).setDataValidation(senaraiVal_(['Lelaki', 'Perempuan'], true));
  sh.getRange(2, CF['Status elaun'] + 1, baris, 1).setDataValidation(senaraiVal_(SENARAI_ELAUN, true));
  const g = huruf_(CF['Hari 1'] + 1), i3 = huruf_(CF['Hari 3'] + 1), j = huruf_(CF['Elaun sehari (RM)'] + 1), k = huruf_(CF['Hari hadir'] + 1);
  const fx = [];
  for (let r = 2; r < 2 + baris; r++) {
    fx.push(['=IF($B' + r + '="","",COUNTIF(' + g + r + ':' + i3 + r + ',"Hadir"))', '=IF($B' + r + '="","",' + k + r + '*N(' + j + r + '))']);
  }
  sh.getRange(2, CF['Hari hadir'] + 1, baris, 2).setFormulas(fx);
  sh.getRange(2, CF['Hari hadir'] + 1, baris, 2).setBackground('#F1F8E9');
  const rules = [];
  ['Hari 1', 'Hari 2', 'Hari 3'].forEach(function (h) {
    rules.push(kesanTeks_(sh, CF[h] + 1, 'Hadir', '#C8E6C9', '#1B5E20'));
    rules.push(kesanTeks_(sh, CF[h] + 1, 'Tidak hadir', '#FFCDD2', '#B71C1C'));
  });
  rules.push(kesanTeks_(sh, CF['Status elaun'] + 1, 'Dibayar', '#C8E6C9', '#1B5E20'));
  sh.setConditionalFormatRules(rules);
  sh.setFrozenColumns(2);
  if (barisBerikut_(sh) === 2) {
    const cfg = tetapan_(true);
    const peranan = ['Ketua fasilitator', 'Fasilitator hafazan (L)', 'Fasilitator hafazan (P)', 'Fasilitator tasmik', 'Fasilitator logistik'];
    const baru = peranan.map(function (p, i) {
      const r = new Array(H_FAC.length).fill('');
      r[CF['ID']] = PREFIX_ID + '-F-' + ('00' + (i + 1)).slice(-3);
      r[CF['Nama']] = '[Isi nama]';
      r[CF['Peranan']] = p;
      r[CF['Elaun sehari (RM)']] = cfg.ELAUN_FASILITATOR;
      r[CF['Status elaun']] = 'Belum';
      return r;
    });
    const kiri = CF['Hari hadir'];
    sh.getRange(2, 1, baru.length, kiri).setValues(baru.map(function (r) { return r.slice(0, kiri); }));
    sh.getRange(2, CF['Status elaun'] + 1, baru.length, 3).setValues(baru.map(function (r) { return r.slice(CF['Status elaun']); }));
  }
}
function idBerikutFasilitator_(sh) {
  const v = sh.getRange(2, 1, Math.max(sh.getLastRow() - 1, 1), 1).getValues();
  let maks = 0;
  v.forEach(function (r) { const m = String(r[0]).match(/-F-(\d+)$/); if (m) maks = Math.max(maks, parseInt(m[1], 10)); });
  return PREFIX_ID + '-F-' + ('00' + (maks + 1)).slice(-3);
}

/* ---- Checklist & Tugasan ---- */
function binaTugas_(ss, nama, seeds, pjLalai, warna) {
  const sh = pastikanTab_(ss, nama, warna);
  tulisTajuk_(sh, H_TUGAS);
  pastikanBaris_(sh, Math.max(seeds.length + 60, 120));
  const baris = sh.getMaxRows() - 1;
  lebar_(sh, [45, 90, 150, 520, 150, 80, 110, 120, 110, 240]);
  sh.getRange(2, CT['Tarikh akhir'] + 1, baris, 1).setNumberFormat('dd/MM/yyyy');
  sh.getRange(2, CT['Siap pada'] + 1, baris, 1).setNumberFormat('dd/MM/yyyy');
  sh.getRange(2, CT['Tugasan'] + 1, baris, 1).setWrap(true);
  sh.getRange(2, CT['Catatan'] + 1, baris, 1).setWrap(true);
  sh.getRange(2, CT['Status'] + 1, baris, 1).setDataValidation(senaraiVal_(SENARAI_TUGAS, true));
  sh.getRange(2, CT['H± (hari)'] + 1, baris, 1).setHorizontalAlignment('center')
    .setNote('Bilangan hari relatif kepada Hari 1 program. Contoh: -14 = 14 hari sebelum program; 0 = Hari 1; 2 = Hari 3.');
  const cs = CT['Status'] + 1, tA = 'G';
  sh.setConditionalFormatRules([
    kesanTeks_(sh, cs, 'Siap', '#C8E6C9', '#1B5E20'),
    kesanTeks_(sh, cs, 'Sedang dibuat', '#FFF3CD', '#7A5B00'),
    kesanTeks_(sh, cs, 'Tidak berkenaan', '#E0E0E0', '#616161'),
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=AND($' + tA + '2<>"",$' + tA + '2<TODAY(),$H2<>"Siap",$H2<>"Tidak berkenaan",$D2<>"")')
      .setBackground('#FFCDD2').setFontColor('#B71C1C')
      .setRanges([sh.getRange(2, CT['Tarikh akhir'] + 1, baris, 1)]).build()
  ]);
  if (!sh.getFilter()) sh.getRange(1, 1, sh.getMaxRows(), H_TUGAS.length).createFilter();
  const kosong = sh.getRange(2, CT['Tugasan'] + 1, Math.min(baris, 5), 1).getValues().every(function (r) { return !String(r[0]).trim(); });
  if (kosong) isiTugas_(sh, seeds, pjLalai);
}
function isiTugas_(sh, seeds, pjLalai) {
  const n = seeds.length;
  const data = seeds.map(function (s, i) {
    return [i + 1, s[0], s[1], s[2], pjLalai, s[3]];
  });
  sh.getRange(2, 1, n, 6).setValues(data);
  const fx = [], st = [];
  for (let i = 0; i < n; i++) {
    const r = i + 2;
    fx.push(['=IF(F' + r + '="","",TarikhMula+F' + r + ')']);
    st.push(['Belum']);
  }
  sh.getRange(2, CT['Tarikh akhir'] + 1, n, 1).setFormulas(fx);
  sh.getRange(2, CT['Status'] + 1, n, 1).setValues(st);
}
function isi_semulaTugasLalai() {
  const ui = SpreadsheetApp.getUi();
  const j = ui.alert('Isi semula checklist & tugasan',
    'Ini akan MEMADAM kandungan semua 5 tab checklist/tugasan dan menggantikannya dengan senarai lalai.\nStatus dan catatan sedia ada akan hilang. Teruskan?', ui.ButtonSet.YES_NO);
  if (j !== ui.Button.YES) return;
  const ss = ss_();
  [[TAB.SEBELUM, SEED.sebelum, ''], [TAB.SEMASA, SEED.semasa, ''], [TAB.SELEPAS, SEED.selepas, ''],
    [TAB.PENGURUS, SEED.pengurus, 'Pengurus program'], [TAB.PENGARAH, SEED.pengarah, 'Pengarah program']].forEach(function (x) {
    const sh = ss.getSheetByName(x[0]);
    if (!sh) return;
    sh.getRange(2, 1, Math.max(sh.getMaxRows() - 1, 1), H_TUGAS.length).clearContent();
    isiTugas_(sh, x[1], x[2]);
  });
  log_('INFO', 'isi_semulaTugasLalai', 'Checklist diisi semula');
  toast_('Checklist & tugasan lalai telah diisi semula.');
}

/* ---- Semak Sijil ---- */
function binaSijil_(ss) {
  const sh = pastikanTab_(ss, TAB.SIJIL, '#6A4C93');
  tulisTajuk_(sh, H_SIJIL);
  pastikanBaris_(sh, 120);
  lebar_(sh, [110, 190, 80, 70, 90, 220, 90, 100, 120, 130, 260, 80, 90, 220]);
  sh.getRange(2, CS['Tarikh jana'] + 1, sh.getMaxRows() - 1, 1).setNumberFormat('dd/MM/yyyy HH:mm');
  sh.setConditionalFormatRules([
    kesanTeks_(sh, CS['Layak (auto)'] + 1, 'Ya', '#C8E6C9', '#1B5E20'),
    kesanTeks_(sh, CS['Layak (auto)'] + 1, 'Tidak', '#FFCDD2', '#B71C1C')
  ]);
  sh.setFrozenColumns(2);
  sh.getRange(1, CS['Semakan nama'] + 1).setNote('Tandakan selepas nama pada sijil disemak (ejaan, bin/binti).');
  sh.getRange(1, CS['Kelulusan pengarah'] + 1).setNote('Tandakan apabila pengarah program meluluskan sijil.');
}

function binaLog_(ss) {
  const sh = pastikanTab_(ss, TAB.LOG, '#9E9E9E');
  tulisTajuk_(sh, H_LOG);
  lebar_(sh, [150, 80, 170, 460, 420]);
  sh.getRange(2, 1, sh.getMaxRows() - 1, 1).setNumberFormat('dd/MM/yyyy HH:mm:ss');
}

/* ---- Dashboard ---- */
function bina_dashboard() {
  const ss = ss_();
  const sh = pastikanTab_(ss, TAB.DASHBOARD, '#06301F');
  sh.clear();
  sh.setHiddenGridlines(true);
  const jul = function (tab, lajur) { const l = huruf_(CP[lajur] + 1); return tab + '!' + l + '2:' + l; };
  const dua = function (fn) { return '=' + fn(TAB.LELAKI) + '+' + fn(TAB.PEREMPUAN); };
  const cStatus = function (st) { return dua(function (t) { return 'COUNTIF(' + jul(t, 'Status') + ',"' + st + '")'; }); };
  const cHadir = function (h) { return dua(function (t) { return 'COUNTIF(' + jul(t, h) + ',"Hadir")'; }); };
  const tugas = function (t) {
    const st = t + '!H2:H', tg = t + '!D2:D';
    return '=IFERROR(COUNTIF(' + st + ',"Siap")/(COUNTA(' + tg + ')-COUNTIF(' + st + ',"Tidak berkenaan")),0)';
  };
  const lewat = function (t) { return '=COUNTIFS(' + t + '!G2:G,"<"&TODAY(),' + t + '!H2:H,"<>Siap",' + t + '!H2:H,"<>Tidak berkenaan",' + t + '!D2:D,"<>")'; };
  const S = TAB.SIJIL;
  const baris = [
    ['PENDAFTARAN', null],
    ['Kapasiti', '=VLOOKUP("KAPASITI",Tetapan!A:B,2,FALSE)'],
    ['Peserta lelaki (semua status)', '=COUNTA(' + jul(TAB.LELAKI, 'ID') + ')'],
    ['Peserta perempuan (semua status)', '=COUNTA(' + jul(TAB.PEREMPUAN, 'ID') + ')'],
    ['Menunggu pengesahan', cStatus(STATUS.MENUNGGU)],
    ['Disahkan', cStatus(STATUS.SAH)],
    ['Senarai menunggu', cStatus(STATUS.SENARAI)],
    ['Dibatalkan / ditolak', '=' + cStatus(STATUS.BATAL).slice(1) + '+' + cStatus(STATUS.TOLAK).slice(1)],
    ['Slot digunakan (Menunggu + Disahkan)', '=B7+B8'],
    ['Baki slot', '=MAX(0,B4-B11)'],
    ['KEWANGAN', null],
    ['Peserta sudah bayar', dua(function (t) { return 'COUNTIF(' + jul(t, 'Status bayaran') + ',"Dibayar")'; })],
    ['Peserta belum bayar (Menunggu + Disahkan)', dua(function (t) {
      return 'COUNTIFS(' + jul(t, 'Status bayaran') + ',"Belum",' + jul(t, 'Status') + ',"Menunggu")+COUNTIFS(' + jul(t, 'Status bayaran') + ',"Belum",' + jul(t, 'Status') + ',"Disahkan")';
    })],
    ['Kutipan yuran (RM)', dua(function (t) { return 'SUMIFS(' + jul(t, 'Yuran (RM)') + ',' + jul(t, 'Status bayaran') + ',"Dibayar")'; })],
    ['Jumlah elaun fasilitator (RM)', '=SUM(' + TAB.FASILITATOR + '!L2:L)'],
    ['KEHADIRAN (peserta Disahkan sahaja dipaparkan di laman fasilitator)', null],
    ['Hadir Hari 1', cHadir('Hari 1')],
    ['Hadir Hari 2', cHadir('Hari 2')],
    ['Hadir Hari 3', cHadir('Hari 3')],
    ['Fasilitator berdaftar', '=COUNTIF(' + TAB.FASILITATOR + '!B2:B,"?*")'],
    ['KEMAJUAN TUGASAN', null],
    ['Checklist sebelum program (siap)', tugas(TAB.SEBELUM)],
    ['Checklist semasa program (siap)', tugas(TAB.SEMASA)],
    ['Checklist selepas tamat (siap)', tugas(TAB.SELEPAS)],
    ['Tugas pengurus (siap)', tugas(TAB.PENGURUS)],
    ['Tugas pengarah program (siap)', tugas(TAB.PENGARAH)],
    ['Tugasan LEWAT (semua tab)', '=' + [TAB.SEBELUM, TAB.SEMASA, TAB.SELEPAS, TAB.PENGURUS, TAB.PENGARAH].map(function (t) { return lewat(t).slice(1); }).join('+')],
    ['SIJIL', null],
    ['Peserta layak sijil', '=COUNTIF(' + S + '!E2:E,"Ya")'],
    ['Sijil telah dijana', '=COUNTIF(' + S + '!K2:K,"http*")'],
    ['Sijil telah diserahkan', '=COUNTIF(' + S + '!M2:M,TRUE)']
  ];
  sh.getRange('A1').setValue('KSQ 2026 — Dashboard').setFontSize(20).setFontWeight('bold').setFontColor(WARNA.tajuk);
  sh.getRange('A2').setFormula('="Kemas kini: "&TEXT(NOW(),"dd/MM/yyyy HH:mm")&"   |   Program: "&TEXT(TarikhMula,"dd/MM/yyyy")&" – "&TEXT(TarikhMula+2,"dd/MM/yyyy")')
    .setFontColor('#616161');
  sh.getRange('A3:B3').setValues([['Penunjuk', 'Nilai']]).setBackground(WARNA.tajuk).setFontColor(WARNA.tajukTeks).setFontWeight('bold');
  let r = 4;
  const formatPeratus = [], seksyen = [];
  baris.forEach(function (b) {
    if (b[1] === null) {
      sh.getRange(r, 1, 1, 2).setBackground('#E8F5E9').setFontWeight('bold').setFontColor(WARNA.tajuk);
      sh.getRange(r, 1).setValue(b[0]);
      seksyen.push(r);
    } else {
      sh.getRange(r, 1).setValue(b[0]);
      sh.getRange(r, 2).setFormula(b[1]).setHorizontalAlignment('right').setFontWeight('bold');
      if (/\(siap\)/.test(b[0])) formatPeratus.push(r);
    }
    r++;
  });
  formatPeratus.forEach(function (x) { sh.getRange(x, 2).setNumberFormat('0%'); });
  sh.setColumnWidth(1, 430);
  sh.setColumnWidth(2, 130);
  sh.getRange(3, 1, r - 3, 2).setBorder(true, true, true, true, true, true, '#D7D7D7', SpreadsheetApp.BorderStyle.SOLID);
}

/* ============================================================================
 * 5. DATA LALAI CHECKLIST & TUGASAN   [fasa, kategori, tugasan, H±]
 * ========================================================================== */
const SEED = {
  sebelum: [
    ['Sebelum', 'Kelulusan', 'Kertas kerja dibentang dan diluluskan jawatankuasa masjid', -40],
    ['Sebelum', 'Kelulusan', 'Putuskan sumber tambahan bagi kekurangan bajet (sumbangan / tajaan masjid)', -35],
    ['Sebelum', 'Kelulusan', 'Lantik pengarah program, pengurus dan 5 fasilitator', -35],
    ['Sebelum', 'Promosi', 'Poster, QR pendaftaran dan nombor urus setia disebarkan (WhatsApp, media sosial, masjid)', -30],
    ['Sebelum', 'Promosi', 'Semak laman pendaftaran: tarikh, tarikh tutup dan baki slot dipaparkan dengan betul', -30],
    ['Sebelum', 'Pendaftaran', 'Sediakan borang kebenaran ibu bapa dan indemniti', -21],
    ['Sebelum', 'Pendaftaran', 'Pantau pendaftaran dan sahkan bayaran peserta', -14],
    ['Sebelum', 'Pendaftaran', 'Tutup pendaftaran dan muktamadkan senarai peserta (lelaki / perempuan)', -7],
    ['Sebelum', 'Pendaftaran', 'Terima borang kebenaran dan maklumat alahan / kesihatan semua peserta', -5],
    ['Sebelum', 'Pendaftaran', 'Maklumkan ibu bapa: jadual, barang peserta dan waktu pulang Hari 3 (mungkin selepas 5:00 ptg)', -5],
    ['Sebelum', 'Lawatan Shah Alam', 'Surat rasmi permohonan lawatan kumpulan (Yayasan Restu, Muzium, Masjid Negeri)', -30],
    ['Sebelum', 'Lawatan Shah Alam', 'Hubungi Yayasan Restu: muktamad lawatan kumpulan dan bayaran masuk', -28],
    ['Sebelum', 'Lawatan Shah Alam', 'Hubungi Muzium Sultan Alam Shah: lawatan kumpulan, kadar tiket dan waktu operasi pada hari lawatan', -28],
    ['Sebelum', 'Lawatan Shah Alam', 'Kebenaran Masjid Negeri Shah Alam (solat, makan tengah hari, tasmik kemuncak)', -28],
    ['Sebelum', 'Lawatan Shah Alam', 'Tempah bas mini dan pemandu; semak dokumen dan insurans', -21],
    ['Sebelum', 'Lawatan Shah Alam', 'Pelan hujan dan pelan alternatif jika destinasi ditutup', -7],
    ['Sebelum', 'Penceramah & kandungan', 'Sahkan Ust Shahril (Slot Akhlak, Hari 1) dan Khairul Anuar (Slot Kepimpinan Remaja, Hari 2)', -28],
    ['Sebelum', 'Penceramah & kandungan', 'Muktamadkan pembahagian surah, kumpulan tasmik dan jadual hafazan bersama ustaz', -10],
    ['Sebelum', 'Penceramah & kandungan', 'Cetak modul program peserta', -7],
    ['Sebelum', 'Penceramah & kandungan', 'Sediakan tag peserta dan fasilitator', -7],
    ['Sebelum', 'Penceramah & kandungan', 'Semak waktu solat rasmi JAKIM / JAIS untuk tarikh program dan laraskan jadual', -7],
    ['Sebelum', 'Logistik', 'Tempah katering: minum pagi, makan tengah hari dan minum petang (peserta + fasilitator)', -14],
    ['Sebelum', 'Logistik', 'Semak kemudahan masjid: PA sistem, ruang lelaki / perempuan, tandas, kipas, surau', -5],
    ['Sebelum', 'Logistik', 'Sediakan peti kecemasan dan nombor kecemasan urus setia', -5],
    ['Sebelum', 'Logistik', 'Sediakan alat tulis, air minuman dan keperluan tasmik', -5],
    ['Sebelum', 'Fasilitator', 'Taklimat fasilitator: peranan, nisbah penjagaan dan protokol keselamatan peserta', -3],
    ['Sebelum', 'Fasilitator', 'Sediakan tunai pendahuluan dan elaun fasilitator', -2],
    ['Sebelum', 'Sijil', 'Bina templat sijil dan isi nama pengerusi / pengarah dalam tab Tetapan', -14]
  ],
  semasa: [
    ['Hari 1', 'Persediaan', 'Buka masjid, sediakan ruang, PA sistem dan meja pendaftaran (7:30 pg)', 0],
    ['Hari 1', 'Pendaftaran', 'Pendaftaran peserta, semak borang kebenaran, agih tag dan modul (8:00 pg)', 0],
    ['Hari 1', 'Pendaftaran', 'Rekod kehadiran Hari 1 melalui laman fasilitator', 0],
    ['Hari 1', 'Program', 'Perasmian, taklimat program, doa dan ta’aruf', 0],
    ['Hari 1', 'Program', 'Teknik Hafazan Pantas sesi 1 dan 2 (mula Surah Al-Mulk)', 0],
    ['Hari 1', 'Logistik', 'Minum pagi, makan tengah hari dan minum petang disediakan', 0],
    ['Hari 1', 'Program', 'Slot Motivasi: Adab dan Akhlak (Ust Shahril)', 0],
    ['Hari 1', 'Program', 'Muraja’ah dan tasmik kumpulan kecil', 0],
    ['Hari 1', 'Keselamatan', 'Semak maklumat alahan / kesihatan dengan fasilitator; catat sebarang kejadian', 0],
    ['Hari 1', 'Penutup', 'Solat Asar, refleksi Hari 1, doa dan bersurai; peserta dijemput ibu bapa', 0],
    ['Hari 2', 'Pendaftaran', 'Rekod kehadiran Hari 2', 1],
    ['Hari 2', 'Program', 'Muraja’ah Surah Al-Mulk dan Teknik Hafazan Pantas sesi 3 (Surah As-Sajdah)', 1],
    ['Hari 2', 'Program', 'Hafazan Surah Al-Insan dan permulaan Surah Al-Kahfi (mengikut kemampuan)', 1],
    ['Hari 2', 'Logistik', 'Makan minum tepat masa dan kebersihan ruang', 1],
    ['Hari 2', 'Program', 'Slot Kepimpinan Remaja (Khairul Anuar)', 1],
    ['Hari 2', 'Program', 'Tasmik percubaan dan muraja’ah untuk persediaan kemuncak', 1],
    ['Hari 2', 'Sijil', 'Segerak Semak Sijil, semak nama dan jana sijil untuk penyampaian Hari 3 (menu KSQ 2026)', 1],
    ['Hari 2', 'Penutup', 'Taklimat Hari 3: pakaian, bekalan, peraturan bas; ingatkan kebenaran lawatan', 1],
    ['Hari 3', 'Pengangkutan', 'Berkumpul di masjid 7:30 pg; kira kepala dan rekod kehadiran Hari 3', 2],
    ['Hari 3', 'Pengangkutan', 'Doa permusafiran dan bertolak 8:00 pg; zikir dan muraja’ah dalam bas', 2],
    ['Hari 3', 'Lawatan', 'Yayasan Restu: lawatan galeri dan penerangan', 2],
    ['Hari 3', 'Lawatan', 'Muzium Sultan Alam Shah: lawatan galeri (bayar tiket jika perlu)', 2],
    ['Hari 3', 'Lawatan', 'Masjid Negeri Shah Alam: solat Zohor berjemaah dan makan tengah hari', 2],
    ['Hari 3', 'Program', 'Tasmik kemuncak di sekitar tasik dan Masjid Negeri', 2],
    ['Hari 3', 'Penutup', 'Refleksi, penyampaian sijil dan doa penutup', 2],
    ['Hari 3', 'Pengangkutan', 'Kira kepala sebelum pulang; tiba di masjid dan peserta dijemput ibu bapa (~5:30 ptg)', 2]
  ],
  selepas: [
    ['Selepas', 'Logistik', 'Pulangkan peralatan dan pastikan masjid bersih / kembali seperti asal', 3],
    ['Selepas', 'Sijil', 'Segerak kehadiran akhir dan semak senarai layak sijil', 3],
    ['Selepas', 'Sijil', 'Jana sijil untuk peserta yang belum menerima (menu KSQ 2026 -> Jana sijil)', 4],
    ['Selepas', 'Sijil', 'Cetak dan serahkan sijil yang tertinggal kepada peserta / ibu bapa', 7],
    ['Selepas', 'Kewangan', 'Semak kutipan yuran berbanding senarai peserta; lunaskan baki tertunggak', 5],
    ['Selepas', 'Kewangan', 'Bayar elaun fasilitator, bas, katering, penceramah dan tiket muzium', 5],
    ['Selepas', 'Kewangan', 'Sediakan penyata kewangan akhir (pendapatan berbanding perbelanjaan)', 9],
    ['Selepas', 'Penghargaan', 'Surat / mesej terima kasih kepada penceramah, Yayasan Restu, Muzium dan Masjid Negeri', 5],
    ['Selepas', 'Penghargaan', 'Ucapan terima kasih kepada fasilitator dan ibu bapa', 5],
    ['Selepas', 'Penilaian', 'Edar borang maklum balas ibu bapa dan peserta', 5],
    ['Selepas', 'Penilaian', 'Mesyuarat post-mortem jawatankuasa: kekuatan, kelemahan dan cadangan KSQ 2027', 12],
    ['Selepas', 'Laporan', 'Siapkan laporan program lengkap bergambar dan hantar kepada jawatankuasa masjid', 16],
    ['Selepas', 'Laporan', 'Arkib dokumen: borang kebenaran, kehadiran, resit dan sandaran spreadsheet', 16],
    ['Selepas', 'Data', 'Lindungi / padam data peribadi peserta mengikut dasar masjid (PDPA) selepas tempoh simpanan', 33]
  ],
  pengurus: [
    ['Sebelum', 'Pentadbiran', 'Sediakan jadual kerja induk dan agihan tugas jawatankuasa', -40],
    ['Sebelum', 'Pendaftaran', 'Semak pendaftaran harian, hubungi penjaga, sahkan bayaran dan kemas kini Status / Status bayaran', -30],
    ['Sebelum', 'Kewangan', 'Sediakan bajet, urus kutipan dan simpan semua resit', -35],
    ['Sebelum', 'Kewangan', 'Semak bajet: tiket muzium, makan tengah hari Hari 3 dan kekurangan yuran', -21],
    ['Sebelum', 'Logistik', 'Tempah katering, bas, percetakan modul dan tag; simpan sebut harga / resit', -21],
    ['Sebelum', 'Pentadbiran', 'Simpan token fasilitator / admin dalam Script Properties; edarkan token fasilitator kepada fasilitator sahaja', -14],
    ['Sebelum', 'Pendaftaran', 'Urus senarai menunggu dan peserta yang membatalkan', -14],
    ['Sebelum', 'Komunikasi', 'Wujudkan kumpulan WhatsApp ibu bapa; hantar jadual, peringatan dan maklumat Hari 3', -7],
    ['Sebelum', 'Logistik', 'Sediakan lokasi: susun atur ruang lelaki / perempuan dan kawasan pendaftaran', -3],
    ['Semasa', 'Operasi', 'Pastikan jadual dipatuhi, makan minum tepat masa dan fasilitator berada di pos masing-masing', 0],
    ['Semasa', 'Operasi', 'Urus kecemasan dan kejadian: catat, maklumkan penjaga dan hubungi pengarah', 0],
    ['Semasa', 'Kewangan', 'Bayar tunai kecil (air, minuman, tiket muzium) dan simpan resit', 2],
    ['Semasa', 'Komunikasi', 'Hantar kemas kini dan makluman pulang Hari 3 kepada ibu bapa', 2],
    ['Selepas', 'Kewangan', 'Kemas kini rekod bayaran dan lunaskan semua bayaran pembekal', 5],
    ['Selepas', 'Kewangan', 'Sediakan penyata kewangan akhir untuk pengarah dan jawatankuasa', 9],
    ['Selepas', 'Sijil', 'Semak data kehadiran dan sijil bersama pengarah; serahkan sijil yang belum diambil', 5],
    ['Selepas', 'Pentadbiran', 'Simpan sandaran spreadsheet dan fail borang; luput token fasilitator', 9]
  ],
  pengarah: [
    ['Sebelum', 'Kepimpinan', 'Tetapkan objektif, KPI dan struktur jawatankuasa; bentang kertas kerja kepada masjid', -40],
    ['Sebelum', 'Kepimpinan', 'Lantik pengurus dan fasilitator; jelaskan peranan serta etika / keselamatan kanak-kanak', -35],
    ['Sebelum', 'Kewangan', 'Lulus bajet dan putuskan sumber tambahan bagi kekurangan', -30],
    ['Sebelum', 'Hubungan luar', 'Lulus surat rasmi dan hubungan dengan Yayasan Restu, Muzium dan Masjid Negeri', -28],
    ['Sebelum', 'Kandungan', 'Sahkan penceramah dan kandungan slot akhlak / kepimpinan', -28],
    ['Sebelum', 'Kandungan', 'Lulus modul program, pembahagian surah dan jadual harian bersama ustaz', -21],
    ['Sebelum', 'Sijil', 'Tetapkan kriteria layak sijil (minimum kehadiran) dan lulus templat sijil', -14],
    ['Sebelum', 'Risiko', 'Lulus pelan keselamatan: nisbah fasilitator, kecemasan, hujan, bas dan indemniti', -10],
    ['Semasa', 'Pemantauan', 'Pantau kualiti hafazan dan tasmik setiap hari; ambil tindakan jika peserta ketinggalan', 0],
    ['Semasa', 'Pemantauan', 'Mesyuarat ringkas fasilitator selepas Hari 1 dan Hari 2', 1],
    ['Semasa', 'Kepimpinan', 'Wakili masjid semasa perasmian dan penutup; sampaikan sijil', 2],
    ['Selepas', 'Sijil', 'Semak dan lulus senarai sijil (tab Semak_Sijil: tandakan Kelulusan pengarah) dan tandatangan sijil', 3],
    ['Selepas', 'Penilaian', 'Pimpin penilaian program berdasarkan maklum balas dan data kehadiran', 12],
    ['Selepas', 'Laporan', 'Luluskan laporan program dan penyata kewangan; bentang kepada jawatankuasa masjid', 23],
    ['Selepas', 'Strategi', 'Putuskan penambahbaikan dan perancangan KSQ 2027', 33]
  ]
};

/* ============================================================================
 * 6. AKSES DATA PESERTA
 * ========================================================================== */
function barisBerikut_(sh, lajur) {
  lajur = lajur || 1;
  const v = sh.getRange(1, lajur, sh.getMaxRows(), 1).getValues();
  for (let i = v.length - 1; i >= 1; i--) { if (String(v[i][0]).trim() !== '') return i + 2; }
  return 2;
}

/** Senarai semua peserta kedua-dua tab: [{tab, sh, r, v}] */
function senaraiPeserta_() {
  const hasil = [];
  [TAB.LELAKI, TAB.PEREMPUAN].forEach(function (tab) {
    const sh = sheet_(tab);
    const akhir = sh.getLastRow();
    if (akhir < 2) return;
    sh.getRange(2, 1, akhir - 1, H_PESERTA.length).getValues().forEach(function (v, i) {
      if (String(v[CP['ID']]).trim() !== '') hasil.push({ tab: tab, sh: sh, r: i + 2, v: v });
    });
  });
  return hasil;
}
function cariPeserta_(id) {
  const semua = senaraiPeserta_();
  for (let i = 0; i < semua.length; i++) { if (semua[i].v[CP['ID']] === id) return semua[i]; }
  return null;
}
function objPeserta_(v, kunci) {
  const o = {};
  Object.keys(KUNCI_API).forEach(function (k) {
    const nilai = v[CP[KUNCI_API[k]]];
    o[k] = (nilai instanceof Date) ? iso_(nilai) : nilai;
  });
  ['hari1', 'hari2', 'hari3'].forEach(function (k) { o[k] = o[k] === 'Hadir' ? 'hadir' : (o[k] === 'Tidak hadir' ? 'tidak' : ''); });
  if (!kunci) return o;
  const p = {};
  kunci.forEach(function (k) { p[k] = o[k]; });
  return p;
}
function kiraSlot_(cfg, senarai) {
  senarai = senarai || senaraiPeserta_();
  let guna = 0;
  senarai.forEach(function (p) { if (cfg.SLOT_STATUS.indexOf(p.v[CP['Status']]) >= 0) guna++; });
  return { guna: guna, baki: Math.max(0, cfg.KAPASITI - guna) };
}
function statusDaftar_(cfg, senarai) {
  const kira = kiraSlot_(cfg, senarai);
  let dibuka = true, sebab = '', mesej = 'Pendaftaran dibuka.';
  if (!cfg.PENDAFTARAN_DIBUKA) { dibuka = false; sebab = 'MANUAL'; mesej = 'Pendaftaran ditutup buat sementara waktu oleh urus setia.'; }
  else if (cfg.TUTUP_DAFTAR && new Date() > cfg.TUTUP_DAFTAR) { dibuka = false; sebab = 'TARIKH'; mesej = 'Pendaftaran telah ditutup.'; }
  else if (kira.baki <= 0) {
    sebab = 'PENUH';
    if (cfg.SENARAI_MENUNGGU) mesej = 'Slot penuh. Pendaftaran baharu dimasukkan ke senarai menunggu.';
    else { dibuka = false; mesej = 'Maaf, semua slot telah penuh.'; }
  }
  return { dibuka: dibuka, sebab: sebab, mesej: mesej, didaftar: kira.guna, baki: kira.baki };
}
function idBerikut_(tab) {
  const awalan = tab === TAB.LELAKI ? 'L' : 'P';
  const props = PropertiesService.getScriptProperties();
  const kunci = 'SEQ_' + awalan;
  const sh = sheet_(tab);
  const v = sh.getRange(2, 1, Math.max(sh.getLastRow() - 1, 1), 1).getValues();
  let maks = 0;
  v.forEach(function (r) { const m = String(r[0]).match(/-(\d+)$/); if (m) maks = Math.max(maks, parseInt(m[1], 10)); });
  const seq = Math.max(maks, parseInt(props.getProperty(kunci) || '0', 10)) + 1;
  props.setProperty(kunci, String(seq));
  return PREFIX_ID + '-' + awalan + '-' + ('000' + seq).slice(-3);
}
function kemasBaris_(p, perubahan) {
  Object.keys(perubahan).forEach(function (tajuk) { p.sh.getRange(p.r, CP[tajuk] + 1).setValue(perubahan[tajuk]); });
  p.sh.getRange(p.r, CP['Dikemas kini'] + 1).setValue(new Date());
}
function ringkasanHadir_(senarai) {
  senarai = senarai || senaraiPeserta_();
  const r = { jumlah: 0, hari1: 0, hari2: 0, hari3: 0 };
  senarai.forEach(function (p) {
    if (p.v[CP['Status']] !== STATUS.SAH) return;
    r.jumlah++;
    [1, 2, 3].forEach(function (h) { if (p.v[CP['Hari ' + h]] === 'Hadir') r['hari' + h]++; });
  });
  return r;
}

/* ============================================================================
 * 7. PENDAFTARAN
 * ========================================================================== */
function sahkanBorang_(r, cfg) {
  const ralat = {}, f = {};
  f.nama_peserta = bersih_(r.nama_peserta, 80);
  if (!/^[\p{L}\p{M}'’.\-\/@ ]{3,80}$/u.test(f.nama_peserta)) ralat.nama_peserta = 'Sila masukkan nama penuh peserta (3–80 huruf).';
  const umur = parseInt(r.umur, 10);
  if (isNaN(umur) || umur < cfg.UMUR_MIN || umur > cfg.UMUR_MAX) ralat.umur = 'Umur mesti antara ' + cfg.UMUR_MIN + ' dan ' + cfg.UMUR_MAX + ' tahun.';
  f.umur = umur;
  f.jantina = String(r.jantina || '').trim();
  if (f.jantina !== 'Lelaki' && f.jantina !== 'Perempuan') ralat.jantina = 'Sila pilih jantina.';
  const tel = normTel_(r.tel_penjaga);
  if (!tel.ok) ralat.tel_penjaga = 'Nombor telefon tidak sah. Contoh: 012-3456789.';
  f.tel_penjaga = tel.ok ? tel.papar : '';
  f.tel_digit = tel.ok ? tel.digit : '';
  f.nama_penjaga = bersih_(r.nama_penjaga, 80);
  if (!/^[\p{L}\p{M}'’.\-\/@ ]{3,80}$/u.test(f.nama_penjaga)) ralat.nama_penjaga = 'Sila masukkan nama penjaga.';
  const lq = String(r.lancar_quran || '').toLowerCase();
  if (lq !== 'ya' && lq !== 'tidak') ralat.lancar_quran = 'Sila pilih Ya atau Tidak.';
  f.lancar_quran = lq === 'ya' ? 'Ya' : 'Tidak';
  f.alahan_kesihatan = bersih_(r.alahan_kesihatan, 300) || 'Tiada';
  const setuju = r.persetujuan_data === true || ['true', 'on', '1', 'ya', 'yes'].indexOf(String(r.persetujuan_data).toLowerCase()) >= 0;
  if (!setuju) ralat.persetujuan_data = 'Persetujuan penggunaan data diperlukan.';
  if (Object.keys(ralat).length) throw new RalatApi('Sila semak maklumat yang ditandakan.', 'VALIDASI', ralat);
  return f;
}

/**
 * Teras pendaftaran (dipanggil oleh laman awam & admin). Dalam kunci supaya
 * kiraan slot dan ID tidak berlanggar apabila ramai mendaftar serentak.
 */
function daftarPeserta_(f, opsyen) {
  opsyen = opsyen || {};
  const cfg = tetapan_(true);
  const kunci = ambilKunci_();
  try {
    const semua = senaraiPeserta_();
    const st = statusDaftar_(cfg, semua);
    if (!opsyen.abaikanTutup && !st.dibuka) throw new RalatApi(st.mesej, 'TUTUP');
    const kn = kunciNama_(f.nama_peserta);
    semua.forEach(function (p) {
      const batal = [STATUS.BATAL, STATUS.TOLAK].indexOf(p.v[CP['Status']]) >= 0;
      if (batal) return;
      const telSama = String(p.v[CP['Tel penjaga']]).replace(/\D/g, '') === f.tel_digit;
      if (telSama && kunciNama_(p.v[CP['Nama peserta']]) === kn) {
        throw new RalatApi('Peserta ini telah didaftarkan. Hubungi urus setia jika perlu bantuan.', 'DUPLIKAT');
      }
    });
    let status = opsyen.status || STATUS.MENUNGGU;
    if (cfg.SLOT_STATUS.indexOf(status) >= 0 && st.baki <= 0 && !opsyen.abaikanKapasiti) {
      if (cfg.SENARAI_MENUNGGU) status = STATUS.SENARAI;
      else throw new RalatApi('Maaf, semua ' + cfg.KAPASITI + ' slot telah penuh.', 'PENUH');
    }
    const tab = f.jantina === 'Lelaki' ? TAB.LELAKI : TAB.PEREMPUAN;
    const sh = sheet_(tab);
    const id = idBerikut_(tab);
    const kaedah = opsyen.kaedah || 'Online';
    const yuran = opsyen.yuran != null ? opsyen.yuran : (kaedah === 'Online' ? cfg.YURAN_ONLINE : cfg.YURAN_PROMO);
    const catatan = [];
    if (f.lancar_quran === 'Tidak') catatan.push('PERLU SEMAKAN: peserta tidak lancar membaca Al-Quran.');
    if (opsyen.catatan) catatan.push(opsyen.catatan);
    const kini = new Date();
    const baris = new Array(H_PESERTA.length).fill('');
    baris[CP['ID']] = id;
    baris[CP['Tarikh daftar']] = kini;
    baris[CP['Nama peserta']] = f.nama_peserta;
    baris[CP['Umur']] = f.umur;
    baris[CP['Jantina']] = f.jantina;
    baris[CP['Nama penjaga']] = f.nama_penjaga;
    baris[CP['Tel penjaga']] = f.tel_penjaga;
    baris[CP['Lancar Quran']] = f.lancar_quran;
    baris[CP['Alahan / kesihatan']] = f.alahan_kesihatan;
    baris[CP['Persetujuan data']] = 'Ya ' + Utilities.formatDate(kini, TZ, 'dd/MM/yyyy HH:mm');
    baris[CP['Status']] = status;
    baris[CP['Kaedah daftar']] = kaedah;
    baris[CP['Yuran (RM)']] = yuran;
    baris[CP['Status bayaran']] = opsyen.status_bayaran || 'Belum';
    baris[CP['Tarikh bayar']] = opsyen.tarikh_bayar || '';
    baris[CP['Rujukan bayaran']] = opsyen.rujukan || '';
    baris[CP['Catatan']] = catatan.join(' ');
    baris[CP['Dikemas kini']] = kini;
    const r = barisBerikut_(sh);
    pastikanBaris_(sh, r + 20);
    sh.getRange(r, 1, 1, H_PESERTA.length).setNumberFormats([FMT_PESERTA]);
    sh.getRange(r, 1, 1, H_PESERTA.length).setValues([baris]);
    CacheService.getScriptCache().remove('stats');
    log_('INFO', 'daftarPeserta_', 'Pendaftaran baharu ' + id, { status: status, kaedah: kaedah });
    return { id: id, status: status, yuran: yuran, nama_peserta: f.nama_peserta, jantina: f.jantina, tab: tab };
  } finally {
    kunci.releaseLock();
  }
}

function apiRegister_(r) {
  if (String(r.website || '').trim() !== '') { // honeypot: pura-pura berjaya
    log_('AMARAN', 'apiRegister_', 'Honeypot terpicu');
    return { id: '', status: STATUS.MENUNGGU, yuran: 0, mesej: 'Pendaftaran diterima.' };
  }
  const cfg = tetapan_(true);
  const f = sahkanBorang_(r, cfg);
  const h = daftarPeserta_(f, { kaedah: 'Online' });
  hantarEmelAdmin_(cfg, h, f);
  return {
    id: h.id, status: h.status, yuran: h.yuran,
    mesej: h.status === STATUS.SENARAI
      ? 'Pendaftaran diterima dalam senarai menunggu. Urus setia akan menghubungi penjaga jika ada slot kosong.'
      : 'Pendaftaran diterima. Urus setia akan menghubungi penjaga untuk pengesahan bayaran (RM' + h.yuran + ').'
  };
}
function hantarEmelAdmin_(cfg, h, f) {
  try {
    if (!cfg.EMAIL_ADMIN) return;
    MailApp.sendEmail(cfg.EMAIL_ADMIN, '[KSQ 2026] Pendaftaran baharu ' + h.id,
      'Peserta: ' + f.nama_peserta + ' (' + f.umur + ' tahun, ' + f.jantina + ')\n' +
      'Penjaga: ' + f.nama_penjaga + ' (' + f.tel_penjaga + ')\n' +
      'Status: ' + h.status + '   Yuran: RM' + h.yuran + '\n' +
      'Lancar Quran: ' + f.lancar_quran + '\nAlahan / kesihatan: ' + f.alahan_kesihatan + '\n\n' +
      'Buka tab ' + h.tab + ' untuk mengesahkan bayaran.');
  } catch (e) { log_('RALAT', 'hantarEmelAdmin_', e.message); }
}

/* ============================================================================
 * 8. API WEB APP
 * ========================================================================== */
const AKSI_POST = { register: 1, fac_mark: 1, admin_update: 1, admin_add: 1 };

function doGet(e) { return urus_(e, 'GET'); }
function doPost(e) { return urus_(e, 'POST'); }

function parseReq_(e) {
  const r = {};
  const p = (e && e.parameter) || {};
  Object.keys(p).forEach(function (k) { if (k !== '__proto__') r[k] = p[k]; });
  if (e && e.postData && e.postData.contents) {
    if (e.postData.contents.length > 20000) throw new RalatApi('Permintaan terlalu besar.', 'SAIZ');
    try {
      const j = JSON.parse(e.postData.contents);
      if (j && typeof j === 'object') Object.keys(j).forEach(function (k) { if (k !== '__proto__') r[k] = j[k]; });
    } catch (err) { /* mungkin form-urlencoded: e.parameter sudah memadai */ }
  }
  return r;
}

function keluar_(obj, callback) {
  const teks = JSON.stringify(obj);
  if (callback && /^[A-Za-z_$][\w$.]{0,60}$/.test(callback)) {
    return ContentService.createTextOutput(callback + '(' + teks + ');').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(teks).setMimeType(ContentService.MimeType.JSON);
}

function urus_(e, kaedah) {
  let req = {};
  try {
    req = parseReq_(e);
    const aksi = String(req.action || 'ping').trim();
    if (AKSI_POST[aksi] && kaedah !== 'POST') throw new RalatApi('Aksi ini memerlukan POST.', 'KAEDAH');
    let data;
    switch (aksi) {
      case 'ping': data = { nama: 'KSQ 2026 API', versi: VERSI, masa: iso_(new Date()) }; break;
      case 'stats': data = apiStats_(); break;
      case 'register': data = apiRegister_(req); break;
      case 'fac_login': data = { peranan: sahkanToken_(req, 'fasilitator') }; break;
      case 'fac_list': sahkanToken_(req, 'fasilitator'); data = apiFacList_(); break;
      case 'fac_mark': data = apiFacMark_(req, sahkanToken_(req, 'fasilitator')); break;
      case 'admin_login': data = { peranan: sahkanToken_(req, 'admin') }; break;
      case 'admin_list': sahkanToken_(req, 'admin'); data = apiAdminList_(); break;
      case 'admin_stats': sahkanToken_(req, 'admin'); data = apiAdminStats_(); break;
      case 'admin_update': sahkanToken_(req, 'admin'); data = apiAdminUpdate_(req); break;
      case 'admin_add': sahkanToken_(req, 'admin'); data = apiAdminAdd_(req); break;
      default: throw new RalatApi('Aksi tidak dikenali.', 'AKSI');
    }
    return keluar_({ ok: true, data: data }, aksi === 'stats' ? req.callback : null);
  } catch (err) {
    if (err instanceof RalatApi) {
      if (['AUTH', 'KUNCI', 'VALIDASI', 'DUPLIKAT', 'TUTUP', 'PENUH'].indexOf(err.kod) < 0) log_('AMARAN', 'urus_', err.message, { kod: err.kod });
      const o = { ok: false, error: err.message, code: err.kod };
      if (err.fields) o.fields = err.fields;
      return keluar_(o, null);
    }
    log_('RALAT', 'urus_', err && err.message, { aksi: req.action, stack: String(err && err.stack).slice(0, 300) });
    return keluar_({ ok: false, error: 'Ralat sistem. Sila cuba lagi atau hubungi urus setia.', code: 'SISTEM' }, null);
  }
}

function sahkanToken_(req, peranan) {
  const cache = CacheService.getScriptCache();
  if (cache.get('kunci_auth')) throw new RalatApi('Terlalu banyak percubaan gagal. Cuba lagi dalam 10 minit.', 'KUNCI');
  const props = PropertiesService.getScriptProperties();
  const t = String(req.token || '');
  let role = null;
  if (samaSelamat_(t, props.getProperty('ADMIN_TOKEN'))) role = 'admin';
  else if (peranan === 'fasilitator' && samaSelamat_(t, props.getProperty('FASILITATOR_TOKEN'))) role = 'fasilitator';
  if (!role) {
    const n = (parseInt(cache.get('gagal_auth'), 10) || 0) + 1;
    cache.put('gagal_auth', String(n), 600);
    if (n >= 10) cache.put('kunci_auth', '1', 600);
    log_('AMARAN', 'sahkanToken_', 'Token tidak sah', { peranan: peranan, percubaan: n });
    throw new RalatApi('Token tidak diterima.', 'AUTH');
  }
  cache.remove('gagal_auth');
  return role;
}

/** AWAM: statistik pendaftaran (cache 30 saat) */
function apiStats_() {
  const cache = CacheService.getScriptCache();
  const c = cache.get('stats');
  if (c) return JSON.parse(c);
  const cfg = tetapan_();
  const s = statusDaftar_(cfg);
  const d = {
    program: cfg.TAJUK_PROGRAM, kapasiti: cfg.KAPASITI, didaftar: s.didaftar, baki: s.baki,
    dibuka: s.dibuka, sebab: s.sebab, mesej: s.mesej, penuh: s.baki <= 0,
    tutup: iso_(cfg.TUTUP_DAFTAR), mula: iso_(cfg.TARIKH_MULA), tamat: iso_(cfg.TARIKH_TAMAT),
    yuran: { asal: cfg.YURAN_ASAL, promo: cfg.YURAN_PROMO, online: cfg.YURAN_ONLINE },
    dikemas_kini: iso_(new Date())
  };
  cache.put('stats', JSON.stringify(d), 30);
  return d;
}

/** FASILITATOR: senarai peserta Disahkan (tiada maklumat bayaran) */
function apiFacList_() {
  const semua = senaraiPeserta_();
  const senarai = semua.filter(function (p) { return p.v[CP['Status']] === STATUS.SAH; })
    .map(function (p) { return objPeserta_(p.v, KUNCI_FAC); })
    .sort(function (a, b) { return String(a.nama_peserta).localeCompare(String(b.nama_peserta), 'ms'); });
  return { peserta: senarai, ringkasan: ringkasanHadir_(semua), dikemas_kini: iso_(new Date()) };
}
function apiFacMark_(r, peranan) {
  const hari = parseInt(r.hari, 10);
  if ([1, 2, 3].indexOf(hari) < 0) throw new RalatApi('Hari tidak sah.', 'VALIDASI');
  const peta = { hadir: 'Hadir', tidak: 'Tidak hadir', '': '' };
  const st = String(r.status == null ? '' : r.status).toLowerCase();
  if (!Object.prototype.hasOwnProperty.call(peta, st)) throw new RalatApi('Status kehadiran tidak sah.', 'VALIDASI');
  const kunci = ambilKunci_();
  try {
    const p = cariPeserta_(String(r.id || '').trim());
    if (!p) throw new RalatApi('Peserta tidak ditemui.', 'TIADA');
    if (p.v[CP['Status']] !== STATUS.SAH) throw new RalatApi('Hanya peserta Disahkan boleh ditandakan.', 'STATUS');
    kemasBaris_(p, (function () { const o = {}; o['Hari ' + hari] = peta[st]; return o; })());
    p.v[CP['Hari ' + hari]] = peta[st];
    log_('INFO', 'apiFacMark_', p.v[CP['ID']] + ' Hari ' + hari + ' = ' + (peta[st] || '(kosong)'), { oleh: peranan });
    return { id: p.v[CP['ID']], hari: hari, status: st, ringkasan: ringkasanHadir_() };
  } finally { kunci.releaseLock(); }
}

/** ADMIN */
function apiAdminList_() {
  const semua = senaraiPeserta_();
  return {
    peserta: semua.map(function (p) { return objPeserta_(p.v); }),
    ringkasan: ringkasanHadir_(semua), dikemas_kini: iso_(new Date())
  };
}
function apiAdminStats_() {
  const cfg = tetapan_(true);
  const semua = senaraiPeserta_();
  const o = { status: {}, jantina: { Lelaki: 0, Perempuan: 0 }, bayaran: { dibayar: 0, belum: 0, kutipan: 0 }, kehadiran: ringkasanHadir_(semua) };
  SENARAI_STATUS.forEach(function (s) { o.status[s] = 0; });
  semua.forEach(function (p) {
    o.status[p.v[CP['Status']]] = (o.status[p.v[CP['Status']]] || 0) + 1;
    o.jantina[p.v[CP['Jantina']]] = (o.jantina[p.v[CP['Jantina']]] || 0) + 1;
    if (p.v[CP['Status bayaran']] === 'Dibayar') { o.bayaran.dibayar++; o.bayaran.kutipan += num_(p.v[CP['Yuran (RM)']], 0); }
    else if (p.v[CP['Status']] === STATUS.MENUNGGU || p.v[CP['Status']] === STATUS.SAH) o.bayaran.belum++;
  });
  o.slot = statusDaftar_(cfg, semua);
  return o;
}
function nilaiAdmin_(k, v) {
  const cfg = tetapan_();
  switch (k) {
    case 'nama_peserta': case 'nama_penjaga': {
      const s = bersih_(v, 80);
      if (s.length < 3) throw new RalatApi('Nilai ' + k + ' tidak sah.', 'VALIDASI');
      return s;
    }
    case 'umur': {
      const n = parseInt(v, 10);
      if (isNaN(n) || n < 5 || n > 30) throw new RalatApi('Umur tidak sah.', 'VALIDASI');
      return n;
    }
    case 'tel_penjaga': {
      const t = normTel_(v);
      if (!t.ok) throw new RalatApi('Nombor telefon tidak sah.', 'VALIDASI');
      return t.papar;
    }
    case 'status': if (SENARAI_STATUS.indexOf(v) < 0) throw new RalatApi('Status tidak sah.', 'VALIDASI'); return v;
    case 'kaedah_daftar': if (SENARAI_KAEDAH.indexOf(v) < 0) throw new RalatApi('Kaedah tidak sah.', 'VALIDASI'); return v;
    case 'status_bayaran': if (SENARAI_BAYAR.indexOf(v) < 0) throw new RalatApi('Status bayaran tidak sah.', 'VALIDASI'); return v;
    case 'yuran': { const n = Number(v); if (isNaN(n) || n < 0 || n > 10000) throw new RalatApi('Yuran tidak sah.', 'VALIDASI'); return n; }
    case 'tarikh_bayar': { if (v === '' || v == null) return ''; const d = tarikh_(v); if (!d) throw new RalatApi('Tarikh bayar tidak sah.', 'VALIDASI'); return d; }
    case 'hari1': case 'hari2': case 'hari3': {
      const peta = { hadir: 'Hadir', tidak: 'Tidak hadir', '': '' };
      const s = String(v == null ? '' : v).toLowerCase();
      if (!Object.prototype.hasOwnProperty.call(peta, s)) throw new RalatApi('Kehadiran tidak sah.', 'VALIDASI');
      return peta[s];
    }
    case 'alahan_kesihatan': return bersih_(v, 300) || 'Tiada';
    case 'rujukan_bayaran': return bersih_(v, 60);
    case 'kumpulan': return bersih_(v, 40);
    case 'catatan': return bersih_(v, 500);
    default: throw new RalatApi('Medan tidak dibenarkan: ' + k, 'VALIDASI');
  }
}
function apiAdminUpdate_(r) {
  const set = r.set || {};
  const kunci = ambilKunci_();
  try {
    const cfg = tetapan_(true);
    const semua = senaraiPeserta_();
    let p = null;
    semua.forEach(function (x) { if (x.v[CP['ID']] === String(r.id || '').trim()) p = x; });
    if (!p) throw new RalatApi('Peserta tidak ditemui.', 'TIADA');
    const perubahan = {};
    Object.keys(set).forEach(function (k) {
      if (BOLEH_KEMAS.indexOf(k) < 0) throw new RalatApi('Medan tidak dibenarkan: ' + k, 'VALIDASI');
      perubahan[KUNCI_API[k]] = nilaiAdmin_(k, set[k]);
    });
    const baru = perubahan['Status'];
    if (baru && cfg.SLOT_STATUS.indexOf(baru) >= 0 && cfg.SLOT_STATUS.indexOf(p.v[CP['Status']]) < 0) {
      if (statusDaftar_(cfg, semua).baki <= 0) throw new RalatApi('Tiada slot kosong untuk status ini.', 'PENUH');
    }
    kemasBaris_(p, perubahan);
    CacheService.getScriptCache().remove('stats');
    log_('INFO', 'apiAdminUpdate_', p.v[CP['ID']] + ' dikemas kini', { medan: Object.keys(set) });
    return { id: p.v[CP['ID']], dikemas: Object.keys(set) };
  } finally { kunci.releaseLock(); }
}
function apiAdminAdd_(r) {
  const cfg = tetapan_(true);
  const masuk = {};
  Object.keys(r).forEach(function (k) { masuk[k] = r[k]; });
  if (masuk.persetujuan_data === undefined) masuk.persetujuan_data = true;
  const f = sahkanBorang_(masuk, cfg);
  const bayar = SENARAI_BAYAR.indexOf(r.status_bayaran) >= 0 ? r.status_bayaran : 'Belum';
  const kaedah = SENARAI_KAEDAH.indexOf(r.kaedah_daftar) >= 0 ? r.kaedah_daftar : 'Tunai';
  const h = daftarPeserta_(f, {
    kaedah: kaedah, yuran: r.yuran != null && r.yuran !== '' ? Number(r.yuran) : cfg.YURAN_PROMO,
    status: SENARAI_STATUS.indexOf(r.status) >= 0 ? r.status : (bayar === 'Dibayar' ? STATUS.SAH : STATUS.MENUNGGU),
    status_bayaran: bayar, tarikh_bayar: bayar === 'Dibayar' ? new Date() : '', rujukan: bersih_(r.rujukan_bayaran, 60),
    catatan: bersih_(r.catatan, 200), abaikanTutup: true
  });
  return h;
}

/* ============================================================================
 * 9. SIJIL
 * ========================================================================== */
function folderKSQ_(nama) {
  const it = DriveApp.getFoldersByName(nama);
  return it.hasNext() ? it.next() : DriveApp.createFolder(nama);
}
function tetapSimpan_(kunci, nilai) {
  const sh = sheet_(TAB.TETAPAN);
  const v = sh.getRange(2, 1, Math.max(sh.getLastRow() - 1, 1), 1).getValues();
  for (let i = 0; i < v.length; i++) {
    if (String(v[i][0]).trim() === kunci) { sh.getRange(i + 2, 2).setValue(nilai); _CFG = null; return; }
  }
  sh.appendRow([kunci, nilai, '']);
  _CFG = null;
}

/** Salin peserta Disahkan ke Semak_Sijil; kekalkan lajur manual (semakan, kelulusan, pautan...) */
function segerak_semakSijil() {
  const cfg = tetapan_(true);
  const sh = sheet_(TAB.SIJIL);
  const akhirLama = sh.getLastRow();
  const lama = {};
  if (akhirLama >= 2) {
    sh.getRange(2, 1, akhirLama - 1, H_SIJIL.length).getValues().forEach(function (v) { if (v[CS['ID']]) lama[v[CS['ID']]] = v; });
  }
  const peserta = senaraiPeserta_().filter(function (p) { return p.v[CP['Status']] === STATUS.SAH; })
    .sort(function (a, b) { return String(a.v[CP['ID']]).localeCompare(String(b.v[CP['ID']])); });
  const baris = peserta.map(function (p) {
    const id = p.v[CP['ID']];
    const hadir = [1, 2, 3].filter(function (h) { return p.v[CP['Hari ' + h]] === 'Hadir'; }).length;
    const l = lama[id] || new Array(H_SIJIL.length).fill('');
    return [
      id, p.v[CP['Nama peserta']], p.v[CP['Jantina']], hadir, hadir >= cfg.MIN_HADIR_SIJIL ? 'Ya' : 'Tidak',
      l[CS['Nama pada sijil']] || tajukKes_(p.v[CP['Nama peserta']]),
      l[CS['Semakan nama']] === true, l[CS['Kelulusan pengarah']] === true,
      l[CS['No. sijil']], l[CS['Tarikh jana']], l[CS['Pautan PDF']],
      l[CS['Dicetak']] === true, l[CS['Diserahkan']] === true, l[CS['Catatan']]
    ];
  });
  if (akhirLama >= 2) {
    sh.getRange(2, 1, akhirLama - 1, H_SIJIL.length).clearContent().clearDataValidations();
  }
  if (baris.length) {
    pastikanBaris_(sh, baris.length + 20);
    sh.getRange(2, 1, baris.length, H_SIJIL.length).setValues(baris);
    [CS['Semakan nama'], CS['Kelulusan pengarah'], CS['Dicetak'], CS['Diserahkan']].forEach(function (c) {
      sh.getRange(2, c + 1, baris.length, 1).insertCheckboxes();
    });
  }
  log_('INFO', 'segerak_semakSijil', baris.length + ' peserta Disahkan disegerakkan');
  toast_(baris.length + ' peserta disegerakkan ke Semak_Sijil (layak: ' + baris.filter(function (b) { return b[CS['Layak (auto)']] === 'Ya'; }).length + ').');
  return baris.length;
}

/** Bina templat Google Slides sijil (landskap). Placeholder {{...}} boleh disunting dalam Slides. */
function bina_templatSijil() {
  const cfg = tetapan_(true);
  const pres = SlidesApp.create('KSQ 2026 – Templat Sijil');
  const sl = pres.getSlides()[0];
  sl.getPageElements().forEach(function (e) { e.remove(); });
  const W = pres.getPageWidth(), H = pres.getPageHeight();
  sl.getBackground().setSolidFill('#06301F');
  const kotak = function (l, t, w, h, isi, garis, tebal) {
    const s = sl.insertShape(SlidesApp.ShapeType.RECTANGLE, l, t, w, h);
    if (isi) s.getFill().setSolidFill(isi); else s.getFill().setTransparent();
    if (garis) { s.getBorder().getLineFill().setSolidFill(garis); s.getBorder().setWeight(tebal || 1); } else s.getBorder().setTransparent();
    return s;
  };
  kotak(16, 16, W - 32, H - 32, '#FBF6EA', '#D9B25E', 2.5);
  kotak(26, 26, W - 52, H - 52, null, '#D9B25E', 0.75);
  [[26, 26], [W - 26, 26], [26, H - 26], [W - 26, H - 26]].forEach(function (p) {
    const d = sl.insertShape(SlidesApp.ShapeType.DIAMOND, p[0] - 6, p[1] - 6, 12, 12);
    d.getFill().setSolidFill('#D9B25E'); d.getBorder().setTransparent();
  });
  const teks = function (isi, t, h, saiz, o) {
    o = o || {};
    const s = sl.insertTextBox(isi, 60, t, W - 120, h);
    const tx = s.getText();
    tx.getTextStyle().setFontFamily(o.font || 'Montserrat').setFontSize(saiz).setBold(!!o.tebal).setItalic(!!o.condong)
      .setForegroundColor(o.warna || '#06301F');
    tx.getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
    s.setContentAlignment(SlidesApp.ContentAlignment.MIDDLE);
    return s;
  };
  let logoTop = 34, tinggiLogo = 0;
  if (cfg.LOGO_FILE_ID) {
    try {
      const img = sl.insertImage(DriveApp.getFileById(cfg.LOGO_FILE_ID).getBlob());
      const skala = 54 / img.getHeight();
      img.scaleHeight(skala); img.scaleWidth(skala);
      img.setLeft((W - img.getWidth()) / 2).setTop(logoTop);
      tinggiLogo = 54;
    } catch (e) { log_('AMARAN', 'bina_templatSijil', 'Logo tidak dapat dimuat: ' + e.message); }
  }
  const y0 = tinggiLogo ? logoTop + tinggiLogo + 2 : 40;
  teks('MASJID KAMPUNG SUNGAI LANG BARU · BANTING', y0, 16, 9, { tebal: true, warna: '#0A6A40' });
  teks('SIJIL PENYERTAAN', y0 + 16, 44, 32, { font: 'Playfair Display', tebal: true });
  teks('{{TAJUK_PROGRAM}}', y0 + 58, 20, 12, { tebal: true, warna: '#B88A2C' });
  teks('Dengan ini disahkan bahawa', y0 + 82, 16, 10, { condong: true, warna: '#4A5A50' });
  teks('{{NAMA}}', y0 + 98, 40, 26, { font: 'Playfair Display', tebal: true });
  const g = sl.insertLine(SlidesApp.LineCategory.STRAIGHT, 170, y0 + 142, W - 170, y0 + 142);
  g.getLineFill().setSolidFill('#D9B25E'); g.setWeight(1.5);
  teks('telah menyertai {{TAJUK_PROGRAM}} pada {{TARIKH}} di {{LOKASI}}, serta mengikuti program hafazan ({{SURAH}}), pembinaan jiwa dan kepimpinan.',
    y0 + 148, 44, 10, { warna: '#2E3B33' });
  teks('“Membina Jiwa, Mengungguli Akhlak dengan Kalamullah.”', y0 + 194, 18, 10, { font: 'Playfair Display', condong: true, warna: '#B88A2C' });
  const ySig = H - 62;
  [[90, 270], [W - 270, W - 90]].forEach(function (p) {
    const l = sl.insertLine(SlidesApp.LineCategory.STRAIGHT, p[0], ySig, p[1], ySig);
    l.getLineFill().setSolidFill('#06301F'); l.setWeight(0.75);
  });
  const sig = function (isi, kiri, t, h, saiz, tebal) {
    const s = sl.insertTextBox(isi, kiri, t, 180, h);
    s.getText().getTextStyle().setFontFamily('Montserrat').setFontSize(saiz).setBold(tebal).setForegroundColor('#06301F');
    s.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
  };
  sig('{{NAMA_PENGERUSI}}', 90, ySig + 2, 14, 9, true);
  sig('Pengerusi Masjid', 90, ySig + 15, 12, 8, false);
  sig('{{NAMA_PENGARAH}}', W - 270, ySig + 2, 14, 9, true);
  sig('Pengarah Program', W - 270, ySig + 15, 12, 8, false);
  teks('No. Sijil: {{NO_SIJIL}}  ·  ID: {{ID}}', H - 40, 12, 7, { warna: '#7A7A7A' });
  pres.saveAndClose();
  const folder = folderSijil_();
  DriveApp.getFileById(pres.getId()).moveTo(folder);
  tetapSimpan_('TEMPLAT_SIJIL_ID', pres.getId());
  log_('INFO', 'bina_templatSijil', 'Templat dibina', { id: pres.getId() });
  maklum_('Templat sijil dibina', 'Buka dan suaikan reka bentuk jika perlu (kekalkan teks {{...}}):\n' + pres.getUrl() +
    (cfg.LOGO_FILE_ID ? '' : '\n\nTip: muat naik logo PNG lutsinar ke Google Drive dan letak ID failnya dalam Tetapan -> LOGO_FILE_ID, kemudian bina semula templat.'));
}
function folderSijil_() {
  const cfg = tetapan_();
  if (cfg.FOLDER_SIJIL_ID) { try { return DriveApp.getFolderById(cfg.FOLDER_SIJIL_ID); } catch (e) { /* cipta baharu */ } }
  const f = folderKSQ_('KSQ 2026 – Sijil');
  tetapSimpan_('FOLDER_SIJIL_ID', f.getId());
  return f;
}
function namaFail_(s) { return String(s).replace(/[\\\/:*?"<>|]+/g, '').replace(/\s+/g, ' ').trim().slice(0, 60); }

function janaSatuSijil_(cfg, tpl, folder, rek) {
  const salinan = tpl.makeCopy('TEMP_' + rek.id);
  try {
    const pres = SlidesApp.openById(salinan.getId());
    const saiz = rek.nama.length > 42 ? 17 : (rek.nama.length > 30 ? 21 : 0);
    pres.getSlides().forEach(function (sl) {
      sl.getShapes().forEach(function (sh) {
        const t = sh.getText();
        if (t.asString().indexOf('{{NAMA}}') >= 0) {
          t.replaceAllText('{{NAMA}}', rek.nama);
          if (saiz) t.getTextStyle().setFontSize(saiz);
        }
      });
    });
    const peta = {
      '{{TAJUK_PROGRAM}}': cfg.TAJUK_PROGRAM, '{{TARIKH}}': julatTarikhBM_(cfg.TARIKH_MULA, cfg.TARIKH_TAMAT),
      '{{LOKASI}}': cfg.LOKASI, '{{SURAH}}': cfg.SURAH_SASARAN, '{{NO_SIJIL}}': rek.noSijil, '{{ID}}': rek.id,
      '{{NAMA_PENGERUSI}}': cfg.NAMA_PENGERUSI, '{{NAMA_PENGARAH}}': cfg.NAMA_PENGARAH
    };
    Object.keys(peta).forEach(function (k) { pres.replaceAllText(k, String(peta[k])); });
    pres.saveAndClose();
    const pdf = DriveApp.getFileById(salinan.getId()).getAs('application/pdf');
    pdf.setName('Sijil_KSQ2026_' + rek.id + '_' + namaFail_(rek.nama) + '.pdf');
    const fail = folder.createFile(pdf);
    return fail.getUrl();
  } finally {
    salinan.setTrashed(true);
  }
}

function jana_sijilDisemak() { janaSijil_('disemak'); }
function jana_sijilSemua() { janaSijil_('semua'); }
function jana_sijilTerpilih() { janaSijil_('terpilih'); }

function janaSijil_(mod) {
  const mula = Date.now();
  const cfg = tetapan_(true);
  if (!cfg.TEMPLAT_SIJIL_ID) { maklum_('Templat belum ada', 'Jalankan menu KSQ 2026 -> Bina templat sijil dahulu.'); return; }
  let tpl;
  try { tpl = DriveApp.getFileById(cfg.TEMPLAT_SIJIL_ID); } catch (e) { maklum_('Templat tidak dijumpai', 'Bina semula templat sijil.'); return; }
  const sh = sheet_(TAB.SIJIL);
  const akhir = sh.getLastRow();
  if (akhir < 2) { maklum_('Tiada data', 'Jalankan "Segerak Semak Sijil" dahulu.'); return; }
  const data = sh.getRange(2, 1, akhir - 1, H_SIJIL.length).getValues();
  let dipilih = null;
  if (mod === 'terpilih') {
    const ar = SpreadsheetApp.getActiveRange();
    if (ss_().getActiveSheet().getName() !== TAB.SIJIL || !ar) { maklum_('Pilih baris', 'Pilih sel pada baris peserta dalam tab Semak_Sijil.'); return; }
    dipilih = {};
    for (let i = 0; i < ar.getNumRows(); i++) dipilih[ar.getRow() + i] = true;
  }
  const sasaran = [];
  data.forEach(function (v, i) {
    const r = i + 2;
    if (!v[CS['ID']] || !String(v[CS['Nama pada sijil']]).trim()) return;
    const ada = !!v[CS['Pautan PDF']];
    if (mod === 'terpilih') { if (dipilih[r]) sasaran.push({ r: r, v: v }); return; }
    if (v[CS['Layak (auto)']] !== 'Ya' || ada) return;
    if (mod === 'disemak' && !(v[CS['Semakan nama']] === true && v[CS['Kelulusan pengarah']] === true)) return;
    sasaran.push({ r: r, v: v });
  });
  if (!sasaran.length) { maklum_('Tiada sijil untuk dijana', 'Tiada baris yang memenuhi syarat (layak, belum dijana' + (mod === 'disemak' ? ', Semakan nama + Kelulusan pengarah ditandakan' : '') + ').'); return; }
  const props = PropertiesService.getScriptProperties();
  const folder = folderSijil_();
  let siap = 0, gagal = [];
  for (let i = 0; i < sasaran.length; i++) {
    if (Date.now() - mula > 4.5 * 60 * 1000) break; // had masa Apps Script ~6 minit
    const s = sasaran[i];
    let noSijil = s.v[CS['No. sijil']];
    if (!noSijil) {
      const seq = parseInt(props.getProperty('SEQ_SIJIL') || '0', 10) + 1;
      props.setProperty('SEQ_SIJIL', String(seq));
      noSijil = PREFIX_ID + '-SJ-' + ('000' + seq).slice(-3);
    }
    try {
      const url = janaSatuSijil_(cfg, tpl, folder, { id: s.v[CS['ID']], nama: String(s.v[CS['Nama pada sijil']]).trim(), noSijil: noSijil });
      sh.getRange(s.r, CS['No. sijil'] + 1, 1, 3).setValues([[noSijil, new Date(), url]]);
      siap++;
    } catch (e) {
      gagal.push(s.v[CS['ID']] + ': ' + e.message);
      log_('RALAT', 'janaSijil_', s.v[CS['ID']] + ' — ' + e.message);
    }
  }
  const baki = sasaran.length - siap - gagal.length;
  log_('INFO', 'janaSijil_', 'Mod ' + mod + ': ' + siap + ' siap, ' + gagal.length + ' gagal, ' + baki + ' tinggal');
  maklum_('Penjanaan sijil', siap + ' sijil dijana dan disimpan dalam folder Drive "' + folder.getName() + '".' +
    (gagal.length ? '\nGagal (' + gagal.length + '):\n' + gagal.join('\n') : '') +
    (baki > 0 ? '\n\n' + baki + ' lagi belum dijana kerana had masa. Jalankan semula menu yang sama.' : ''));
}

/* ============================================================================
 * 10. SANDARAN
 * ========================================================================== */
function sandar_sekarang() {
  const ss = ss_();
  const nama = 'Sandaran ' + ss.getName() + ' ' + Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HHmm');
  const salin = DriveApp.getFileById(ss.getId()).makeCopy(nama, folderKSQ_('KSQ 2026 – Sandaran'));
  log_('INFO', 'sandar_sekarang', 'Sandaran dicipta', { url: salin.getUrl() });
  toast_('Sandaran dicipta: ' + nama);
  return salin.getUrl();
}
function sandar_harian() {
  sandar_sekarang();
  const fail = [];
  const it = folderKSQ_('KSQ 2026 – Sandaran').getFiles();
  while (it.hasNext()) fail.push(it.next());
  fail.sort(function (a, b) { return b.getDateCreated() - a.getDateCreated(); });
  fail.slice(14).forEach(function (f) { f.setTrashed(true); });
}

/* ============================================================================
 * 11. DEBUG
 * ========================================================================== */
const PREFIX_UJIAN = '[UJIAN] ';

function debug_paparKonfigurasi() {
  const cfg = tetapan_(true);
  const props = PropertiesService.getScriptProperties();
  const baris = ['VERSI: ' + VERSI, 'Zon masa: ' + TZ, 'Spreadsheet ID: ' + ss_().getId(), ''];
  Object.keys(cfg).forEach(function (k) {
    if (k === 'SLOT_STATUS') return;
    const v = cfg[k];
    baris.push(k + ' = ' + (v instanceof Date ? Utilities.formatDate(v, TZ, 'EEEE dd/MM/yyyy HH:mm') : v));
  });
  baris.push('', 'FASILITATOR_TOKEN ditetapkan: ' + (props.getProperty('FASILITATOR_TOKEN') ? 'YA' : 'TIDAK'));
  baris.push('ADMIN_TOKEN ditetapkan: ' + (props.getProperty('ADMIN_TOKEN') ? 'YA' : 'TIDAK'));
  let url = null;
  try { url = ScriptApp.getService().getUrl(); } catch (e) { /* belum deploy */ }
  baris.push('URL Web App: ' + (url || '(belum di-deploy)'));
  paparLaporan_('Konfigurasi KSQ 2026', baris);
  return baris;
}

function debug_semakSistem() {
  const L = [];
  const ok = function (m) { L.push('[OK]      ' + m); };
  const am = function (m) { L.push('[AMARAN]  ' + m); };
  const ra = function (m) { L.push('[RALAT]   ' + m); };
  const info = function (m) { L.push('[INFO]    ' + m); };
  try {
    const ss = ss_();
    ok('Spreadsheet: ' + ss.getName());
    const skema = [
      [TAB.LELAKI, H_PESERTA], [TAB.PEREMPUAN, H_PESERTA], [TAB.FASILITATOR, H_FAC], [TAB.SEBELUM, H_TUGAS], [TAB.SEMASA, H_TUGAS],
      [TAB.SELEPAS, H_TUGAS], [TAB.PENGURUS, H_TUGAS], [TAB.PENGARAH, H_TUGAS], [TAB.SIJIL, H_SIJIL], [TAB.LOG, H_LOG]
    ];
    ['Dashboard', 'Tetapan'].forEach(function (n) { if (ss.getSheetByName(n)) ok('Tab ' + n + ' wujud'); else ra('Tab ' + n + ' tiada'); });
    skema.forEach(function (s) {
      const sh = ss.getSheetByName(s[0]);
      if (!sh) { ra('Tab ' + s[0] + ' tiada — jalankan Sediakan sistem'); return; }
      const h = sh.getRange(1, 1, 1, s[1].length).getValues()[0];
      const salah = s[1].filter(function (x, i) { return h[i] !== x; });
      if (salah.length) ra('Tab ' + s[0] + ': tajuk tidak sepadan (' + salah.join(', ') + ')'); else ok('Tab ' + s[0] + ': tajuk betul');
    });

    const cfg = tetapan_(true);
    if (cfg.TARIKH_TAMAT < cfg.TARIKH_MULA) ra('TARIKH_TAMAT lebih awal daripada TARIKH_MULA');
    else ok('Tarikh program: ' + Utilities.formatDate(cfg.TARIKH_MULA, TZ, 'EEEE dd/MM/yyyy') + ' hingga ' + Utilities.formatDate(cfg.TARIKH_TAMAT, TZ, 'EEEE dd/MM/yyyy'));
    if (!cfg.TUTUP_DAFTAR) am('TUTUP_DAFTAR kosong — pendaftaran tidak akan tutup mengikut tarikh');
    else if (cfg.TUTUP_DAFTAR >= cfg.TARIKH_MULA) am('TUTUP_DAFTAR jatuh pada/selepas hari program');
    else ok('Pendaftaran ditutup pada ' + Utilities.formatDate(cfg.TUTUP_DAFTAR, TZ, 'dd/MM/yyyy HH:mm'));
    if (/^\[/.test(cfg.NAMA_PENGERUSI) || /^\[/.test(cfg.NAMA_PENGARAH)) am('NAMA_PENGERUSI / NAMA_PENGARAH masih placeholder (akan tertera pada sijil)');
    if (!cfg.EMAIL_ADMIN) info('EMAIL_ADMIN kosong — tiada pemberitahuan emel');

    const props = PropertiesService.getScriptProperties();
    const tf = props.getProperty('FASILITATOR_TOKEN'), ta = props.getProperty('ADMIN_TOKEN');
    if (!tf) ra('FASILITATOR_TOKEN belum ditetapkan'); else if (tf.length < 16) am('FASILITATOR_TOKEN terlalu pendek (<16 aksara)'); else ok('FASILITATOR_TOKEN ditetapkan');
    if (!ta) ra('ADMIN_TOKEN belum ditetapkan'); else if (ta.length < 16) am('ADMIN_TOKEN terlalu pendek (<16 aksara)'); else ok('ADMIN_TOKEN ditetapkan');
    if (tf && ta && tf === ta) ra('Token fasilitator dan admin SAMA — fasilitator akan ada akses admin');

    const semua = senaraiPeserta_();
    ok(semua.length + ' peserta (L: ' + semua.filter(function (p) { return p.tab === TAB.LELAKI; }).length + ', P: ' + semua.filter(function (p) { return p.tab === TAB.PEREMPUAN; }).length + ')');
    const idSet = {}, kun = {};
    let dupId = 0, dupOrang = 0, salahTab = 0, salahStatus = 0, salahUmur = 0, tanpaTel = 0, belumBayar = 0;
    semua.forEach(function (p) {
      const id = p.v[CP['ID']];
      if (idSet[id]) dupId++; idSet[id] = 1;
      const k = kunciNama_(p.v[CP['Nama peserta']]) + '|' + String(p.v[CP['Tel penjaga']]).replace(/\D/g, '');
      if (kun[k] && [STATUS.BATAL, STATUS.TOLAK].indexOf(p.v[CP['Status']]) < 0) dupOrang++; kun[k] = 1;
      if ((p.tab === TAB.LELAKI && p.v[CP['Jantina']] !== 'Lelaki') || (p.tab === TAB.PEREMPUAN && p.v[CP['Jantina']] !== 'Perempuan')) salahTab++;
      if (SENARAI_STATUS.indexOf(p.v[CP['Status']]) < 0) salahStatus++;
      const u = Number(p.v[CP['Umur']]);
      if (u && (u < cfg.UMUR_MIN || u > cfg.UMUR_MAX)) salahUmur++;
      if (!String(p.v[CP['Tel penjaga']]).trim()) tanpaTel++;
      if (p.v[CP['Status']] === STATUS.SAH && p.v[CP['Status bayaran']] === 'Belum') belumBayar++;
    });
    if (dupId) ra(dupId + ' ID peserta berganda'); else ok('Tiada ID berganda');
    if (dupOrang) am(dupOrang + ' kemungkinan pendaftaran berganda (nama + telefon sama)'); else ok('Tiada pendaftaran berganda');
    if (salahTab) ra(salahTab + ' peserta berada dalam tab jantina yang salah'); else ok('Jantina sepadan dengan tab');
    if (salahStatus) ra(salahStatus + ' peserta mempunyai Status tidak sah'); else ok('Semua Status sah');
    if (salahUmur) am(salahUmur + ' peserta di luar julat umur ' + cfg.UMUR_MIN + '–' + cfg.UMUR_MAX);
    if (tanpaTel) am(tanpaTel + ' peserta tanpa nombor telefon penjaga');
    if (belumBayar) info(belumBayar + ' peserta Disahkan tetapi Status bayaran masih "Belum"');
    const st = statusDaftar_(cfg, semua);
    ok('Slot: ' + st.didaftar + '/' + cfg.KAPASITI + ' digunakan, baki ' + st.baki + ' | Pendaftaran ' + (st.dibuka ? 'DIBUKA' : 'DITUTUP (' + st.sebab + ')'));
    if (st.didaftar > cfg.KAPASITI) am('Slot digunakan melebihi kapasiti');

    TAB_TUGAS.forEach(function (t) {
      const sh = ss.getSheetByName(t);
      if (!sh || sh.getLastRow() < 2) return;
      const v = sh.getRange(2, 1, sh.getLastRow() - 1, H_TUGAS.length).getValues().filter(function (r) { return String(r[CT['Tugasan']]).trim(); });
      const siap = v.filter(function (r) { return r[CT['Status']] === 'Siap'; }).length;
      const lewat = v.filter(function (r) { return r[CT['Tarikh akhir']] instanceof Date && r[CT['Tarikh akhir']] < new Date() && ['Siap', 'Tidak berkenaan'].indexOf(r[CT['Status']]) < 0; }).length;
      (lewat ? am : ok)(t + ': ' + siap + '/' + v.length + ' siap' + (lewat ? ', ' + lewat + ' LEWAT' : ''));
    });

    if (cfg.TEMPLAT_SIJIL_ID) { try { DriveApp.getFileById(cfg.TEMPLAT_SIJIL_ID).getName(); ok('Templat sijil boleh diakses'); } catch (e) { ra('Templat sijil tidak boleh diakses (ID salah / dipadam)'); } }
    else info('Templat sijil belum dibina');
    if (cfg.LOGO_FILE_ID) { try { DriveApp.getFileById(cfg.LOGO_FILE_ID).getName(); ok('Fail logo boleh diakses'); } catch (e) { am('LOGO_FILE_ID tidak sah'); } }
    const nt = ScriptApp.getProjectTriggers().length;
    info(nt + ' pencetus dipasang' + (nt ? '' : ' (sandaran harian belum dipasang)'));
    let url = null; try { url = ScriptApp.getService().getUrl(); } catch (e) { /* abaikan */ }
    if (url) ok('Web App: ' + url); else am('Web App belum di-deploy');
  } catch (e) {
    ra('Semakan terhenti: ' + e.message);
  }
  const kiraan = { RALAT: 0, AMARAN: 0 };
  L.forEach(function (x) { if (/^\[RALAT\]/.test(x)) kiraan.RALAT++; if (/^\[AMARAN\]/.test(x)) kiraan.AMARAN++; });
  L.push('', 'Ringkasan: ' + kiraan.RALAT + ' ralat, ' + kiraan.AMARAN + ' amaran.');
  log_(kiraan.RALAT ? 'RALAT' : (kiraan.AMARAN ? 'AMARAN' : 'INFO'), 'debug_semakSistem', 'Semakan kesihatan: ' + kiraan.RALAT + ' ralat, ' + kiraan.AMARAN + ' amaran');
  paparLaporan_('Kesihatan sistem KSQ 2026', L);
  return L;
}

function debug_ujiDaftar() {
  const cfg = tetapan_(true);
  const unik = Utilities.formatDate(new Date(), TZ, 'HHmmss');
  const hasil = urus_({
    postData: { type: 'text/plain', contents: JSON.stringify({
      action: 'register', nama_peserta: PREFIX_UJIAN + 'Ahmad Danish bin Ali ' + unik, umur: 12, jantina: 'Lelaki',
      tel_penjaga: '012-345 6' + unik.slice(0, 3), nama_penjaga: 'Ali bin Abu', lancar_quran: 'ya', alahan_kesihatan: 'Tiada', persetujuan_data: true, website: ''
    }) }
  }, 'POST');
  const j = JSON.parse(hasil.getContent());
  paparLaporan_('Uji pendaftaran', [JSON.stringify(j, null, 2), '', 'Padam rekod ujian: menu Debug -> Padam semua data [UJIAN].', 'Yuran online semasa: RM' + cfg.YURAN_ONLINE]);
  return j;
}

function debug_ujiAPI() {
  const L = [];
  const panggil = function (nama, e, kaedah) {
    try {
      const j = JSON.parse(urus_(e, kaedah || 'GET').getContent());
      L.push((j.ok ? '[OK]    ' : '[GAGAL] ') + nama + ' -> ' + JSON.stringify(j).slice(0, 260));
      return j;
    } catch (err) { L.push('[RALAT] ' + nama + ': ' + err.message); return null; }
  };
  const post = function (o) { return { postData: { type: 'text/plain', contents: JSON.stringify(o) } }; };
  const props = PropertiesService.getScriptProperties();
  panggil('ping', { parameter: { action: 'ping' } });
  CacheService.getScriptCache().remove('stats');
  panggil('stats', { parameter: { action: 'stats' } });
  panggil('register (GET ditolak)', { parameter: { action: 'register' } }, 'GET');
  panggil('fac_login (token salah)', post({ action: 'fac_login', token: 'salah-salah-salah' }), 'POST');
  CacheService.getScriptCache().remove('gagal_auth');
  const tf = props.getProperty('FASILITATOR_TOKEN');
  if (tf) {
    panggil('fac_login (token betul)', post({ action: 'fac_login', token: tf }), 'POST');
    panggil('fac_list', post({ action: 'fac_list', token: tf }), 'POST');
    panggil('admin_list dengan token fasilitator (mesti ditolak)', post({ action: 'admin_list', token: tf }), 'POST');
    CacheService.getScriptCache().remove('gagal_auth');
  } else L.push('[LANGKAU] token fasilitator belum ditetapkan');
  const ta = props.getProperty('ADMIN_TOKEN');
  if (ta) panggil('admin_stats', post({ action: 'admin_stats', token: ta }), 'POST'); else L.push('[LANGKAU] token admin belum ditetapkan');
  paparLaporan_('Uji API', L);
  return L;
}

function debug_isiDataContoh(n) {
  n = n || 10;
  const cfg = tetapan_(true);
  const nama = ['Ahmad Danish', 'Muhammad Hakimi', 'Aiman Hafiz', 'Irfan Hakim', 'Zulkarnain', 'Nur Aisyah', 'Siti Maryam', 'Nur Balqis', 'Aina Sofea', 'Fatimah Az-Zahra', 'Haziq Iman', 'Nur Damia'];
  let dibuat = 0;
  for (let i = 0; i < n; i++) {
    const lelaki = i % 2 === 0;
    const f = {
      nama_peserta: PREFIX_UJIAN + nama[i % nama.length] + (lelaki ? ' bin ' : ' binti ') + 'Contoh ' + (i + 1),
      umur: 10 + (i % 8), jantina: lelaki ? 'Lelaki' : 'Perempuan', tel_penjaga: '012-34567' + ('0' + i).slice(-2),
      tel_digit: '012345 67' + ('0' + i).slice(-2), nama_penjaga: 'Penjaga Contoh ' + (i + 1), lancar_quran: 'Ya', alahan_kesihatan: i % 3 === 0 ? 'Alah kacang' : 'Tiada'
    };
    f.tel_digit = f.tel_penjaga.replace(/\D/g, '');
    try {
      const h = daftarPeserta_(f, { kaedah: 'Online', yuran: cfg.YURAN_ONLINE, status: STATUS.SAH, status_bayaran: 'Dibayar', tarikh_bayar: new Date(), abaikanTutup: true, abaikanKapasiti: true });
      const p = cariPeserta_(h.id);
      kemasBaris_(p, { 'Hari 1': 'Hadir', 'Hari 2': i % 4 === 3 ? 'Tidak hadir' : 'Hadir', 'Hari 3': i % 5 === 4 ? '' : 'Hadir' });
      dibuat++;
    } catch (e) { log_('AMARAN', 'debug_isiDataContoh', e.message); }
  }
  toast_(dibuat + ' data contoh [UJIAN] dimasukkan. Padam melalui Debug -> Padam semua data [UJIAN].');
  return dibuat;
}

function debug_padamDataUjian() {
  let padam = 0;
  [TAB.LELAKI, TAB.PEREMPUAN].forEach(function (tab) {
    const sh = sheet_(tab);
    const akhir = sh.getLastRow();
    if (akhir < 2) return;
    const v = sh.getRange(2, CP['Nama peserta'] + 1, akhir - 1, 1).getValues();
    for (let i = v.length - 1; i >= 0; i--) {
      if (String(v[i][0]).indexOf(PREFIX_UJIAN) === 0) { sh.deleteRow(i + 2); padam++; }
    }
  });
  CacheService.getScriptCache().remove('stats');
  segerak_semakSijil();
  log_('INFO', 'debug_padamDataUjian', padam + ' rekod ujian dipadam');
  toast_(padam + ' rekod [UJIAN] dipadam.');
  return padam;
}

function debug_janaToken() {
  const props = PropertiesService.getScriptProperties();
  const baru = function () {
    const u = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '');
    return 'KSQ-' + u.slice(0, 6) + '-' + u.slice(6, 12) + '-' + u.slice(12, 18) + '-' + u.slice(18, 24);
  };
  let ui = null;
  try { ui = SpreadsheetApp.getUi(); } catch (e) { /* tiada UI */ }
  if (ui && (props.getProperty('FASILITATOR_TOKEN') || props.getProperty('ADMIN_TOKEN'))) {
    const j = ui.alert('Jana token baharu', 'Token sedia ada akan DIGANTI dan laman fasilitator / admin perlu log masuk semula dengan token baharu. Teruskan?', ui.ButtonSet.YES_NO);
    if (j !== ui.Button.YES) return;
  }
  const tf = baru(), ta = baru();
  props.setProperty('FASILITATOR_TOKEN', tf);
  props.setProperty('ADMIN_TOKEN', ta);
  CacheService.getScriptCache().remove('kunci_auth');
  CacheService.getScriptCache().remove('gagal_auth');
  log_('INFO', 'debug_janaToken', 'Token dijana semula');
  paparLaporan_('Token baharu — SALIN & SIMPAN SEKARANG', [
    'Token FASILITATOR (beri kepada fasilitator):', tf, '',
    'Token ADMIN (urus setia / pengurus sahaja):', ta, '',
    'Token disimpan dalam Script Properties (FASILITATOR_TOKEN, ADMIN_TOKEN).',
    'Jangan kongsi token admin. Jana semula selepas program tamat.'
  ]);
}

function debug_kosongLog() {
  const sh = sheet_(TAB.LOG);
  if (sh.getLastRow() > 1) sh.deleteRows(2, sh.getLastRow() - 1);
  toast_('Log dikosongkan.');
}