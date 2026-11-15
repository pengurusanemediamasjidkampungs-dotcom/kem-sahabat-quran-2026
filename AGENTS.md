# ARAHAN PROJEK: SISTEM PENGURUSAN KEM SAHABAT QURAN (KSQ) 2026

> Salin fail ini ke akar projek sebagai `AGENTS.md` (OpenCode membacanya secara automatik).
> Fail ini ditulis untuk agent AI. Baca keseluruhan sebelum menulis sebarang kod.

---

## 0. CARA GUNA (untuk pemilik projek, bukan agent)

1. Cipta folder, contohnya `D:\ksq-sistem\`, dengan struktur di Bahagian 3.
2. Letak semua dokumen (Kertas Kerja, Itinerari, Modul, poster) dalam `docs\`, serta `logo.png` dan gambar udara masjid dalam `assets\`.
3. Salin fail ini ke akar sebagai `AGENTS.md`.
4. Buka terminal (PowerShell) dalam folder itu dan jalankan `opencode`.
5. Tampal prompt pembuka ini dalam TUI:

```
Baca AGENTS.md dan semua fail dalam docs\. Jangan tulis kod lagi.
Tulis PLAN.md yang mengandungi: ringkasan pemahaman anda, senarai fail yang akan dibuat,
soalan yang perlu saya jawab, dan jadual Fasa 1 hingga 6. Berhenti dan tunggu kelulusan saya.
```

6. Selepas meluluskan PLAN.md, arahkan satu fasa pada satu masa: `Laksanakan Fasa 1 sahaja. Berhenti selepas ujian lulus.`

---

## 1. PERANAN DAN PERATURAN AGENT

Anda ialah jurutera perisian yang membina sistem pengurusan program untuk sebuah masjid. Pengguna bukan pengaturcara. Keutamaan: **mudah, stabil, mudah dipasang, dan tidak merosakkan data**.

Peraturan tegas:

1. Bekerja **satu fasa pada satu masa**. Selepas setiap fasa: jalankan ujian, ringkaskan apa yang siap dan apa yang belum, kemudian BERHENTI.
2. **Jangan reka maklumat.** Jika nombor telefon, butiran bayaran, URL atau nama tiada, guna placeholder yang jelas seperti `[ISI NOMBOR TELEFON]` dan senaraikan dalam `TODO-PEMILIK.md`.
3. **Jangan letak rahsia dalam kod** (token admin, URL deployment, ID Sheet). Semua dalam `config.js` (URL awam sahaja) atau Script Properties GAS (rahsia).
4. **Persekitaran Windows.** Beri arahan PowerShell, bukan bash. Elak `rm -rf`, `sed`, `grep`; guna alternatif PowerShell atau Node. Guna laluan relatif. Fail teks berformat UTF-8, hujung baris LF.
5. **Tiada langkah binaan (build step) pada frontend.** Gunakan HTML + CSS + JavaScript ES modul biasa supaya boleh dibuka terus dan dihoskan di GitHub Pages. Tiada framework. Tiada pakej npm di runtime. Dibenarkan hanya skrip Node kecil untuk ujian.
6. Semua teks antara muka dalam **Bahasa Malaysia**. Komen kod dan nama pemboleh ubah dalam Bahasa Inggeris.
7. Jika ragu, **tanya** dalam PLAN.md atau di akhir fasa. Jangan teka.
8. Jangan padam atau tulis ganti fail dalam `docs\` dan `assets\`.
9. Selepas setiap fasa, kemas kini `CHANGELOG.md`.

---

## 2. KONTEKS PROGRAM (sumber kebenaran: baca juga `docs\`)

| Perkara | Nilai |
|---|---|
| Nama | Kem Sahabat Quran (KSQ) 2026 |
| Penganjur | Masjid Kampung Sungai Lang Baru, Banting, Selangor |
| Slogan | "Membina Jiwa, Mengungguli Akhlak dengan Kalamullah." |
| Tarikh program | 14 – 16 Disember 2026 (Isnin – Rabu), 8:00 pagi – 5:00 petang, harian (tidak bermalam) |
| Lokasi | Hari 1 & 2: Masjid Kg. Sungai Lang Baru. Hari 3: Shah Alam (bas) |
| Kapasiti | **40 peserta sahaja** |
| Syarat | Remaja berumur 10 tahun ke atas dan lancar membaca Al-Quran |
| Harga asal | RM180 (dicoret) |
| Yuran promosi | **RM120** |
| Pendaftaran online | **RM110** (diskaun RM10) |
| Sasaran hafazan | Al-Mulk, Al-Kahfi, As-Sajdah, Al-Insan |
| Lawatan | Yayasan Restu, Muzium Sultan Alam Shah, Masjid Negeri Shah Alam |
| Pelancaran | Rabu, 18 November 2026 |
| Zon masa | **Asia/Kuala_Lumpur (UTC+8)** untuk semua pengiraan |

Tarikh "hari ini" semasa projek ini ditulis: 15 November 2026. Sistem MESTI menggunakan tarikh sebenar (lihat Bahagian 6).

Warna jenama (guna sebagai CSS variables):
`--forest:#073B2A; --emerald:#087443; --sage:#B9CDAF; --gold:#D6AD52; --cream:#F5F0E3; --ivory:#FFFDF6; --crimson:#A91E24;`
Fon: Cinzel (tajuk), Montserrat (sub-tajuk), Inter (isi). Logo: `assets\logo.png`.

---

## 3. STRUKTUR FOLDER

```
ksq-sistem\
  AGENTS.md                  (fail ini)
  PLAN.md                    (agent tulis dahulu)
  CHANGELOG.md
  TODO-PEMILIK.md            (senarai perkara yang pemilik perlu isi)
  docs\                      (dokumen sedia ada, JANGAN ubah)
  assets\                    logo.png, masjid-udara.jpg
  backend\
    Code.gs                  (Google Apps Script)
    appsscript.json
    PASANG-GAS.md            (panduan pemasangan langkah demi langkah)
  web\                       (frontend, dihoskan di GitHub Pages)
    index.html               halaman awam: maklumat + borang daftar
    admin.html               dashboard pentadbir
    config.js                { API_URL, ... } (tiada rahsia)
    css\style.css
    js\api.js  time.js  register.js  admin.js  checklist.js  ui.js
    data\seed-tasks.json     milestone dan tugasan awal
  tests\                     skrip ujian Node
```

---

## 4. ARSITEKTUR

```
[Pautan WhatsApp] -> web/index.html (borang daftar, GitHub Pages)
                          |  fetch (HTTPS, JSON)
                          v
              Google Apps Script Web App  (backend\Code.gs)
                          |
                          v
                    Google Sheets (pangkalan data)
                          ^
                          |  fetch (token admin)
                  web/admin.html (dashboard)
```

Tiada pelayan lain. Tiada pangkalan data lain. Google Sheets ialah satu-satunya stor data.

### 4.1 Helaian (Sheet tabs) yang dicipta oleh fungsi `setupSheets()`

Setiap helaian ada baris pengepala (header) tetap. Jangan ubah nama lajur selepas dicipta.

**Pendaftaran**
`id | masa_daftar | nama_peserta | umur | jantina | nama_penjaga | tel_penjaga | lancar_quran | alahan_kesihatan | kaedah_daftar | yuran_rm | status_bayaran | rujukan_bayaran | status | catatan`

- `kaedah_daftar`: `online` atau `manual`.
- `yuran_rm`: 110 untuk `online`, 120 untuk `manual` (dibaca dari helaian Tetapan, bukan dikod keras).
- `status_bayaran`: `Belum` | `Sudah` | `Dikecualikan`.
- `status`: `Disahkan` | `Menunggu` | `Senarai Tunggu` | `Batal`.
- `lancar_quran`: pengakuan ya/tidak oleh penjaga. Jika "tidak", ditolak di server.

**Tetapan** (kunci | nilai)
`kapasiti=40, yuran_asal=180, yuran_promo=120, diskaun_online=10, tarikh_mula=2026-12-14T08:00:00+08:00, tarikh_tamat=2026-12-16T17:00:00+08:00, tarikh_tutup_daftar=2026-12-07T23:59:00+08:00, pendaftaran_dibuka=true, tel_urus_setia=[ISI], butiran_bayaran=[ISI]`

**Tugasan**
`id | kategori | tugasan | pic | deadline | status | catatan | dikemaskini`
`status`: `Belum` | `Sedang` | `Selesai`.

**Milestone**
`id | tajuk | tarikh | penerangan | status`

**Bajet**
`id | item | kategori | anggaran_rm | sebenar_rm | catatan`

**Kehadiran**
`id_peserta | hari1 | hari2 | hari3 | catatan`

**Log** (audit): `masa | tindakan | butiran` (jangan simpan data peribadi penuh dalam log).

### 4.2 API (Apps Script Web App)

Satu URL `/exec`. Semua respons JSON `{ ok: boolean, data?: any, error?: string, serverTime: ISO8601 }`.

**Awam (tiada token), hanya data agregat dan tidak peribadi:**
- `GET ?action=stats` mengembalikan `{ kapasiti, disahkan, menunggu, bakiSlot, pendaftaranDibuka, tarikhTutup, yuran:{asal,promo,online}, serverTime }`
- `POST action=register` mencipta pendaftaran (lihat 4.3)

**Admin (perlu `token`):**
- `GET ?action=list&token=...` senarai pendaftaran
- `POST action=updateRegistration` ubah status atau bayaran
- `POST action=tasks.list|tasks.upsert|tasks.delete`
- `POST action=milestones.list|milestones.upsert|milestones.delete`
- `POST action=budget.list|budget.upsert|budget.delete`
- `POST action=attendance.mark`
- `POST action=settings.get|settings.set`
- `POST action=seed` memuatkan data awal (hanya jika helaian kosong)

### 4.3 Peraturan pendaftaran (di SERVER, bukan di frontend sahaja)

1. Guna `LockService.getScriptLock().waitLock(10000)` supaya dua orang tidak mengambil slot ke-40 serentak.
2. Dalam kunci: kira baris `Disahkan` + `Menunggu`. Jika >= kapasiti, status baru = `Senarai Tunggu` (bukan ditolak). Pulangkan mesej jelas.
3. Pengesahan input: nama (2 hingga 80 aksara), umur integer **10 hingga 18** secara lalai (boleh ubah dalam Tetapan; poster hanya menyebut "10 tahun ke atas"), tel penjaga format Malaysia (`01x-xxxxxxx`, normalkan kepada digit sahaja), `lancar_quran` mesti ya, persetujuan data peribadi mesti ditanda.
4. Tolak pendua: tel_penjaga + nama_peserta (huruf kecil, trim) yang sama.
5. Medan honeypot tersembunyi `website`: jika diisi, balas `ok:true` palsu dan jangan simpan.
6. Respons kepada `register`: `{ id, status, yuran_rm, mesejBayaran }`. Jangan pulangkan data orang lain.
7. Jika `pendaftaran_dibuka=false` atau melepasi `tarikh_tutup_daftar`, tolak dengan mesej sopan.
8. Pulangkan `serverTime` dalam setiap respons.

### 4.4 Keselamatan dan privasi (data kanak-kanak)

- Token admin disimpan dalam **Script Properties** (`ADMIN_TOKEN`). Dijana sendiri oleh pemilik. Bandingkan dengan masa malar jika boleh. Tiada token dalam repositori.
- Frontend admin meminta token pada log masuk dan menyimpan dalam `sessionStorage` sahaja (hilang bila tab ditutup).
- Endpoint awam tidak pernah memulangkan nama atau nombor telefon.
- Kumpul data minimum. Paparkan notis privasi ringkas pada borang dan kotak persetujuan wajib: data digunakan untuk pengurusan program sahaja.
- Sheet mesti **tidak dikongsi secara awam**. Terangkan ini dalam `PASANG-GAS.md`.
- Escape semua teks sebelum dimasukkan ke DOM (`textContent`, bukan `innerHTML`) untuk elak XSS. Tolak/neutralkan sel yang bermula dengan `=`, `+`, `-`, `@` sebelum ditulis ke Sheet (formula injection).

### 4.5 Perangkap Google Apps Script yang MESTI dipatuhi

- Daripada frontend, hantar POST dengan `Content-Type: text/plain;charset=utf-8` dan `body: JSON.stringify(...)` untuk **mengelak preflight CORS** (GAS tidak menyokong OPTIONS). Baca di server melalui `JSON.parse(e.postData.contents)`.
- Respons guna `ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)`.
- Deploy sebagai Web App: *Execute as: Me*, *Who has access: Anyone*.
- **Setiap kali kod diubah, mesti Deploy > Manage deployments > Edit > Version: New version > Deploy.** URL kekal sama. Jika tidak, perubahan tidak hidup. Tulis ini dengan jelas dalam `PASANG-GAS.md`.
- Tetapkan `"timeZone": "Asia/Kuala_Lumpur"` dalam `appsscript.json`.
- Tulis tarikh sebagai teks ISO 8601 dengan `+08:00`, bukan objek Date Sheets, untuk elak kekeliruan zon masa.
- Baca data sekali sahaja dengan `getDataRange().getValues()`, bukan sel demi sel. Tulis dengan `appendRow`/`setValues`.
- Jika pengguna mahu menyambung ke Sheet sedia ada atau Google Form: sediakan fungsi pilihan `getRegistrationCountFromSheet(sheetId, tabName)`, dan tetapan `sumber_pendaftaran = sistem | sheet_luar` serta `sheet_luar_id`. Dalam mod `sheet_luar`, `stats` mengira bilangan baris data (tolak pengepala) daripada Sheet itu. Medan ini diisi pemilik di halaman Tetapan admin (tampal URL Sheet; sistem ekstrak ID).

---

## 5. HALAMAN DAN CIRI FRONTEND

Reka bentuk: **mobile-first** (kebanyakan pengguna membuka dari WhatsApp pada telefon), kemudian responsif untuk laptop. Gunakan warna jenama, kad krim dengan sempadan emas, tajuk Cinzel. Kontras teks mencukupi. Butang besar (min 44px).

### 5.1 `index.html` (awam, pautan untuk WhatsApp)

- Hero: logo, tajuk "Kem Sahabat Quran 2026", slogan, tarikh, lokasi.
- Penghitung slot **langsung**: "Baki X daripada 40 slot" dengan bar kemajuan, dikemas kini setiap 30 saat dan apabila tab kembali aktif (`visibilitychange`).
- Harga: RM180 dicoret, **RM120**, dan lencana "Daftar online: RM110".
- Ringkasan program (sasaran hafazan, pengisian, lawatan Shah Alam). Teks dari `docs\`, jangan reka.
- Borang pendaftaran (medan di 4.1, tanpa medan dalaman). Pengesahan sisi klien + pesan ralat dalam BM. Butang dinyahaktifkan semasa hantar (elak klik dua kali).
- Skrin selepas hantar: nombor rujukan, status (Disahkan/Menunggu/Senarai Tunggu), jumlah yuran, **arahan bayaran** (dari Tetapan `butiran_bayaran`), dan butang "Hantar bukti bayaran melalui WhatsApp" (`https://wa.me/<tel_urus_setia>?text=...` dengan teks isi awal).
- Jika slot penuh: tunjuk "Slot penuh, daftar sebagai Senarai Tunggu".
- Jika pendaftaran ditutup: tunjuk mesej dan tutup borang.
- Meta Open Graph (tajuk, penerangan, imej `assets\masjid-udara.jpg` yang dikecilkan) supaya pratonton WhatsApp cantik.

### 5.2 `admin.html` (pentadbir)

Log masuk token. Navigasi tab: **Dashboard, Daftar, Checklist, Milestone, Bajet, Kehadiran, Tetapan.**

**Dashboard (paparan utama):**
- Kad besar "Program bermula dalam: X hari Y jam Z minit" (kiraan detik hidup, kemas kini setiap saat) dan "H-X".
- Kad "Pendaftaran ditutup dalam ..." (kiraan detik hidup).
- Slot: disahkan / menunggu / tunggu / baki, bar kemajuan kepada 40, dan **kadar pendaftaran harian** (purata dan unjuran: "pada kadar ini penuh pada <tarikh>").
- Kewangan: dikutip (bayaran Sudah) vs sasaran (jumlah yuran peserta Disahkan), vs anggaran perbelanjaan, dan jurang.
- Kemajuan checklist keseluruhan (% selesai) dan kemajuan setiap kategori.
- "Perlu tindakan hari ini": tugasan yang due hari ini, lewat (merah), dan 7 hari akan datang.
- Milestone seterusnya dengan baki hari.
- Amaran automatik: tugasan lewat; baki slot kurang 10; bayaran belum diterima melebihi 3 hari; destinasi belum disahkan kurang 14 hari sebelum program.

**Daftar:** jadual boleh tapis/cari (status, bayaran, kaedah), tukar status/bayaran satu klik, tambah pendaftaran manual (yuran 120), edit catatan, eksport CSV (UTF-8 BOM supaya Excel papar betul), butang "Salin senarai nombor penjaga" dan penjana mesej WhatsApp templat (pengesahan, peringatan bayar, taklimat Hari 3). Naikkan peserta Senarai Tunggu ke Disahkan jika ada slot.

**Checklist:** tugasan mengikut kategori, kotak semak, PIC, deadline, status, tapis ("lewat", "minggu ini"), tambah/edit/padam. Lencana warna: Selesai (hijau), Hari ini (emas), Akan datang (neutral), Lewat (merah).

**Milestone:** garis masa menegak dengan titik "kita di sini" (hari ini), baki hari bagi setiap milestone, status automatik.

**Bajet:** jadual item anggaran vs sebenar, jumlah, baki, pembuka kategori. Data awal dari Kertas Kerja (lihat 7).

**Kehadiran:** senarai peserta Disahkan dengan kotak Hari 1/2/3; kiraan hadir setiap hari.

**Tetapan:** kapasiti, harga, tarikh tutup, buka/tutup pendaftaran, no. urus setia, butiran bayaran, sumber pendaftaran (sistem atau tampal pautan Sheet luar), dan ujian sambungan ("Uji API").

---

## 6. MASA SEBENAR (keperluan kritikal)

1. Semua masa dipaparkan dan dikira dalam **Asia/Kuala_Lumpur**, walau apa pun zon masa komputer pengguna. Gunakan `Intl.DateTimeFormat('ms-MY',{timeZone:'Asia/Kuala_Lumpur',...})` dan tarikh ISO dengan `+08:00`.
2. Jangan percaya jam laptop bulat-bulat. Setiap respons API ada `serverTime`. Kira `offset = serverTime - Date.now()` semasa muat, kemudian `now() = Date.now() + offset`. Semak semula offset setiap 5 minit.
3. Penghitung detik: guna `setInterval` 1 saat tetapi kira daripada masa mutlak (bukan tolak 1 setiap saat) supaya tidak melencong bila tab tidur.
4. Status automatik: tugasan `Lewat` = deadline < sekarang dan status bukan Selesai. `Hari ini` = deadline pada tarikh KL hari ini. Hari dikira mengikut kalendar KL, bukan 24 jam.
5. Kira "baki hari" dengan membandingkan tarikh kalendar KL, bukan bahagi milisaat dengan 86400000 mentah.
6. Selepas program bermula, penghitung bertukar menjadi "Hari X daripada 3" dan "Program tamat" selepas tarikh_tamat.
7. Tulis ujian Node (`tests\time.test.js`) untuk: sempadan tengah malam KL, offset jam salah, bulan/tahun lompat, dan "Lewat".

---

## 7. DATA AWAL (`web\data\seed-tasks.json`, dimuat melalui `action=seed`)

Semua tarikh ialah **cadangan** dan boleh disunting. Tandakan `catatan: "Cadangan, sila sahkan"`. Tarikh program 14 Dis.

**Milestone:**
| Tarikh | Milestone |
|---|---|
| 2026-11-18 | Pelancaran program dan sebar pautan pendaftaran di WhatsApp |
| 2026-11-22 | Surat lawatan dihantar kepada Yayasan Restu dan Muzium |
| 2026-11-25 | Bas ditempah |
| 2026-11-30 | Penceramah dan fasilitator disahkan |
| 2026-12-07 | Tutup pendaftaran (atau apabila 40 slot penuh) |
| 2026-12-09 | Modul dan tag siap dicetak |
| 2026-12-11 | Senarai peserta muktamad dan borang kebenaran ibu bapa dikumpul |
| 2026-12-12 | Taklimat ibu bapa; pengesahan akhir makanan, bas dan destinasi |
| 2026-12-13 | Persiapan masjid |
| 2026-12-14 | Hari 1 program |
| 2026-12-15 | Hari 2 program |
| 2026-12-16 | Hari 3 program (Shah Alam) |
| 2026-12-18 | Laporan kewangan dan maklum balas |

**Tugasan mengikut kategori** (agent hendaklah mengembangkan setiap satu menjadi baris dengan deadline berpandukan jadual di atas):

- *Pendaftaran:* sedia borang online; uji borang; sebar pautan WhatsApp; semak bayaran setiap hari; urus senarai tunggu; hantar mesej pengesahan; tutup pendaftaran.
- *Destinasi:* hubungi Yayasan Restu (alamat: Kompleks Taman Seni Islam Antarabangsa, No. 2A Pesiaran Damai, Seksyen 10, Shah Alam; sahkan yuran kumpulan); hubungi Muzium Sultan Alam Shah (+60 3-5519 0050; Selasa–Ahad 9:30–5:30; tiket dilaporkan RM5 dewasa, RM2 kanak-kanak 7–12 tahun, **sahkan dengan muzium**); maklumkan Masjid Negeri Shah Alam (solat Zohor, makan tengah hari, tasmik kemuncak).
- *Logistik:* tempah bas mini; sahkan katering (RM4 minum pagi, RM7 tengah hari, RM4 minum petang menurut draf); senarai peralatan; pelan hujan; nombor kecemasan; kit pertolongan cemas.
- *Kandungan:* sahkan penceramah Slot Akhlak (Ust Shahril) dan Kepimpinan Remaja (Khairul Anuar); sahkan 3 fasilitator lain (jumlah fasilitator 5 menurut draf); muktamad modul; cetak modul; cetak tag; sijil penyertaan.
- *Kewangan:* sahkan bajet dengan bendahari; kutip yuran; bayar deposit bas; bayar tiket muzium; bayar elaun fasilitator; laporan akhir.
- *Promosi:* muktamad poster; sebar di WhatsApp; masukkan nombor telefon dan QR pada poster; pasang di papan kenyataan masjid.
- *Hari Program:* senarai semak harian Hari 1, 2, 3 (pendaftaran, kehadiran, solat, makan, bas, tasmik kemuncak).
- *Selepas program:* laporan, maklum balas ibu bapa, penutupan akaun, muat naik gambar.

**Bajet awal (draf tulisan tangan, tandakan "perlu disemak bendahari"):** Bas mini 1,200; Slot ceramah 600 (RM300 x 2); Tag 100; Modul 100; Elaun fasilitator 1,200 (RM240 x 5); Makan minum 2,025 (RM45 x 45 orang); **Jumlah 5,225**. Tiket muzium belum dimasukkan (anggaran RM2–RM5 x 40). Hasil yuran: RM120 x 40 = 4,800; RM110 x 40 = 4,400. Dashboard mesti memaparkan jurang ini secara jujur.

---

## 8. FASA PELAKSANAAN

Setiap fasa: bina, uji, ringkas, **berhenti**.

**Fasa 0, Perancangan.** Baca semua dokumen. Tulis `PLAN.md` dan `TODO-PEMILIK.md`. Senaraikan soalan (contoh: format ID pendaftaran, umur maksimum, sama ada guna Sheet luar). Tiada kod.

**Fasa 1, Backend.** `Code.gs`, `appsscript.json`, `PASANG-GAS.md`. Fungsi `setupSheets()`, `seedData()`, `doGet`, `doPost`, pengesahan, kunci, token. Sertakan `tests\api-smoke.js` (Node 18+, `fetch`) yang menguji `stats`, `register` sah, pendua, medan honeypot, nilai tidak sah, had kapasiti, dan akses admin tanpa token ditolak. Ujian ini dijalankan terhadap URL deployment oleh pemilik; agent hanya menulisnya dan menjelaskan cara menjalankan.

**Fasa 2, Halaman awam.** `index.html`, `register.js`, `api.js`, `time.js`, CSS asas jenama. Penghitung slot hidup. Borang dan skrin kejayaan.

**Fasa 3, Dashboard admin.** Log masuk token, dashboard, penghitung masa sebenar, kad statistik, amaran.

**Fasa 4, Checklist, deadline dan milestone.** CRUD penuh, status automatik, garis masa, pemuatan data awal.

**Fasa 5, Pengurusan pendaftaran.** Jadual, status/bayaran, tambah manual, senarai tunggu, eksport CSV, penjana mesej WhatsApp, mod Sheet luar.

**Fasa 6, Bajet, kehadiran, kemasan.** Bajet, kehadiran, Tetapan, ujian akhir, `README.md` pemasangan lengkap (GAS dan GitHub Pages), semakan kebolehcapaian dan prestasi pada telefon.

---

## 9. PANDUAN PEMASANGAN YANG PERLU DITULIS DALAM `PASANG-GAS.md`

Agent tidak boleh log masuk ke akaun Google pemilik. Tulis langkah ini untuk pemilik, dengan bahasa mudah:

1. Cipta Google Sheet baharu bernama "KSQ 2026 - Pangkalan Data". Jangan kongsi.
2. Extensions > Apps Script. Tampal `Code.gs`. Tetapkan `appsscript.json` (View > Show manifest file).
3. Project Settings > Script Properties > tambah `ADMIN_TOKEN` dengan teks rawak panjang (sekurang-kurangnya 24 aksara). Simpan di tempat selamat.
4. Jalankan fungsi `setupSheets` sekali dan beri kebenaran (Review permissions). Kemudian jalankan `seedData`.
5. Deploy > New deployment > Web app > Execute as: Me > Access: Anyone > Deploy. Salin URL `/exec`.
6. Tampal URL itu ke `web\config.js` sebagai `API_URL`.
7. Ujian: buka URL `/exec?action=stats` dalam pelayar; mesti keluar JSON.
8. Muat naik folder `web\` ke repo GitHub; Settings > Pages > Deploy from branch > folder `/web` (atau salin ke akar). Pautan `https://<pengguna>.github.io/<repo>/` itulah yang disebar di WhatsApp. Pautan admin ialah `.../admin.html` (jangan sebar).
9. Selepas sebarang ubahan `Code.gs`: Deploy > Manage deployments > Edit > New version > Deploy.

---

## 10. KRITERIA SIAP (Definition of Done)

- [ ] Pautan awam dibuka lancar pada telefon Android dan iPhone, paparan WhatsApp in-app browser betul.
- [ ] Pendaftaran ke-40 mengambil slot terakhir; pendaftar ke-41 menjadi Senarai Tunggu; dua hantaran serentak tidak melebihi 40.
- [ ] Pendua ditolak. Umur di luar julat ditolak. Honeypot tidak menyimpan.
- [ ] Penghitung detik betul walaupun jam laptop sengaja dilaraskan salah 10 minit.
- [ ] Status Lewat / Hari ini betul merentas tengah malam waktu KL.
- [ ] Endpoint awam tidak pernah memulangkan data peribadi. Endpoint admin gagal tanpa token.
- [ ] Teks pengguna tidak boleh menyuntik HTML atau formula Sheet.
- [ ] Eksport CSV dibuka betul dalam Excel (huruf Melayu dan tarikh).
- [ ] Tiada rahsia dalam repositori. `TODO-PEMILIK.md` menyenaraikan semua placeholder (no. telefon, butiran bayaran, QR, URL API, token).
- [ ] `README.md` membolehkan orang bukan pengaturcara memasang sistem dari awal.

---

## 11. YANG TIDAK PERLU DIBINA (elak skop meluas)

Pembayaran dalam talian automatik (FPX/kad), log masuk berbilang pengguna, aplikasi mudah alih asli, notifikasi WhatsApp automatik (hanya pautan `wa.me` dengan teks siap), pangkalan data selain Google Sheets, dan sebarang rangka kerja frontend.

---

## 12. APABILA ADA MASALAH

Jika ralat berlaku: (1) salin mesej ralat penuh, (2) terangkan punca yang disyaki, (3) cadangkan pembetulan terkecil, (4) uji semula. Jangan tulis semula fail besar untuk membetulkan masalah kecil. Jika sesuatu bergantung pada tindakan pemilik (deploy GAS, isi token), beritahu pemilik dengan jelas dan berhenti.

---

## LAMPIRAN STATUS PELAKSANAAN (15 November 2026)

> Bahagian ini merekod keadaan sebenar projek. Jika senarai fail dalam Bahagian 3
> berbeza, senarai di bawah ialah sumber kebenaran untuk kerja yang sudah siap.

### Siap dan diuji

- **Fasa 0–6**: backend GAS, 7 helaian, API awam/admin, halaman awam, dashboard
  admin, checklist, milestone, pendaftaran, CSV, WhatsApp, bajet, kehadiran,
  tetapan, sandaran dan dokumen pemasangan.
- **Sambungan pengguna**: `web/fasilitator.html` + `web/js/facilitator.js` untuk
  kehadiran sahaja, dengan `FASILITATOR_TOKEN` berasingan.
- **MCP**: `mcp-ksq26/` dengan 13 alat, 4 sumber rujukan dan ujian tanpa
  rangkaian.
- **Dokumen**: `README.md`, `ARCHITECTURE.md`, `PLAN.md`, `CHANGELOG.md`,
  `TODO-PEMILIK.md`, `backend/PASANG-GAS.md`, `mcp-ksq26/README.md`.
- **Ujian**: 41 ujian projek dan 38 ujian MCP lulus pada 15 November 2026.

### Fail sebenar yang berbeza daripada Bahagian 3

- Tiada `web/js/checklist.js`; logik checklist berada dalam `web/js/admin.js`.
- `web/js/facilitator.js` ditambah.
- `web/data/` mengandungi `seed-tasks.json`, `seed-tugasan-lanjutan.json`,
  `seed-bajet.json`, `seed-fasilitator.json`, `seed-jawatankuasa.json` dan
  `peserta-import-templat.csv`.
- `mcp-ksq26/` menggunakan `lib/api-client.js`, `lib/tools.js`,
  `lib/finance.js`, `lib/resources.js`, bukan `lib/client.js` atau
  `lib/protocol.js`.
- Tiada `tests/mcp.test.js`; ujian MCP berada dalam `mcp-ksq26/test/`.

### Belum dilaksanakan

- **Fasa 7–10**: pelan lengkap dalam `PLAN-ADDENDUM.md`. Tiada kod ditulis.
  Tunggu kelulusan pemilik.
- **Fasa 11–13**: lawatan, makanan/bas dan jadual Hari 3 bergantung. Arahan
  dalam `ARAHAN-LAWATAN-MAKANAN-BAS.md` di folder induk. Tiada kod ditulis.
- **Ujian API sebenar**: `tests/api-smoke.js` memerlukan URL `/exec` dan token
  pemilik.

### Peraturan yang masih terpakai

- Jangan tulis kod Fasa 7 sebelum kelulusan bertulis.
- Jangan reka harga roti krim, yuran lawatan, sebut harga bas atau nama penuh.
- Jangan letak token dalam repo.
- Selepas setiap perubahan `Code.gs`, deploy versi baharu.
- Kemas kini `CHANGELOG.md` selepas setiap fasa.
