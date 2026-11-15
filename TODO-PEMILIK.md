# TODO-PEMILIK — Perkara yang perlu diisi/disahkan

> Tandakan `[x]` apabila selesai. Jangan letak token sebenar dalam fail ini atau
> dalam mana-mana fail repo. Token hanya di **Apps Script → Project Settings →
> Script Properties**.

---

## A. Wajib sebelum sistem digunakan

- [ ] **Buat Google Sheet** bernama `KSQ 2026 - Pangkalan Data`. Tetapkan
      perkongsian kepada **Restricted**, bukan "Anyone with the link".
- [ ] **Tetapkan `ADMIN_TOKEN`** dalam Script Properties: teks rawak sekurang-
      kurangnya 24 aksara. Simpan dalam pengurus kata laluan.
- [ ] **Jalankan `setupSheets`** sekali dan beri kebenaran.
- [ ] **Jalankan `seedData`** untuk memasukkan milestone, tugasan dan bajet awal.
- [ ] **Deploy Web App**: Execute as **Me**, Who has access **Anyone**.
- [ ] Salin URL `/exec` dan tampal ke `web/config.js` sebagai `API_URL`.
      Placeholder semasa: `ISI_DEPLOYMENT_ID`.
- [ ] **Isi no. telefon urus setia** di admin → Tetapan → `tel_urus_setia`.
      Placeholder semasa dalam `backend/Code.gs`:
      `[ISI NOMBOR TELEFON URUS SETIA]`.
- [ ] **Isi butiran bayaran** di admin → Tetapan → `butiran_bayaran`.
      Placeholder semasa: `[ISI BUTIRAN BAYARAN: contohnya pindahan bank ke akaun masjid]`.
- [ ] **Uji API** di admin → Tetapan → "Uji API". Pastikan respons `ok: true`.
- [x] **Hoskan folder `web/`** di GitHub Pages dan uji pautan pada telefon
      Android dan iPhone. (Diterbitkan 15 November 2026 di
      `https://pengurusanemediamasjidkampungs-dotcom.github.io/kem-sahabat-quran-2026/`)
- [x] **Isi URL penuh laman** untuk `og:image` dalam `web/index.html`.
      (Sudah diisi dengan URL GitHub Pages di atas.)
- [ ] **Hantar satu pendaftaran ujian**, sahkan ia muncul dalam admin, kemudian
      tandakan sebagai `Batal` atau padam mengikut prosedur anda.
- [ ] **Buat sandaran pertama** melalui admin → Data → "Sandaran ke Drive".

---

## B. Pilihan dan keselamatan

- [ ] **`FASILITATOR_TOKEN`** (pilihan): tambah dalam Script Properties jika
      fasilitator perlu menggunakan `web/fasilitator.html`. Jika tidak, halaman
      itu tidak dapat log masuk.
- [ ] Jangan sebar pautan `admin.html` atau `fasilitator.html` di WhatsApp umum.
- [ ] Pastikan Google Sheet **tidak** dikongsi secara awam.
- [ ] Semak tetapan `sumber_pendaftaran`:
      - `sistem` — borang sistem ini.
      - `sheet_luar` — guna Sheet/Form sedia ada; tampal pautan Sheet dan nama
        tab di Tetapan.
- [ ] Jika guna Sheet luar, beri akaun Google pemilik Web App akses baca kepada
      Sheet itu.
- [ ] Jika token terdedah: tukar `ADMIN_TOKEN` dan/atau `FASILITATOR_TOKEN`
      dalam Script Properties serta-merta. Semua sesi lama akan gagal.
- [ ] **Token GitHub (PAT classic) yang digunakan untuk menerbitkan repo telah
      ditampal dalam sembang.** Revoke di GitHub → Settings → Developer
      settings → Personal access tokens (classic), kemudian jana token baharu
      jika perlu. Jangan simpan token dalam repo atau dalam `config.js`.

---

## C. Placeholder dalam fail

### C1. `web/config.js`

- [ ] `API_URL` — ganti `ISI_DEPLOYMENT_ID` dengan ID deployment sebenar.
- [x] `SITE_URL` — sudah diisi dengan URL GitHub Pages penuh.

### C2. `web/index.html`

- [ ] `og:image` — ganti `[ISI URL PENUH GITHUB PAGES]` dengan URL penuh imej
      `assets/og-ksq.jpg` (1200×630).

### C3. `backend/Code.gs` (nilai lalai Tetapan)

- [ ] `tel_urus_setia` — `[ISI NOMBOR TELEFON URUS SETIA]`.
- [ ] `butiran_bayaran` — `[ISI BUTIRAN BAYARAN: contohnya pindahan bank ke akaun masjid]`.

### C4. `web/data/seed-jawatankuasa.json` (13 jawatan)

Setiap baris mempunyai `nama: "[ISI NAMA]"` dan `tel: "[ISI]"`. Isi nama dan
telefon sebenar, atau biarkan kosong dengan sengaja dan catatkan di sini.

- [ ] J01 Penaung (Pengerusi Masjid)
- [ ] J02 Pengarah Program
- [ ] J03 Timbalan Pengarah
- [ ] J04 Setiausaha
- [ ] J05 Bendahari
- [ ] J06 Ketua Unit Pendaftaran
- [ ] J07 Ketua Unit Hafazan
- [ ] J08 Penyelaras Modul dan Sijil
- [ ] J09 Ketua Unit Logistik dan Lawatan
- [ ] J10 Ketua Unit Makanan
- [ ] J11 Ketua Unit Kebajikan dan Keselamatan
- [ ] J12 Ketua Unit Media dan Promosi
- [ ] J13 Ketua Unit Baju, Lencana dan Peralatan

> Fail ini belum dimuatkan oleh backend Fasa 1–6. Ia akan digunakan dalam
> Fasa 7. Mengisinya sekarang mengelakkan kerja berulang.

### C5. `web/data/seed-fasilitator.json`

- [ ] F01 Ust Shahril — sahkan ejaan nama dan nombor telefon (`[ISI]`).
- [ ] F02 Khairul Anuar — sahkan ejaan nama dan nombor telefon (`[ISI]`).
- [ ] F03 Fasilitator Kumpulan 1 — `[ISI NAMA]`, `[ISI]`.
- [ ] F04 Fasilitator Kumpulan 2 — `[ISI NAMA]`, `[ISI]`.
- [ ] F05 Fasilitator Kumpulan 3 — `[ISI NAMA]`, `[ISI]`.
- [ ] F06 Fasilitator Kumpulan 4 — `[ISI NAMA]`, `[ISI]`.
- [ ] F07 Fasilitator Kumpulan 5 — `[ISI NAMA]`, `[ISI]`.

### C6. `mcp-ksq26/.env.example`

- [ ] Fail ini ialah templat. Jangan isi token sebenar di dalamnya. Tetapkan
      token dalam persekitaran mesin atau klien MCP sahaja.

---

## D. Maklumat program yang perlu disahkan

- [ ] **Tarikh pelancaran 18 November 2026** — dokumen menyebut "menurut nota
      draf — sila sahkan".
- [ ] **Umur maksimum peserta** — sistem lalai 10–18; poster hanya menyebut
      10 tahun ke atas. Ubah di Tetapan jika perlu.
- [ ] **Harga tiket Muzium Sultan Alam Shah** — sumber pelawat: RM5 dewasa,
      RM2 kanak-kanak 7–12, percuma bawah 6; sahkan dengan muzium
      (+60 3-5519 0050).
- [ ] **Yuran lawatan Yayasan Restu** — belum disahkan; sebahagian sumber kata
      percuma, sebahagian pameran mungkin berbayar.
- [ ] **Kebenaran Masjid Negeri Shah Alam** — solat Zohor dan tasmik di
      kawasan tasik.
- [ ] **Harga katering** — draf: RM4 minum pagi, RM7 tengah hari, RM4 minum
      petang (Hari 1–2 sahaja).
- [ ] **Elaun fasilitator** — draf kertas kerja RM80/hari × 3 hari × 5 orang =
      RM1,200; arahan ringkasan menyebut RM240 × 5. Kedua-duanya berjumlah
      RM1,200 tetapi asas pengiraan berbeza. Sahkan dengan bendahari.
- [ ] **Penceramah** — Ust Shahril (Slot Akhlak) dan Khairul Anuar (Kepimpinan
      Remaja) masih perlu pengesahan bertulis.
- [ ] **Fasilitator** — 3 hingga 5 fasilitator tambahan belum dinamakan.
- [ ] **Masa solat Disember** — jadual dalam modul ialah anggaran; semak
      JAKIM/JAIS.
- [ ] **Waktu pulang Hari 3** — dijangka 5:30 petang, boleh lewat; maklumkan
      ibu bapa.

---

## E. Lawatan, makanan dan bas (Fasa 11–13)

Sumber: `ARAHAN-LAWATAN-MAKANAN-BAS.md` di folder induk.

### E1. Lawatan

- [ ] Nama dan telefon PIC **Yayasan Restu**.
- [ ] Kadar bayaran kumpulan, deposit dan syarat Yayasan Restu.
- [ ] Slot masa yang diluluskan Yayasan Restu.
- [ ] Nama dan telefon PIC **Muzium Sultan Alam Shah**.
- [ ] Kadar bayaran kumpulan, deposit dan syarat muzium.
- [ ] Slot masa yang diluluskan muzium.
- [ ] Masa perjalanan antara kedua-dua lokasi dan Masjid Negeri Shah Alam.
- [ ] Pegawai Masjid Negeri Shah Alam yang dihubungi dan tarikh reconfirm
      (cadangan 12 Disember).
- [ ] Adakah surat lawatan rasmi perlu dihantar? Kepada siapa?

### E2. Makanan

- [ ] Menu sebenar Hari 1–2 (minum pagi, makan tengah hari, minum petang).
- [ ] Pembekal makanan Hari 1–2 dan sebut harga.
- [ ] **Harga roti krim seorang** — belum diberi. Jangan reka.
- [ ] Masa roti krim diedarkan Hari 3 (sebelum bas bertolak, dalam bas, atau di
      Shah Alam).
- [ ] Pembekal roti krim dan cara penghantaran ke lokasi Hari 3.
- [ ] Bilangan makan: 45 (40 peserta + 5 fasilitator) atau termasuk AJK dan
      pemandu bas?
- [ ] Adakah Hari 3 benar-benar hanya roti krim? Jika peserta perlu hidangan
      lain, siapa membekal dan bagaimana kos dimasukkan?
- [ ] Ringkasan alahan makanan untuk pembekal setiap hari.

### E3. Bas

- [ ] Syarikat bas, jenis bas dan kapasiti tempat duduk.
- [ ] Kos sebut harga sebenar (anggaran semasa B01: RM1,200).
- [ ] Deposit yang diperlukan dan tarikh bayaran.
- [ ] Adakah tol, parkir dan makan pemandu termasuk dalam sebut harga?
- [ ] Masa bertolak dan masa pulang sebenar Hari 3.
- [ ] Adakah program melebihi 5:00 petang pada Hari 3?
- [ ] Nombor telefon pemandu bas dan kontak syarikat untuk kecemasan.

---

## F. Keputusan Fasa 7–10 (belum dilaksana)

Sumber: `PLAN-ADDENDUM.md`. Jangan mula Fasa 7 sebelum keputusan ini.

- [ ] Adakah Ust Shahril dan Khairul Anuar fasilitator berelaun, atau penceramah
      sahaja? Berapa fasilitator berelaun sebenar (4 atau 5)?
- [ ] Item pilihan mana (baju, lencana, fail, beg) yang akan diluluskan dan
      siapa menaja?
- [ ] Kriteria kelayakan sijil: hadir minimum berapa hari? (Cadangan: 2 daripada 3.)
- [ ] Siapa penandatangan sijil (nama dan jawatan)?
- [ ] Adakah `saiz_baju` mahu dikumpul pada borang? (Hanya jika baju diluluskan.)
- [ ] Siapa yang akan memegang `ADMIN_TOKEN` dan `VIEWER_TOKEN`?
- [ ] Adakah `VIEWER_TOKEN` perlu melihat telefon penuh untuk unit pendaftaran?
      (Lalai: tidak, telefon bertopeng.)
- [ ] Adakah 3 sebut harga pembekal disimpan sebagai 3 baris `Pembekal` atau
      helaian `SebutHarga` berasingan? (Cadangan: 3 baris `Pembekal`.)
- [ ] Adakah laporan akhir perlu format surat rasmi atau jadual cetak biasa?
- [ ] Adakah data peserta sedia ada perlu diimport dari Google Form/Sheet lama?
- [ ] Berapa lama data disimpan selepas program? (Cadangan: 12 bulan, kemudian
      arkib dan padam data peribadi.)

---

## G. MCP (alat AI/terminal)

- [ ] Tetapkan pemboleh ubah persekitaran pada komputer yang menjalankan MCP:
      - `KSQ_API_URL` = URL `/exec`
      - `KSQ_ADMIN_TOKEN` = token admin yang sama
      - `KSQ_FASILITATOR_TOKEN` = pilihan
- [ ] Jangan commit fail `.env`. Gunakan `mcp-ksq26/.env.example` sebagai templat.
- [ ] Uji tanpa rangkaian:

```powershell
cd mcp-ksq26
node --test "test/*.test.js"
```

- [ ] Uji senarai alat:

```powershell
node mcp-ksq26/server.js --list-tools
```

- [ ] Daftar dalam OpenCode menggunakan `mcp.servers` seperti dalam
      `mcp-ksq26/README.md`, kemudian semak `/mcps`.

---

## H. Kandungan yang belum disediakan

- [ ] **QR code pendaftaran** untuk poster — jana selepas URL GitHub Pages
      diketahui.
- [ ] **Nombor telefon pada poster** — poster asal belum memuatkan nombor urus
      setia.
- [ ] **Gambar/video dokumentasi** — belum ada; jangan letak gambar peserta
      tanpa kebenaran ibu bapa.
- [ ] **Surat kebenaran ibu bapa dan indemniti** — dokumen berasingan, bukan
      sebahagian sistem ini. Sistem hanya merekod status pendaftaran/bayaran.

---

## I. Penyelenggaraan

- [ ] Setiap kali `backend/Code.gs` diubah: **Deploy → Manage deployments →
      Edit → New version → Deploy**. URL kekal sama.
- [ ] Sandaran Sheet setiap minggu atau selepas perubahan besar.
- [ ] Semak helaian `Log` jika ada tindakan mencurigakan.
- [ ] Jangan simpan data peserta dalam WhatsApp peribadi lebih lama daripada
      perlu.
- [ ] Selepas program: arkibkan data, padam data peribadi mengikut tempoh yang
      dipersetujui, dan simpan laporan kewangan.
