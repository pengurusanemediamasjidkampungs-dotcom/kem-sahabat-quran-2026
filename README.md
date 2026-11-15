# Sistem Pengurusan Kem Sahabat Quran (KSQ) 2026

Sistem untuk mengurus pendaftaran, checklist, milestone, bajet, kehadiran dan
tetapan program **Kem Sahabat Quran 2026** anjuran Masjid Kampung Sungai Lang
Baru, Banting.

- Halaman awam untuk ibu bapa: maklumat program, baki slot, borang pendaftaran,
  dengan pilihan bahasa **BM / ENG / AR**.
- Dashboard pentadbir: semua modul pengurusan.
- Halaman fasilitator: senarai peserta dan kehadiran sahaja.
- Backend Google Apps Script + Google Sheets.
- Alat MCP pilihan untuk klien AI/terminal.

> **Status:** Fasa 1–6 siap dan diuji. Fasa 7–10 (organisasi, kewangan penuh,
> sijil, laporan) **belum dibina**; pelannya ada dalam `PLAN-ADDENDUM.md` dan
> menunggu kelulusan pemilik. Arahan lawatan/makanan/bas (Fasa 11–13) juga
> belum dibina; lihat `ARAHAN-LAWATAN-MAKANAN-BAS.md` di folder induk.

---

## 1. Apa yang anda perlukan

| Perkara | Catatan |
|---|---|
| Akaun Google | Pemilik Google Sheet dan Web App. |
| Node.js 18+ | Hanya untuk pratonton setempat dan ujian. Muat turun dari <https://nodejs.org>. |
| Akaun GitHub | Pilihan, untuk hoskan halaman awam di GitHub Pages. |
| Pelayar moden | Chrome, Edge, Firefox atau Safari. |

Anda **tidak** perlu memasang pakej npm. Tiada build step, tiada pangkalan data
selain Google Sheets.

---

## 2. Cuba pratonton setempat (5 minit)

Pratonton setempat berguna untuk melihat rupa halaman sebelum memasang backend.
Data sebenar tidak akan muncul sehingga `API_URL` diisi.

1. Buka PowerShell dalam folder `ksq-sistem`.
2. Jalankan:

```powershell
node serve.js
```

Atau klik dua kali `BUKA-DASHBOARD.bat`.

3. Pelayar akan membuka `http://127.0.0.1:8080/admin.html`. Halaman lain:

- Awam: <http://127.0.0.1:8080/index.html>
- Fasilitator: <http://127.0.0.1:8080/fasilitator.html>

4. Tekan `Ctrl+C` dalam PowerShell untuk hentikan pelayan.

> Jangan buka `index.html` terus melalui `file://`. Modul JavaScript tidak
> dimuat dari `file://`, jadi halaman akan kosong. Gunakan `serve.js` atau
> hosting sebenar.

Jika port 8080 sedang digunakan:

```powershell
node serve.js --port 3000
```

---

## 3. Pasang backend Google Apps Script

Ikut panduan bergambar langkah demi langkah dalam
[`backend/PASANG-GAS.md`](backend/PASANG-GAS.md). Ringkasannya:

1. Cipta Google Sheet bernama **KSQ 2026 - Pangkalan Data**.
2. Buka **Extensions → Apps Script**.
3. Tampal semua kandungan `backend/Code.gs`.
4. Tampal `backend/appsscript.json` melalui **Project Settings → Show
   appsscript.json manifest file**.
5. Dalam **Script Properties**, tambah:
   - `ADMIN_TOKEN` — teks rawak sekurang-kurangnya 24 aksara.
   - `FASILITATOR_TOKEN` — pilihan, untuk halaman fasilitator.
6. Jalankan fungsi `setupSheets`, kemudian `seedData`.
7. **Deploy → New deployment → Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
8. Salin URL yang berakhir dengan `/exec`.

Uji di pelayar:

```text
https://script.google.com/macros/s/XXXX/exec?action=stats
```

Anda sepatutnya melihat JSON dengan `"ok": true`.

> **Penting:** Setiap kali `Code.gs` diubah, buat **Deploy → Manage deployments
> → Edit → Version: New version → Deploy**. URL kekal sama, tetapi kod lama
> tidak akan berubah tanpa versi baharu.

---

## 4. Sambungkan frontend kepada backend

Buka `web/config.js` dan ganti placeholder:

```js
export const CONFIG = {
  API_URL: 'https://script.google.com/macros/s/XXXX/exec',
  SITE_URL: 'https://nama-pengguna.github.io/nama-repo/',
  PROGRAM_NAME: 'Kem Sahabat Quran 2026',
  ORGANISER: 'Masjid Kampung Sungai Lang Baru, Banting'
};
```

Jangan letak token dalam fail ini. `config.js` ialah fail awam.

Kemudian isi tetapan program dalam **admin → Tetapan**:

- Nombor telefon urus setia.
- Butiran bayaran (contoh: nama akaun dan nombor akaun masjid).
- Kapasiti, yuran, umur minimum/maksimum, tarikh tutup pendaftaran.
- Buka/tutup pendaftaran.

Selepas itu, jalankan **Uji API** dalam tab Tetapan.

---

## 5. Hoskan halaman awam di GitHub Pages

1. Cipta repositori GitHub, contohnya `ksq-2026`.
2. Muat naik **kandungan** folder `web/` ke akar repositori. Pastikan
   `index.html` berada di akar repo, bukan dalam subfolder `web/`.
3. Buka **Settings → Pages**.
4. Pilih **Deploy from a branch**, branch `main`, folder `/ (root)`.
5. Tunggu 1–2 minit. URL anda:

```text
https://<pengguna>.github.io/<repo>/
```

6. Kemas kini:
   - `SITE_URL` dalam `web/config.js`.
   - `og:image` dalam `web/index.html` kepada URL penuh
     `https://<pengguna>.github.io/<repo>/assets/og-ksq.jpg`.

Pautan yang disebar di WhatsApp ialah pautan awam sahaja. **Jangan sebar**
pautan `admin.html` atau `fasilitator.html`.

> GitHub Pages hanya menghoskan fail statik. Semua data kekal dalam Google
> Sheets melalui Web App GAS.

---

## 6. Guna dashboard pentadbir

Buka `admin.html`, masukkan `ADMIN_TOKEN`. Token disimpan dalam
`sessionStorage` dan hilang apabila tab ditutup.

| Tab | Kegunaan |
|---|---|
| **Dashboard** | Countdown program dan tarikh tutup, slot, kadar pendaftaran, kewangan, kemajuan checklist, tugasan lewat/hari ini, milestone, amaran. |
| **Daftar** | Cari/tapis pendaftaran, tukar status dan bayaran, tambah pendaftaran manual, naik senarai tunggu, eksport CSV, salin nombor, jana mesej WhatsApp. |
| **Checklist** | Tambah/edit/padam tugasan, PIC, deadline, status, tapisan. |
| **Milestone** | Garis masa dan baki hari. |
| **Bajet** | Item anggaran vs sebenar, jumlah dan baki. |
| **Kehadiran** | Tanda Hari 1–3 untuk peserta Disahkan. |
| **Data** | Semak helaian, integriti, sandaran ke Drive, muat turun JSON. |
| **Tetapan** | Kapasiti, yuran, umur, tarikh, telefon, bayaran, sumber pendaftaran, ujian API. |

Peserta yang mendaftar online bermula sebagai `Menunggu` sehingga bayaran
disahkan. Jika kapasiti penuh, pendaftar baharu masuk `Senarai Tunggu`.

---

## 7. Guna halaman fasilitator

1. Tetapkan `FASILITATOR_TOKEN` dalam Script Properties.
2. Buka `fasilitator.html` dan masukkan token itu.
3. Fasilitator hanya melihat peserta `Disahkan`, alahan kesihatan dan kehadiran
   Hari 1–3. Tiada data bayaran, bajet atau tetapan.

Jika `FASILITATOR_TOKEN` tidak ditetapkan, halaman memaparkan mesej bahawa akses
belum diaktifkan.

---

## 8. Alat MCP (pilihan)

Folder `mcp-ksq26/` mengandungi pelayan Model Context Protocol tanpa pakej npm.
Ia membolehkan klien AI membaca statistik, pendaftaran, tugasan, bajet dan
kehadiran, serta menukar status tugasan dan menanda kehadiran.

Panduan penuh: [`mcp-ksq26/README.md`](mcp-ksq26/README.md).

Ringkasan:

```powershell
$env:KSQ_API_URL = "https://script.google.com/macros/s/XXXX/exec"
$env:KSQ_ADMIN_TOKEN = "..."
node mcp-ksq26/server.js --list-tools
```

Token tidak pernah disimpan dalam repo. Telefon penjaga disamarkan secara lalai.

---

## 9. Jalankan ujian

Ujian projek (masa, data awal, kontrak backend):

```powershell
# Jalankan dari akar projek (folder yang mengandungi package.json)
npm test
```

Ujian MCP (tanpa rangkaian):

```powershell
npm run test:mcp
```

Tanpa npm, dari akar projek:

```powershell
node --test "tests/*.test.js"
node --test "mcp-ksq26/test/*.test.js"
```

Ujian API sebenar memerlukan deployment GAS dan token. Ia **hanya membaca**
data:

```powershell
$env:KSQ_API_URL = "https://script.google.com/macros/s/XXXX/exec"
$env:KSQ_ADMIN_TOKEN = "..."
node tests/api-smoke.js
```

---

## 10. Keselamatan dan privasi

- Data peserta ialah data kanak-kanak. Kumpul minimum dan gunakan untuk
  pengurusan program sahaja.
- Jangan kongsi Google Sheet secara awam. Gunakan **Restricted**.
- Token hanya dalam **Script Properties** GAS, bukan dalam repo.
- Jangan letak token dalam `config.js`, WhatsApp, tangkapan skrin atau log.
- Endpoint awam tidak memulangkan nama atau nombor telefon.
- Semua teks pengguna dipaparkan melalui `textContent`, bukan `innerHTML`.
- Sel yang bermula dengan `=`, `+`, `-`, `@` dineutralkan sebelum ditulis ke
  Sheet untuk mengelak formula injection.
- Eksport CSV menggunakan UTF-8 BOM dan CRLF supaya Excel memaparkan huruf
  Melayu dengan betul.
- Jika token terdedah: tukar dalam Script Properties. Semua sesi lama gagal
  serta-merta.

---

## 11. Sandaran dan penyelenggaraan

- Admin → **Data → Sandaran ke Drive** sebelum perubahan besar.
- Atau dalam Google Sheet: **File → Make a copy**.
- Semak helaian `Log` untuk tindakan mencurigakan.
- Selepas setiap perubahan `Code.gs`: deploy versi baharu.
- Jangan ubah nama lajur dalam Google Sheets. Sistem bergantung pada pengepala
  tetap.

---

## 12. Struktur fail

```text
ksq-sistem\
  AGENTS.md                     arahan projek asal + status pelaksanaan
  ARAHAN-TAMBAHAN-FASA7-10.md   addendum pengurusan/kewangan
  PLAN.md                       pelan dan status Fasa 0-6
  PLAN-ADDENDUM.md              pelan Fasa 7-10 (belum dilaksana)
  ARCHITECTURE.md               seni bina sistem semasa
  CHANGELOG.md                  rekod perubahan
  TODO-PEMILIK.md               placeholder dan keputusan pemilik
  README.md                     fail ini
  package.json                  skrip ujian/pratonton; tiada dependencies
  serve.js                      pelayan statik setempat
  BUKA-DASHBOARD.bat            pembuka pratonton Windows
  docs\                         dokumen asal (tidak diubah)
  assets\                       logo dan gambar masjid
  backend\
    Code.gs                     semua logik server
    appsscript.json             manifest GAS
    PASANG-GAS.md               panduan pemasangan backend
  web\
    index.html                  halaman awam
    admin.html                  dashboard pentadbir
    fasilitator.html            kehadiran sahaja
    config.js                   API_URL awam
    css\style.css
    js\api.js  time.js  ui.js  i18n.js  i18n-data.js  register.js  admin.js  facilitator.js
    data\                       seed JSON dan templat import
    templates\                  sijil.html, tag-nama.html (untuk Fasa 9)
    assets\                     logo, masjid, og-ksq.jpg
  tests\
    time.test.js  seed.test.js  i18n.test.js  backend.test.js  api-smoke.js
  mcp-ksq26\
    server.js  lib\  resources\  test\  README.md
```

---

## 13. Masalah biasa

| Gejala | Semakan |
|---|---|
| Halaman kosong semasa pratonton | Guna `node serve.js`, bukan buka fail `file://`. |
| "API belum disambungkan" | `API_URL` dalam `web/config.js` masih placeholder atau salah. |
| `Token tidak sah` | Salin semula `ADMIN_TOKEN`; jangan tambah ruang. |
| Perubahan backend tidak berkesan | Deploy versi baharu, bukan simpan sahaja. |
| API keluar halaman log masuk Google | Web App access mesti **Anyone**. |
| `Helaian ... tiada` | Jalankan `setupSheets` dalam Apps Script. |
| `Pengepala helaian tidak sepadan` | Nama lajur diubah; pulihkan atau pulihkan sandaran. |
| Tarikh salah | Pastikan `appsscript.json` menggunakan `Asia/Kuala_Lumpur`. |
| Slot tidak berkurang | Semak `?action=stats`; pastikan deployment terkini. |
| CSV huruf rosak dalam Excel | Guna butang eksport sistem (BOM disertakan), bukan salin tampal. |

Jika ralat berterusan, buka Apps Script → **Executions** untuk log penuh dan
salin mesej ralat.

---

## 14. Status projek

| Fasa | Skop | Status |
|---|---|---|
| 0 | Perancangan | Siap |
| 1 | Backend GAS, helaian, API | Siap |
| 2 | Halaman awam | Siap |
| 3 | Dashboard admin | Siap |
| 4 | Checklist dan milestone | Siap |
| 5 | Pengurusan pendaftaran | Siap |
| 6 | Bajet, kehadiran, tetapan, dokumen | Siap |
| — | Halaman fasilitator | Siap (sambungan pengguna) |
| — | Tiga bahasa halaman awam (BM / ENG / AR) | Siap |
| — | MCP `mcp-ksq26/` | Siap (13 alat) |
| 7 | Organisasi, fasilitator, pembekal, viewer | Belum — pelan sahaja |
| 8 | Kewangan penuh, dana, merchandise | Belum — pelan sahaja |
| 9 | Sijil, tag, surat, import CSV | Belum — pelan sahaja |
| 10 | Pipeline, laporan, ujian beban | Belum — pelan sahaja |
| 11–13 | Lawatan, makanan/bas, jadual Hari 3 | Belum — arahan sahaja |

Jangan mula Fasa 7 sebelum pemilik meluluskan `PLAN-ADDENDUM.md`.

---

## 15. Senarai semak penyerahan

- [ ] `ADMIN_TOKEN` ditetapkan dan disimpan dalam pengurus kata laluan.
- [ ] `FASILITATOR_TOKEN` ditetapkan jika fasilitator menggunakan halaman itu.
- [ ] `setupSheets` dan `seedData` dijalankan.
- [ ] Web App dideploy sebagai **Anyone** dan URL `/exec` diuji.
- [ ] `API_URL` dalam `web/config.js` diisi.
- [ ] Telefon urus setia dan butiran bayaran diisi dalam Tetapan.
- [ ] Halaman awam diuji pada telefon Android dan iPhone.
- [ ] Satu pendaftaran ujian dihantar dan muncul dalam admin.
- [ ] Eksport CSV dibuka betul dalam Excel.
- [ ] Sandaran pertama dibuat.
- [ ] Semua placeholder dalam `TODO-PEMILIK.md` diselesaikan atau diterima.
