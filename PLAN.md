# PLAN.md — Sistem Pengurusan Kem Sahabat Quran (KSQ) 2026

> Dokumen ini menerangkan pemahaman, keputusan reka bentuk, senarai fail dan
> soalan yang perlu disahkan pemilik. Ia disediakan pada Fasa 0 dan dikemas kini
> selepas Fasa 1–6 siap.

## 1. Ringkasan pemahaman

Sistem ini mengurus program **Kem Sahabat Quran (KSQ) 2026** anjuran Masjid
Kampung Sungai Lang Baru, Banting:

- **14–16 Disember 2026** (Isnin–Rabu), 8:00 pagi–5:00 petang, tidak bermalam.
- Hari 1 & 2 di masjid; Hari 3 lawatan Shah Alam menaiki bas.
- Kapasiti **40 peserta**, remaja 10 tahun ke atas yang lancar membaca Al-Quran.
- Yuran: asal RM180, promosi RM120, online RM110.
- Sasaran hafazan: Al-Mulk, Al-Kahfi, As-Sajdah, Al-Insan.
- Lawatan: Yayasan Restu, Muzium Sultan Alam Shah, Masjid Negeri Shah Alam.
- Semua masa dikira dalam **Asia/Kuala_Lumpur (UTC+8)**.

Sistem terdiri daripada:

1. **Halaman awam** (`web/index.html`) — maklumat program, kuota langsung,
   countdown, borang pendaftaran, skrin kejayaan dan arahan bayaran.
2. **Dashboard pentadbir** (`web/admin.html`) — token log masuk, dashboard masa
   nyata, pendaftaran, checklist, milestone, bajet, kehadiran, pengurusan
   pangkalan data dan tetapan.
3. **Halaman fasilitator** (`web/fasilitator.html`) — token berasingan, senarai
   peserta yang disahkan dan kehadiran. Ini sambungan atas permintaan pemilik
   tanpa membuka data kewangan kepada fasilitator.
4. **Backend Google Apps Script** (`backend/Code.gs`) + **Google Sheets**
   sebagai satu-satunya pangkalan data.
5. **Alat MCP** (`mcp-ksq26/`) — pelayan Model Context Protocol tanpa
   kebergantungan npm, untuk rujukan program dan operasi sistem melalui
   AI/terminal.
6. **Ujian Node** (`tests/` dan `mcp-ksq26/test/`) — masa, data awal, kontrak
   backend, alat MCP, protokol JSON-RPC dan smoke test API.

## 2. Keputusan reka bentuk

| Perkara | Keputusan | Sebab |
|---|---|---|
| Frontend | HTML + CSS + ES modules, tiada build step | Boleh terus dihoskan di GitHub Pages |
| Backend | Satu `Code.gs`, Web App GAS | Tiada pelayan lain; pemilik bukan pengaturcara |
| Pangkalan data | 7 helaian Google Sheets | Mengikut arahan projek |
| ID pendaftaran | `KSQ26-0001`, bertambah mengikut urutan | Mudah dibaca dan disebut melalui WhatsApp |
| Umur | Lalai 10–18, boleh ubah dalam Tetapan | Poster menyebut "10 tahun ke atas"; had atas perlu disahkan |
| Token | `ADMIN_TOKEN` + `FASILITATOR_TOKEN` dalam Script Properties | Tiada rahsia dalam repo |
| Fasilitator | Token berasingan, akses hanya peserta/kehadiran | Data kewangan kekal dengan pentadbir |
| Sheet luar | Pilihan `sumber_pendaftaran=sheet_luar` | Untuk sambung ke Sheet/Form sedia ada |
| Masa | Offset `serverTime` disegerak setiap respons API dan setiap 5 minit | Jam peranti tidak boleh dipercayai |
| Data awal | `web/data/seed-tasks.json` + salinan terbina dalam `Code.gs` | Pemilik boleh jalankan `seedData()` tanpa frontend |
| MCP | Node stdio JSON-RPC, tiada pakej npm, 13 alat | Selamat, mudah dijalankan, tiada build |
| OG image | `web/assets/og-ksq.jpg` (1200×630) | Pratonton WhatsApp yang kemas |
| Pratonton setempat | `serve.js` tanpa kebergantungan | ES modules gagal dari `file://` |

## 3. Senarai fail yang dibina

```text
ksq-sistem/
  AGENTS.md                  arahan projek (asal + lampiran status)
  ARAHAN-TAMBAHAN-FASA7-10.md addendum pengurusan/kewangan
  ARCHITECTURE.md            seni bina, aliran data, kontrak API, MCP
  PLAN.md                    dokumen ini
  PLAN-ADDENDUM.md           pelan Fasa 7–10 (belum dilaksana)
  CHANGELOG.md               rekod perubahan setiap fasa
  TODO-PEMILIK.md            placeholder dan keputusan yang perlu diisi
  README.md                  pemasangan lengkap untuk bukan pengaturcara
  package.json               skrip ujian/pratonton (tiada kebergantungan)
  serve.js                   pelayan statik setempat
  BUKA-DASHBOARD.bat         pembuka pratonton Windows
  docs/                      dokumen asal (tidak diubah)
  assets/                    logo.png, masjid-udara.jpg (diekstrak dari poster)
  backend/
    Code.gs
    appsscript.json
    PASANG-GAS.md
  web/
    index.html
    admin.html
    fasilitator.html
    config.js
    css/style.css
    js/api.js  time.js  register.js  admin.js  facilitator.js  ui.js
    data/seed-tasks.json  seed-tugasan-lanjutan.json  seed-bajet.json
         seed-fasilitator.json  seed-jawatankuasa.json
         peserta-import-templat.csv
    templates/sijil.html  tag-nama.html
    assets/logo.png  masjid-udara.jpg  og-ksq.jpg
  tests/
    time.test.js
    seed.test.js
    backend.test.js
    api-smoke.js
  mcp-ksq26/
    README.md
    package.json
    .env.example
    server.js
    lib/api-client.js  tools.js  finance.js  resources.js
    resources/program-facts.json  finance-rules.md  api-reference.md  privacy.md
    test/finance.test.js  tools.test.js  server.test.js
```

## 4. Fasa pelaksanaan

| Fasa | Skop | Status |
|---|---|---|
| 0 | Baca dokumen, PLAN.md, TODO-PEMILIK.md | Selesai |
| 1 | Backend GAS, helaian, API, ujian smoke | Selesai |
| 2 | Halaman awam, borang, countdown | Selesai |
| 3 | Dashboard admin, log masuk, amaran | Selesai |
| 4 | Checklist, deadline, milestone | Selesai |
| 5 | Pengurusan pendaftaran, CSV, WhatsApp, Sheet luar | Selesai |
| 6 | Bajet, kehadiran, tetapan, README, ARCHITECTURE | Selesai |
| — | Halaman fasilitator (sambungan pengguna) | Selesai |
| — | MCP `mcp-ksq26/` dan ujiannya | Selesai |
| 7 | Organisasi, fasilitator, pembekal, `VIEWER_TOKEN` | **Belum** — pelan sahaja |
| 8 | Kewangan penuh, dana, merchandise | **Belum** — pelan sahaja |
| 9 | Sijil, tag, surat, import CSV | **Belum** — pelan sahaja |
| 10 | Pipeline, laporan, ujian beban | **Belum** — pelan sahaja |
| 11–13 | Lawatan, makanan/bas, jadual Hari 3 | **Belum** — arahan sahaja |

> Nota: atas permintaan pemilik, Fasa 1–6 dilaksanakan dalam satu sesi. Setiap
> fasa tetap diuji dan direkod dalam `CHANGELOG.md`. Fasa 7–10 memerlukan
> kelulusan `PLAN-ADDENDUM.md` sebelum sebarang kod ditulis.

Status ujian semasa dokumen ini dikemas kini:

- Ujian projek: **41 lulus** (`node --test "tests/*.test.js"`).
- Ujian MCP: **38 lulus** (`cd mcp-ksq26; node --test "test/*.test.js"`).
- Ujian API sebenar belum dijalankan kerana deployment GAS pemilik belum wujud.

## 5. Soalan dan andaian yang perlu disahkan pemilik

1. **Umur maksimum**: sistem menggunakan 10–18 tahun secara lalai kerana poster
   hanya menyebut "10 tahun ke atas". Boleh ubah di **Tetapan → Umur
   minimum/maksimum**.
2. **Format ID**: `KSQ26-0001`. Jika pemilik mahu format lain, beritahu sebelum
   data sebenar dimasukkan.
3. **Pelancaran 18 November 2026**: dokumen kertas kerja menyebut "menurut nota
   draf — sila sahkan". Sistem tidak menganggap tarikh ini sebagai tarikh mula
   pendaftaran; pendaftaran dibuka apabila tetapan `pendaftaran_dibuka=true`.
4. **No. telefon urus setia dan butiran bayaran**: belum ada dalam dokumen.
   Placeholder `[ISI ...]` digunakan dan disenaraikan dalam `TODO-PEMILIK.md`.
5. **Harga tiket muzium, yuran Yayasan Restu, katering dan elaun fasilitator**:
   angka dalam bajet ialah draf dan perlu disahkan dengan pihak
   berkenaan/bendahari.
6. **Sumber pendaftaran**: lalai `sistem`. Jika pemilik sudah menggunakan Google
   Form atau Sheet lain, tukar ke `sheet_luar` dan tampal pautan Sheet di
   Tetapan.
7. **Token fasilitator**: pilihan. Jika tidak ditetapkan dalam Script
   Properties, halaman fasilitator memaparkan mesej bahawa akses belum
   diaktifkan.
8. **MCP**: memerlukan `KSQ_API_URL` dan `KSQ_ADMIN_TOKEN` dalam persekitaran
   pelayan MCP. Token tidak dimasukkan ke dalam repo.
9. **Fasa 7–10**: lihat soalan lengkap dalam `PLAN-ADDENDUM.md` Bahagian 11.
10. **Lawatan, makanan dan bas**: lihat `ARAHAN-LAWATAN-MAKANAN-BAS.md` dan
    `TODO-PEMILIK.md` Bahagian E.

## 6. Kriteria siap Fasa 1–6

Kriteria dalam Bahagian 10 `AGENTS.md` dipenuhi melalui:

- Ujian masa KL (`tests/time.test.js`) termasuk sempadan tengah malam, offset
  jam salah, lompat tahun dan status `Lewat`.
- Ujian data awal dan formula bajet (`tests/seed.test.js`).
- Ujian kontrak backend dan keselamatan statik (`tests/backend.test.js`).
- Ujian alat MCP dan protokol JSON-RPC (`mcp-ksq26/test/`).
- Semakan manual halaman awam, admin dan fasilitator pada lebar telefon.

Yang masih memerlukan tindakan pemilik:

- Deployment GAS sebenar dan ujian `tests/api-smoke.js`.
- Ujian halaman pada peranti sebenar selepas `API_URL` diisi.
- Pengesahan semua placeholder dan keputusan dalam `TODO-PEMILIK.md`.
