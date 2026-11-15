# ARCHITECTURE.md — Sistem Pengurusan KSQ 2026

> Dokumen ini menerangkan sistem yang **sudah dibina** (Fasa 1–6) serta
> sambungan fasilitator dan MCP. Fasa 7–10 **belum dilaksanakan**; pelannya ada
> dalam `PLAN-ADDENDUM.md`. Jika dokumen ini bercanggah dengan kod, kod ialah
> sumber kebenaran dan dokumen ini perlu dikemas kini.

---

## 1. Prinsip seni bina

1. **Satu backend, satu pangkalan data.** Google Apps Script Web App dan Google
   Sheets sahaja. Tiada pelayan aplikasi, tiada pangkalan data kedua.
2. **Tiada build step.** Frontend ialah HTML, CSS dan ES modules yang dimuat
   terus oleh pelayar. Tiada framework, tiada bundler, tiada pakej npm runtime.
3. **Rahsia di luar repo.** Token hanya dalam Apps Script Script Properties.
   `web/config.js` hanya mengandungi URL awam.
4. **Masa Kuala Lumpur.** Semua tarikh disimpan sebagai teks ISO 8601 dengan
   `+08:00`; semua kiraan kalendar menggunakan `Asia/Kuala_Lumpur`.
5. **Server ialah pengadil.** Kapasiti, pendua, honeypot, umur dan status
   pendaftaran disemak di server, bukan hanya di borang.
6. **Data kanak-kanak dilindungi.** Endpoint awam tidak memulangkan nama atau
   telefon. Token fasilitator tidak membuka kewangan. Semua teks dinamik
   melalui `textContent`.
7. **Migrasi tidak merosakkan.** `setupSheets()` menambah lajur/helaian yang
   hilang; ia tidak memadam data.
8. **Boleh dihoskan di mana-mana hosting statik.** GitHub Pages, Netlify atau
   pelayan fail biasa. Untuk pratonton setempat, `serve.js` disediakan kerana
   ES modules tidak boleh dimuat dari `file://`.

---

## 2. Topologi runtime

```text
                         WhatsApp / pautan awam
                                  |
                                  v
                    +-----------------------------+
                    |  web/index.html             |
                    |  borang + stats + countdown |
                    +--------------+--------------+
                                   |
              +--------------------+--------------------+
              |                                         |
              v                                         v
   +----------------------+                  +----------------------+
   | web/admin.html       |                  | web/fasilitator.html |
   | token pentadbir      |                  | token fasilitator    |
   | semua modul          |                  | peserta + kehadiran  |
   +----------+-----------+                  +----------+-----------+
              |                                         |
              +-------------------+---------------------+
                                  |
                                  v
                 +----------------------------------+
                 | Google Apps Script Web App       |
                 | backend/Code.gs  (doGet/doPost)  |
                 | LockService, token, validasi     |
                 +----------------+-----------------+
                                  |
                                  v
                 +----------------------------------+
                 | Google Sheets                    |
                 | 7 helaian (Fasa 1–6)             |
                 +----------------------------------+

   Klien AI / terminal
          |
          v
   +----------------------+        HTTPS /exec
   | mcp-ksq26/server.js  | ------------------------> GAS
   | stdio JSON-RPC       |
   +----------------------+
```

Tiada CORS preflight: POST dihantar dengan `Content-Type: text/plain;charset=utf-8`
dan badan JSON. GAS tidak menyokong `OPTIONS`, jadi corak ini mengelakkan
preflight.

---

## 3. Struktur fail

```text
ksq-sistem/
  AGENTS.md                     arahan projek asal
  ARAHAN-TAMBAHAN-FASA7-10.md   addendum pengurusan/kewangan
  PLAN.md                       pelan Fasa 0–6 dan status
  PLAN-ADDENDUM.md              pelan Fasa 7–10 (belum dilaksana)
  ARCHITECTURE.md               dokumen ini
  CHANGELOG.md
  TODO-PEMILIK.md
  README.md                     panduan pemasangan untuk pemilik
  package.json                  skrip ujian/preview; tiada dependencies
  serve.js                      pelayan statik setempat
  BUKA-DASHBOARD.bat            pembuka dashboard Windows
  docs/                         dokumen asal (tidak diubah)
  assets/                       logo.png, masjid-udara.jpg
  backend/
    Code.gs                     semua logik server
    appsscript.json             manifest GAS, timeZone Asia/Kuala_Lumpur
    PASANG-GAS.md               panduan pemasangan
  web/
    index.html                  halaman awam
    admin.html                  dashboard pentadbir
    fasilitator.html            kehadiran sahaja
    config.js                   API_URL awam
    css/style.css               semua gaya
    js/
      api.js                    fetch POST + ralat
      time.js                   masa KL, countdown, RM, CSV
      ui.js                     helper DOM selamat
      register.js               halaman awam
      admin.js                  dashboard
      facilitator.js            kehadiran
    data/
      seed-tasks.json           milestone, tugasan, bajet asas
      seed-tugasan-lanjutan.json
      seed-bajet.json
      seed-fasilitator.json
      seed-jawatankuasa.json
      peserta-import-templat.csv
    templates/
      sijil.html
      tag-nama.html
    assets/
      logo.png
      masjid-udara.jpg
      og-ksq.jpg
  tests/
    time.test.js
    seed.test.js
    backend.test.js
    api-smoke.js
  mcp-ksq26/
    server.js
    lib/api-client.js
    lib/tools.js
    lib/finance.js
    lib/resources.js
    resources/
    test/
    README.md
```

---

## 4. Model data (Fasa 1–6)

Google Sheets ialah satu-satunya stor data. Setiap helaian mempunyai baris
pengepala tetap. Nama lajur tidak boleh diubah selepas data dimasukkan.

### 4.1 `Pendaftaran`

`id | masa_daftar | nama_peserta | umur | jantina | nama_penjaga | tel_penjaga | lancar_quran | alahan_kesihatan | kaedah_daftar | yuran_rm | status_bayaran | rujukan_bayaran | status | catatan`

| Lajur | Nilai |
|---|---|
| `id` | `KSQ26-0001`, bertambah mengikut urutan. |
| `masa_daftar` | ISO 8601 `+08:00`. |
| `umur` | Integer; lalai 10–18, boleh ubah di Tetapan. |
| `jantina` | `Lelaki` / `Perempuan`. |
| `tel_penjaga` | Digit sahaja, bermula `01`, 10–11 digit. |
| `lancar_quran` | `ya` (server menolak `tidak`). |
| `kaedah_daftar` | `online` / `manual`. |
| `yuran_rm` | 110 online, 120 manual (dibaca daripada Tetapan). |
| `status_bayaran` | `Belum` / `Sudah` / `Dikecualikan`. |
| `status` | `Disahkan` / `Menunggu` / `Senarai Tunggu` / `Batal`. |

### 4.2 `Tetapan`

`kunci | nilai`

Kunci lalai:

- `kapasiti=40`
- `yuran_asal=180`, `yuran_promo=120`, `diskaun_online=10`
- `umur_min=10`, `umur_max=18`
- `tarikh_mula=2026-12-14T08:00:00+08:00`
- `tarikh_tamat=2026-12-16T17:00:00+08:00`
- `tarikh_tutup_daftar=2026-12-07T23:59:00+08:00`
- `pendaftaran_dibuka=true`
- `tel_urus_setia=[ISI ...]`
- `butiran_bayaran=[ISI ...]`
- `sumber_pendaftaran=sistem` / `sheet_luar`
- `sheet_luar_id`, `sheet_luar_tab`

`settings.get` tidak memulangkan token sebenar; hanya boolean
`tokens.admin` dan `tokens.fasilitator`.

### 4.3 `Tugasan`

`id | kategori | tugasan | pic | deadline | status | catatan | dikemaskini`

Kategori yang diterima: `Pendaftaran`, `Destinasi`, `Logistik`, `Kandungan`,
`Kewangan`, `Promosi`, `Hari Program`, `Selepas program`.

Status: `Belum`, `Sedang`, `Selesai`.

### 4.4 `Milestone`

`id | tajuk | tarikh | penerangan | status`

Status: `Belum`, `Selesai`.

### 4.5 `Bajet`

`id | item | kategori | anggaran_rm | sebenar_rm | catatan`

Fasa 1–6 menggunakan skema mudah ini. Fasa 8 akan menukarnya kepada skema
berstatus kelulusan; lihat `PLAN-ADDENDUM.md`.

### 4.6 `Kehadiran`

`id_peserta | hari1 | hari2 | hari3 | catatan`

Nilai hari: `Hadir`, `Tidak`, kosong (belum ditanda). Hanya peserta `Disahkan`
boleh ditanda.

### 4.7 `Log`

`masa | tindakan | butiran`

Log audit ringkas. Jangan simpan data peribadi penuh. Ditulis oleh
`logAction_()`.

---

## 5. API

### 5.1 Bentuk

- Satu URL: `https://script.google.com/macros/s/<ID>/exec`.
- GET: `?action=stats`.
- POST: `Content-Type: text/plain;charset=utf-8`, badan JSON.
- Setiap respons: `{ ok, data?, error?, code?, serverTime }`.
- `serverTime` ialah ISO 8601 `+08:00`, ditambah oleh `json_()`.
- Ralat: `{ ok:false, error:"mesej BM", code:"..." }`.

Kod ralat biasa:

| Kod | Maksud |
|---|---|
| `BAD_JSON` | Badan POST bukan JSON. |
| `UNAUTHORIZED` | Token tiada/salah. |
| `FORBIDDEN` | Peranan tidak dibenarkan. |
| `VALIDATION` | Medan tidak sah. |
| `NOT_FOUND` | ID tidak dijumpai. |
| `NOT_CONFIRMED` | Peserta belum Disahkan (kehadiran). |
| `CLOSED` | Pendaftaran ditutup. |
| `EXTERNAL_SOURCE` | Pendaftaran diurus melalui Sheet luar. |
| `BUSY` | Kunci pelayan sibuk. |
| `SETUP_REQUIRED` | Helaian belum disediakan. |
| `UNKNOWN_ACTION` | Action tidak dikenali. |

### 5.2 Tindakan awam

| Action | Kaedah | Keterangan |
|---|---|---|
| `stats` | GET | Kapasiti, bilangan status, baki slot, yuran, tarikh tutup, `serverTime`. Tiada data peribadi. |
| `register` | POST | Cipta pendaftaran online. |

`stats` mengembalikan data yang sama di peringkat atas **dan** dalam `data`
untuk keserasian. Medan: `kapasiti`, `disahkan`, `menunggu`, `senaraiTunggu`,
`batal`, `jumlahPendaftaran`, `bakiSlot`, `penuh`, `pendaftaranDibuka`,
`tarikhTutup`, `tarikhMula`, `tarikhTamat`, `yuran`, `umurMin`, `umurMax`,
`sumber`, `amaranSumber`, `whatsapp`.

### 5.3 Tindakan pentadbir

Semua memerlukan `ADMIN_TOKEN`.

| Kumpulan | Action |
|---|---|
| Pendaftaran | `list`, `updateRegistration`, `registration.createManual` |
| Tugasan | `tasks.list`, `tasks.upsert`, `tasks.delete` |
| Milestone | `milestones.list`, `milestones.upsert`, `milestones.delete` |
| Bajet | `budget.list`, `budget.upsert`, `budget.delete` |
| Tetapan | `settings.get`, `settings.set` |
| Seed | `seed` |
| Pangkalan data | `db.info`, `db.setup`, `db.backup` |
| Kehadiran | `attendance.list`, `attendance.mark` |

### 5.4 Tindakan fasilitator

`FASILITATOR_TOKEN` hanya boleh:

- `attendance.list`
- `attendance.mark`
- `facilitator.participants`

`facilitator.participants` hanya memulangkan peserta `Disahkan`, tanpa medan
bayaran.

### 5.5 Peranan

| Token | Peranan | Akses |
|---|---|---|
| `ADMIN_TOKEN` | `admin` | Semua tindakan. |
| `FASILITATOR_TOKEN` | `fasilitator` | Peserta Disahkan dan kehadiran sahaja. |
| Tiada | awam | `stats`, `register`. |

Token dibandingkan dengan masa malar (`constantTimeEqual_`). Token kosong
ditolak. Jika token fasilitator tidak ditetapkan, halaman fasilitator tidak
dapat log masuk.

> Fasa 7 akan menambah `VIEWER_TOKEN` (baca sahaja, telefon bertopeng). Itu
> belum wujud dalam kod semasa.

---

## 6. Aliran pendaftaran

```text
Borang awam
   |
   | 1. Semak medan di klien (format, persetujuan, umur)
   v
POST action=register
   |
   | 2. Honeypot `website` diisi?
   |       ya -> balas ok palsu, tidak simpan
   v
3. Pendaftaran dibuka? (tetapan + tarikh tutup)
   |       tidak -> CLOSED
   v
4. Sumber `sheet_luar`?
   |       ya -> EXTERNAL_SOURCE
   v
5. Validasi server (nama, umur, telefon, jantina, lancar_quran, persetujuan)
   v
6. LockService.getScriptLock().tryLock(10000)
   |       gagal -> BUSY
   v
7. Baca semula tetapan + senarai pendaftaran
8. Semak pendua: tel_penjaga + nama_peserta (lowercase, trim)
   |       pendua -> VALIDATION
9. Kira aktif = Disahkan + Menunggu
   |       aktif >= kapasiti -> status = Senarai Tunggu
   |       else -> status = Menunggu
10. Jana ID seterusnya, appendRow, log
11. Balas { id, status, yuran_rm, mesejBayaran, whatsapp, bakiSlot }
```

Nota:

- Kunci dilepaskan dalam `finally`.
- Kapasiti disemak **di dalam** kunci supaya dua pendaftaran serentak tidak
  melebihi 40.
- `register` tidak pernah memulangkan data peserta lain.
- `bakiSlot` selepas pendaftaran mengambil kira sama ada status baru
  `Menunggu` (mengisi slot) atau `Senarai Tunggu` (tidak mengisi slot).
- Pendaftaran manual (`registration.createManual`) menggunakan aliran yang
  sama, tetapi yuran manual RM120 dan status boleh dipilih; jika kapasiti
  penuh, status menjadi `Senarai Tunggu`.

---

## 7. Frontend

### 7.1 Halaman awam `web/index.html`

Bahagian:

1. Hero dengan logo, tajuk, slogan, tarikh, lokasi dan countdown.
2. Slot langsung: `Baki X daripada 40 slot`, bar kemajuan, dikemas kini
   setiap 30 saat dan pada `visibilitychange`.
3. Harga: RM180 dicoret, RM120, lencana online RM110.
4. Ringkasan program dan jadual.
5. Borang pendaftaran.
6. Skrin kejayaan: ID, status, yuran, arahan bayaran, pautan WhatsApp.
7. Soalan lazim dan footer.

`register.js`:

- Memuat `stats` dan menyegerakkan jam pelayan.
- Mengesahkan medan di klien untuk pengalaman pengguna; server tetap mengesahkan.
- Menghantar POST dan mengendalikan ralat BM.
- Menyembunyikan borang jika pendaftaran ditutup.
- Menggunakan `textContent` untuk semua teks pengguna.

### 7.2 Dashboard `web/admin.html`

Tab: **Dashboard**, **Daftar**, **Checklist**, **Milestone**, **Bajet**,
**Kehadiran**, **Data**, **Tetapan**.

- Log masuk token; token disimpan dalam `sessionStorage` sahaja.
- Setiap tindakan guna POST supaya token tidak muncul dalam URL.
- Dashboard: countdown program dan tarikh tutup, slot, kadar pendaftaran,
  kewangan, kemajuan checklist, tugasan lewat/hari ini/7 hari, milestone
  seterusnya, amaran.
- Daftar: jadual, tapisan, kemas kini status/bayaran, tambah manual, naik
  senarai tunggu, eksport CSV BOM, salin nombor, mesej WhatsApp.
- Checklist: CRUD, tapisan, status temporal.
- Milestone: garis masa, penanda hari ini, baki hari.
- Bajet: item, jumlah, baki, kategori.
- Kehadiran: peserta Disahkan, kotak Hari 1–3, kiraan.
- Data: `db.info`, `db.setup`, `db.backup`, muat turun JSON.
- Tetapan: kapasiti, yuran, umur, tarikh, buka/tutup, telefon, bayaran,
  sumber pendaftaran, ujian API.

### 7.3 Fasilitator `web/fasilitator.html`

- Token berasingan; tiada akses kewangan atau pendaftaran penuh.
- Hanya peserta `Disahkan`.
- Pilih Hari 1/2/3, carian, tapisan status.
- Butang `Hadir` / `Tidak` menyimpan terus ke `Kehadiran`.
- Kiraan hadir setiap hari.
- Alahan dipaparkan untuk keselamatan, bukan data bayaran.

### 7.4 Modul kongsi

| Fail | Tanggungjawab |
|---|---|
| `api.js` | `apiPost`, `isApiConfigured`, ralat `ApiError`. |
| `time.js` | Masa KL, offset pelayan, countdown, `formatRM`, `csvEscape`, WhatsApp. |
| `ui.js` | `h`, `clear`, `setText`, `show`, `toast`, `badge`, `debounce`, `downloadText`. |

`ui.h()` mencipta elemen dan menetapkan `textContent`, bukan `innerHTML`.
Teks dinamik tidak pernah dimasukkan sebagai HTML.

### 7.5 Masa

- `nowDate()` = `Date.now() + offset`.
- Offset dikira daripada `serverTime` setiap respons dan disegerakkan semula
  setiap 5 minit.
- `klDateKey()` menggunakan `Intl.DateTimeFormat` dengan
  `timeZone: 'Asia/Kuala_Lumpur'`.
- `daysBetweenKeys()` membandingkan hari kalendar, bukan milisaat mentah.
- Countdown mengira daripada masa mutlak setiap saat, bukan menolak 1.
- Selepas program bermula, paparan bertukar kepada `Hari X daripada 3` dan
  kemudian `Program tamat`.

---

## 8. Backend

### 8.1 Fail

`backend/Code.gs` mengandungi semua logik. `backend/appsscript.json`
menetapkan `timeZone: "Asia/Kuala_Lumpur"` dan deployment Web App.

### 8.2 Fungsi utama

| Fungsi | Tugas |
|---|---|
| `doGet(e)` / `doPost(e)` | Titik masuk; memanggil `handleRequest_`. |
| `handleRequest_(e, method)` | Router action, auth, JSON. |
| `setupSheets()` | Cipta helaian/pengepala yang hilang; tetapan lalai. |
| `seedData()` | Seed terbina dalam `Code.gs` jika helaian kosong. |
| `seedFromPayload_(db, seed)` | Seed daripada JSON frontend. |
| `statsPayload_(db)` | Statistik awam. |
| `registerPublic_(db, payload)` | Pendaftaran online. |
| `createManualRegistration_` | Pendaftaran manual admin. |
| `updateRegistration_` | Kemas kini status/bayaran/catatan. |
| `validateRegistration_` | Validasi medan. |
| `ensureNotDuplicate_` | Tolak pendua. |
| `markAttendance_` | Tanda kehadiran. |
| `facilitatorParticipants_` | Peserta Disahkan tanpa bayaran. |
| `settingsGet_` / `settingsSet_` | Tetapan. |
| `databaseInfo_` | Semak helaian/pengepala/duplikasi/yatim. |
| `backupDatabase_` | Salin Sheet ke Drive. |
| `requireRole_` / `roleForToken_` | Auth. |
| `logAction_` | Audit. |
| `safeCell_` | Neutralkan formula injection. |
| `normalizePhone_` | Normalkan telefon Malaysia. |
| `parseDate_` / `normalizeDateTime_` | Tarikh KL. |

### 8.3 Pengesahan dan keselamatan

- Nama: 2–80 aksara selepas `cleanText_`.
- Umur: integer dalam `umur_min`–`umur_max`.
- Telefon: normalkan kepada digit; mesti `01` + 8–9 digit.
- Jantina: `Lelaki` / `Perempuan`.
- `lancar_quran`: mesti `ya`.
- Persetujuan data: wajib untuk pendaftaran awam.
- Honeypot `website`: jika diisi, balas `ok:true` palsu dan jangan simpan.
- Formula injection: `safeCell_` menambah `'` jika sel bermula `=`, `+`, `-`,
  `@`, tab atau CR.
- XSS: semua output DOM melalui `textContent`.
- Token: Script Properties, perbandingan masa malar.
- Audit: `logAction_` menulis tindakan dan ringkasan, bukan data penuh.

### 8.4 Had GAS yang dihormati

- Baca `getDataRange().getValues()` sekali, bukan sel demi sel.
- Tulis dengan `appendRow` / `setValues`.
- Tiada `OPTIONS`; POST guna `text/plain`.
- Setiap perubahan kod mesti deploy versi baharu.
- `LockService` untuk operasi tulis kritikal.
- Elak operasi berat dalam satu permintaan; import besar akan dipecah pada
  Fasa 9.

---

## 9. MCP `mcp-ksq26/`

### 9.1 Transport

- Node 18+, stdio, JSON-RPC 2.0 baris demi baris.
- Tiada pakej npm.
- `initialize`, `ping`, `tools/list`, `tools/call`, `resources/list`,
  `resources/read`.
- Log ke stderr; respons protokol ke stdout.

### 9.2 Alat

13 alat: `ksq_stats`, `ksq_dashboard`, `ksq_list_registrations`,
`ksq_get_settings`, `ksq_list_tasks`, `ksq_set_task_status`,
`ksq_list_milestones`, `ksq_list_budget`, `ksq_financial_summary`,
`ksq_list_attendance`, `ksq_mark_attendance`,
`ksq_export_registrations_csv`, `ksq_db_info`.

Tulis hanya dua: status tugasan dan kehadiran. Tiada alat memadam
pendaftaran atau mengubah bayaran.

### 9.3 Sumber

- `ksq://program/facts`
- `ksq://finance/rules`
- `ksq://api/reference`
- `ksq://privacy/guide`

### 9.4 Privasi

- Telefon disamarkan secara lalai.
- Teks alahan hanya dengan `include_health_notes=true`; lalai boolean.
- Token dibaca daripada persekitaran, tidak pernah dipulangkan.
- Tiada cache.

---

## 10. Keselamatan dan privasi

| Aspek | Pelaksanaan |
|---|---|
| Token | `ADMIN_TOKEN` + `FASILITATOR_TOKEN` dalam Script Properties. |
| Sesi admin | `sessionStorage`; hilang apabila tab ditutup. |
| Endpoint awam | Tiada nama/telefon; hanya agregat. |
| Fasilitator | Hanya peserta Disahkan dan kehadiran. |
| XSS | `textContent`; tiada `innerHTML` untuk data pengguna. |
| Formula injection | `safeCell_` di server; `csvEscape` di klien. |
| CSV | UTF-8 BOM + CRLF. |
| Sheet | Tidak dikongsi secara awam; arahan dalam `PASANG-GAS.md`. |
| Log | Ringkasan sahaja; tiada data peribadi penuh. |
| Data kanak-kanak | Kumpul minimum; notis privasi pada borang. |

Had semasa:

- Tiada token baca sahaja lagi (Fasa 7).
- Tiada pengecilan/penyulitan; kod sumber boleh dibaca. Ini diterima kerana
  tiada rahsia dalam frontend.
- Kadar permintaan (rate limiting) bergantung pada GAS; bukan kawalan penuh.
- Sandaran Drive ialah salinan fail, bukan sandaran transaksi.

---

## 11. Ujian

| Fail | Skop |
|---|---|
| `tests/time.test.js` | Masa KL, sempadan tengah malam, lompat tahun, offset, countdown, RM, WhatsApp, CSV. |
| `tests/seed.test.js` | JSON seed, kategori, tarikh, bajet, formula, placeholder. |
| `tests/backend.test.js` | Sintaks `Code.gs`, action, peranan, lock, token, BOM, tiada XSS, id DOM, serve.js. |
| `tests/api-smoke.js` | Ujian baca sahaja terhadap deployment sebenar (pemilik). |
| `mcp-ksq26/test/*.test.js` | Kewangan, alat MCP, JSON-RPC, sumber, URL. |

Jalankan:

```powershell
# Jalankan dari akar projek (folder yang mengandungi package.json)
npm test
npm run test:mcp
```

Ujian tidak memanggil API sebenar. `api-smoke.js` memerlukan
`KSQ_API_URL` dan token, dan hanya membaca.

---

## 12. Pemasangan dan operasi

### 12.1 Pratonton setempat

```powershell
# Dari akar projek (folder yang mengandungi serve.js)
node serve.js
```

Atau klik `BUKA-DASHBOARD.bat`. URL:

- `http://127.0.0.1:8080/index.html`
- `http://127.0.0.1:8080/admin.html`
- `http://127.0.0.1:8080/fasilitator.html`

Tanpa `API_URL` sebenar, halaman memaparkan mesej sambungan. Untuk data palsu,
gunakan alat pembangunan pelayar atau jalankan ujian Node.

### 12.2 Deployment

1. Google Sheet + Apps Script.
2. `setupSheets`, `seedData`.
3. Script Properties: `ADMIN_TOKEN`, pilihan `FASILITATOR_TOKEN`.
4. Deploy Web App: Execute as Me, Anyone.
5. Tampal URL `/exec` ke `web/config.js`.
6. Hoskan folder `web/` di GitHub Pages.
7. Uji `?action=stats`.

Butiran penuh: `README.md` dan `backend/PASANG-GAS.md`.

### 12.3 Operasi

- Semak `Log` jika ada tindakan mencurigakan.
- Sandaran Sheet setiap minggu atau selepas perubahan besar.
- Setiap perubahan `Code.gs`: Deploy versi baharu.
- Jangan sebarkan `admin.html` atau `fasilitator.html` di WhatsApp umum.

---

## 13. Had dan kerja masa depan

Belum dilaksanakan:

- Fasa 7: organisasi, fasilitator, pembekal, `VIEWER_TOKEN`.
- Fasa 8: bajet berstatus, dana, merchandise, amaran risiko.
- Fasa 9: sijil, tag, surat, import CSV.
- Fasa 10: pipeline, laporan akhir, ujian beban.
- Fasa 11–13 (arahan lawatan/makanan/bas): panel Belum Disahkan, halaman
  Lawatan, Makanan, Bas, jadual Hari 3 bergantung.

Lihat `PLAN-ADDENDUM.md` dan `ARAHAN-LAWATAN-MAKANAN-BAS.md`. Jangan mula
menulis kod Fasa 7 sebelum pemilik meluluskan pelan.

---

## 14. Keputusan reka bentuk dan sebab

| Keputusan | Sebab |
|---|---|
| GAS + Sheets | Tiada kos pelayan, pemilik bukan pengaturcara, data mudah disandarkan. |
| Tiada framework | Boleh dihoskan statik, tiada build, mudah diselenggara. |
| `textContent` | Mengelakkan XSS tanpa sanitizer pihak ketiga. |
| Token dalam `sessionStorage` | Kurang terdedah daripada `localStorage`; hilang bila tab ditutup. |
| POST untuk admin | Token tidak muncul dalam URL/log pelayar. |
| LockService | Menghalang lebih 40 peserta akibat perlumbaan. |
| Honeypot | Bot mudah tertipu tanpa CAPTCHA. |
| CSV BOM | Excel Windows memaparkan huruf Melayu dengan betul. |
| MCP tanpa npm | Mudah diaudit, tiada rantaian kebergantungan. |
| `serve.js` | ES modules gagal dari `file://`; pemilik perlu satu klik. |
| Dua token | Fasilitator tidak sepatutnya melihat kewangan. |
