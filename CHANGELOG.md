# CHANGELOG — Sistem KSQ 2026

Format ringkas: tarikh, fasa, perubahan utama. Semua tarikh pembangunan dalam
November 2026.

## 2026-11-15 — Fasa 0: Perancangan
- Membaca `ARAHAN-OPENCODE-KSQ.md`, Kertas Kerja, Itinerari Lawatan dan Modul
  Program.
- Menyalin dokumen asal ke `docs/` (tidak diubah).
- Mengekstrak `logo.png` dan `masjid-udara.jpg` daripada poster untuk `assets/`.
- Menulis `PLAN.md` dan `TODO-PEMILIK.md`.
- Keputusan: ID `KSQ26-0001`, umur lalai 10–18, token fasilitator berasingan,
  MCP tanpa kebergantungan npm.

## 2026-11-15 — Fasa 1: Backend
- `backend/Code.gs`: `setupSheets`, `seedData`, `doGet`, `doPost`, pengesahan,
  `LockService`, token admin/fasilitator, kunci pendaftaran, honeypot, pendua,
  senarai tunggu, audit log, mod Sheet luar, sandaran Drive.
- `backend/appsscript.json` dengan zon masa `Asia/Kuala_Lumpur`.
- `backend/PASANG-GAS.md`.
- `tests/api-smoke.js`, `tests/backend.test.js`.

## 2026-11-15 — Fasa 2: Halaman awam
- `web/index.html`, `web/css/style.css`, `web/js/register.js`, `api.js`,
  `time.js`, `ui.js`.
- Countdown program dan tarikh tutup; kuota langsung setiap 30 saat dan pada
  `visibilitychange`.
- Borang pendaftaran dengan pengesahan sisi klien, skrin kejayaan, arahan
  bayaran dan pautan WhatsApp.
- OG image `web/assets/og-ksq.jpg` (1200×630).

## 2026-11-15 — Fasa 3: Dashboard admin
- `web/admin.html`, log masuk token (`sessionStorage`), dashboard masa nyata.
- Kad countdown program/tutup, slot, kadar harian, kewangan, checklist dan
  amaran.

## 2026-11-15 — Fasa 4: Checklist dan milestone
- CRUD tugasan, status automatik (`Lewat`/`Hari ini`/`Akan datang`/`Selesai`),
  tapisan.
- Garis masa milestone dengan penanda hari ini dan baki hari.

## 2026-11-15 — Fasa 5: Pengurusan pendaftaran
- Jadual pendaftaran, tapisan/carian, kemas kini status dan bayaran.
- Tambah pendaftaran manual, naik senarai tunggu, eksport CSV (UTF-8 BOM),
  salin nombor, penjana mesej WhatsApp.
- Sokongan mod Sheet luar di backend dan Tetapan.

## 2026-11-15 — Fasa 6: Bajet, kehadiran, tetapan, kemasan
- Bajet berkumpulan, kehadiran 3 hari, tetapan lengkap, ujian sambungan.
- Pengurusan pangkalan data: info helaian, semak integriti, sandaran Drive,
  muat turun JSON.
- `README.md`, `ARCHITECTURE.md`, kemas kini `TODO-PEMILIK.md`.
- Ujian masa, seed dan kontrak backend; semakan sintaks semua JS.
- `serve.js` dan `BUKA-DASHBOARD.bat` untuk pratonton setempat tanpa
  kebergantungan.

## 2026-11-15 — Sambungan: halaman fasilitator
- `web/fasilitator.html` dan `web/js/facilitator.js`.
- Token fasilitator berasingan; hanya peserta `Disahkan`, kehadiran dan alahan.
- Tiada akses kewangan, bajet atau senarai pendaftaran penuh.
- Gaya responsif untuk telefon.

## 2026-11-15 — Sambungan: MCP `mcp-ksq26/`
- Pelayan MCP stdio JSON-RPC tanpa pakej npm.
- 13 alat: statistik, dashboard, pendaftaran, tetapan, tugasan, milestone,
  bajet, ringkasan kewangan, kehadiran, eksport CSV dan maklumat pangkalan data.
- Hanya dua alat menulis: status tugasan dan kehadiran.
- Empat sumber rujukan: fakta program, peraturan kewangan, rujukan API dan
  privasi.
- Telefon disamarkan secara lalai; teks alahan hanya dengan kebenaran eksplisit.
- Ujian `mcp-ksq26/test/`: kewangan, alat, JSON-RPC, sumber dan validasi URL.

## 2026-11-15 — Pembetulan pepijat
- `web/js/time.js`: `formatKlTime` tidak lagi memasukkan tarikh, dan
  `formatKlDateShort` tidak lagi memasukkan tahun. Pembetulan ini mengelakkan
  label tarikh bertindih pada kad dashboard.
- `web/css/style.css`: tambah pemboleh ubah `--crimson` dan `--ink` yang
  digunakan oleh lencana dan teks, serta gaya kawalan kehadiran fasilitator.
- `web/css/style.css`: butang navigasi admin/fasilitator dinaikkan kepada
  `min-height: 44px` supaya memenuhi sasaran sentuh mudah alih 44px.
- `backend/Code.gs`: betulkan ejaan `settings.disikaun_online` →
  `settings.diskaun_online` pada dua tempat. Sebelum ini diskaun online sentiasa
  menggunakan nilai lalai RM10 walaupun tetapan diubah.
- `mcp-ksq26/lib/finance.js`: `number()` kini memulangkan nilai fallback untuk
  `null`, `undefined` dan string kosong.
- `mcp-ksq26/lib/tools.js`: medan `alahan_kesihatan` tidak lagi muncul sebagai
  `undefined` apabila tidak diminta.
- Ujian regresi ditambah untuk ejaan `diskaun_online`, pemformatan masa,
  penyamaran telefon dan nilai nombor.

## 2026-11-15 — Dokumen pengurusan dan operasi
- `PLAN-ADDENDUM.md`: pelan Fasa 7–10 (skema, migrasi, `VIEWER_TOKEN`,
  kewangan, merchandise, sijil, laporan, ujian). **Tiada kod Fasa 7–10
  ditulis.**
- `ARAHAN-LAWATAN-MAKANAN-BAS.md` (folder induk): arahan lawatan, menu, kos
  makanan dan bas untuk Fasa 11–13. Hari 3 hanya roti krim; Hari 1–2
  RM4 + RM7 + RM4 seorang.
- `README.md` lengkap untuk pemasangan GAS, GitHub Pages, admin, fasilitator,
  MCP, ujian dan penyelesaian masalah.
- `TODO-PEMILIK.md` ditulis semula dalam UTF-8 bersih dengan semua placeholder,
  keputusan lawatan/makanan/bas dan soalan Fasa 7–10.

## 2026-11-15 — Tarikh program 14–16 Disember 2026
- Tarikh program ditukar daripada 16–18 Disember (Rabu–Jumaat) kepada
  **14–16 Disember 2026 (Isnin–Rabu)**: Hari 1 Isnin 14 Dis, Hari 2 Selasa
  15 Dis, Hari 3 Rabu 16 Dis.
- `tarikh_mula` menjadi `2026-12-14T08:00:00+08:00` dan `tarikh_tamat`
  `2026-12-16T17:00:00+08:00` dalam `Code.gs`, `admin.js`, `register.js`,
  `facilitator.js`, `program-facts.json`, `ARCHITECTURE.md`, `AGENTS.md`.
- Hari 3 kini hari **Rabu**, jadi rujukan solat Jumaat ditukar kepada solat
  Zohor berjemaah dalam `index.html`, `seed-tasks.json`, `Code.gs`,
  `templat-surat.md`, `TODO-PEMILIK.md` dan `AGENTS.md`.
- Milestone berkaitan digeser dua hari: taklimat ibu bapa 12 Dis, persiapan
  masjid 13 Dis, laporan 18 Dis. Deadline tugasan yang bergantung pada hari
  program turut diselaraskan.
- `web/data/seed-tasks.json` dan `web/data/seed-tugasan-lanjutan.json`
  dikemas kini (termasuk L16, L22, L33, L36, L37).
- Ujian: 41 projek + 38 MCP masih lulus.

## 2026-11-15 — Menu dropdown navbar
- `web/index.html`: pautan Program, Jadual, Soalan dan Daftar dimasukkan ke
  dalam butang **Menu** (`<details>`), butang emas **Daftar** dikekalkan.
- `web/css/style.css`: gaya `.nav-dropdown`, `.nav-toggle`, `.nav-caret`,
  `.nav-menu`, `.nav-menu-item` (panel ivory, item 44px, fokus jelas).
- `web/js/nav.js`: tutup menu apabila klik di luar, tekan Escape, pilih pautan
  atau menatal. Menu tetap berfungsi tanpa JavaScript kerana guna `<details>`.

## 2026-11-15 — Pembetulan kad fakta halaman awam
- `web/css/style.css`: `.fact` direka untuk latar gelap (teks ivory
  `#fffdf6` atas latar krim) menyebabkan teks "Kapasiti / Syarat / Konsep /
  Yuran" hampir tidak kelihatan pada halaman awam.
- `.fact` sekarang guna kad ivory + sempadan `--line` + aksen atas emas.
- `.fact b` → `--forest`, saiz 0.76rem, berat 800.
- `.fact span` → `#111111`, saiz 1rem (dari 0.88rem), berat 600,
  `display: block`.
- `display: block` pada `span` juga memastikan nilai tidak bercantum dengan
  label (dulu boleh terbaca sebagai "Kapasiti40 peserta sahaja").
- Disahkan dengan Chrome headless pada 1000px (2 lajur) dan 1300px (4 lajur),
  kemudian diterbitkan semula ke GitHub Pages dan hash CSS disahkan sama.

## 2026-11-15 — Semakan laluan fail (pindah laptop)
- Membuang laluan mutlak lama `C:\Users\rafee\Downloads\KSQ26\ksq-sistem`
  daripada `ARCHITECTURE.md`, `README.md` dan `mcp-ksq26/README.md`.
  Arahan ujian dan pratonton kini guna `npm test`, `npm run test:mcp` dan
  `node serve.js` dari akar projek.
- `mcp-ksq26/README.md`: contoh konfigurasi MCP dikemas kini kepada laluan
  semasa `C:\Users\i7\Downloads\Projek Automation\KSQ26\ksq-sistem`.
- `tests/seed.test.js`, `tests/time.test.js`, `tests/backend.test.js`: laluan
  fail dikira daripada `import.meta.url`, bukan `process.cwd()`, jadi ujian
  lulus walaupun dijalankan dari folder lain.
- Disahkan: tiada laluan cakera keras dalam `backend/`, `web/`, `serve.js`,
  `mcp-ksq26/lib/` atau `BUKA-DASHBOARD.bat`. `serve.js` dan `resources.js`
  sudah guna `__dirname` (portabel); `.bat` guna `%~dp0`.
- Ujian: 41 projek + 38 MCP lulus, termasuk bila dijalankan dari `C:\`.

## 2026-11-15 — Penerbitan GitHub Pages
- Menerbitkan kandungan `web/` ke repo
  `pengurusanemediamasjidkampungs-dotcom/kem-sahabat-quran-2026` (akar repo,
  branch `main`).
- `sgr03_data.json` (265 KB, waktu solat Selangor) tidak dimuat naik kerana
  tidak dirujuk oleh mana-mana kod.
- `config.js`: `SITE_URL` diisi dengan URL Pages sebenar.
- `index.html`: `og:image` diisi dengan URL penuh `assets/og-ksq.jpg`.
- Laman hidup di
  `https://pengurusanemediamasjidkampungs-dotcom.github.io/kem-sahabat-quran-2026/`;
  `index.html`, `config.js`, `css/`, `js/`, `assets/`, `admin.html` dan
  `fasilitator.html` disahkan `200`.
- **Belum berfungsi sepenuhnya:** `API_URL` masih placeholder, jadi borang
  peserta memaparkan "Pendaftaran online belum dibuka" sehingga deployment GAS
  dibuat oleh pemilik.

## Status ujian

- Ujian projek: **41 lulus**.
- Ujian MCP: **38 lulus**.
- Ujian pelayar (Chrome headless + CDP, API palsu): **36/36 lulus** —
  log masuk admin dan token salah, nilai dashboard dan kewangan, label masa,
  amaran, milestone, kemajuan checklist, lapan tab admin, carian pendaftaran,
  tab Data, simpan Tetapan dan Uji API, log masuk fasilitator, kiraan kehadiran,
  paparan alahan tanpa kewangan, muatan Hadir/Tidak, pengira slot awam,
  ketiadaan limpahan mendatar pada 390×844 dan tiada ralat JavaScript.
- Ujian API sebenar: belum dijalankan; memerlukan deployment GAS pemilik.

## Belum dilaksanakan

- Fasa 7–10: organisasi, fasilitator, pembekal, `VIEWER_TOKEN`, kewangan penuh,
  dana, merchandise, sijil, tag, surat, import CSV, pipeline dan laporan.
- Fasa 11–13: panel lawatan, halaman makanan, halaman bas dan jadual Hari 3
  bergantung.
- Semua perkara di atas memerlukan kelulusan pemilik dan jawapan kepada soalan
  dalam `PLAN-ADDENDUM.md` / `ARAHAN-LAWATAN-MAKANAN-BAS.md`.
