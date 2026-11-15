# PLAN-ADDENDUM.md — Pelan Fasa 7 hingga 10

> **Status: PELAN SAHAJA. TIADA KOD DITULIS UNTUK FASA 7–10.**
> Dokumen ini menterjemah `ARAHAN-TAMBAHAN-FASA7-10.md` dan
> `ARAHAN-LAWATAN-MAKANAN-BAS.md` kepada pelan pelaksanaan. Ia tidak mengubah
> keputusan Fasa 1–6 yang sudah siap. Tunggu kelulusan pemilik sebelum menulis
> kod Fasa 7.
>
> Jika bercanggah, keutamaan ialah:
> 1. `ARAHAN-LAWATAN-MAKANAN-BAS.md` untuk lawatan, makanan dan bas.
> 2. `ARAHAN-TAMBAHAN-FASA7-10.md` untuk bajet, kewangan dan modul pengurusan.
> 3. `AGENTS.md` untuk peraturan am dan Fasa 1–6.
> 4. Dokumen ini untuk urutan pelaksanaan.

---

## 1. Keadaan semasa

| Perkara | Status |
|---|---|
| Fasa 1 Backend GAS | Siap |
| Fasa 2 Halaman awam | Siap |
| Fasa 3 Dashboard admin | Siap |
| Fasa 4 Checklist dan milestone | Siap |
| Fasa 5 Pengurusan pendaftaran | Siap |
| Fasa 6 Bajet, kehadiran, tetapan, README | Siap |
| Halaman fasilitator | Siap (sambungan pengguna) |
| MCP `mcp-ksq26/` | Siap (13 alat, 4 sumber, ujian) |
| Fasa 7 Skema dan organisasi | **Belum** |
| Fasa 8 Kewangan dan merchandise | **Belum** |
| Fasa 9 Sijil, tag dan dokumen | **Belum** |
| Fasa 10 Pipeline, laporan dan ujian akhir | **Belum** |

Asas yang sudah ada dan mesti dikekalkan:

- 7 helaian: `Pendaftaran`, `Tetapan`, `Tugasan`, `Milestone`, `Bajet`,
  `Kehadiran`, `Log`.
- `ADMIN_TOKEN` dan `FASILITATOR_TOKEN` dalam Script Properties.
- Semua masa `Asia/Kuala_Lumpur`; tarikh disimpan sebagai teks ISO 8601 `+08:00`.
- Frontend tanpa build step; teks dinamik melalui `textContent`.
- Eksport CSV UTF-8 BOM + CRLF; formula injection dineutralkan.
- `setupSheets()` tidak memadam data sedia ada.

---

## 2. Prinsip pelaksanaan

1. **Satu fasa pada satu masa.** Selepas setiap fasa: ujian, ringkasan,
   `CHANGELOG.md`, kemudian berhenti.
2. **Migrasi tanpa merosakkan.** `setupSheets()` hanya menambah helaian atau
   lajur yang hilang di hujung. Tiada lajur dipadam, tiada nama lajur ditukar.
3. **Data sedia ada kekal.** Seed hanya mengisi helaian kosong. Jika helaian
   sudah ada data, seed melangkau dan melaporkan bilangan yang dilangkau.
4. **Tiada angka rasmi tanpa pengesahan.** Semua kos seed ialah anggaran.
   Lencana "Perlu semakan bendahari" kekal sehingga disahkan.
5. **Tiada rahsia dalam repo.** `VIEWER_TOKEN` dan token lain hanya dalam
   Script Properties.
6. **Tiada data peribadi dalam respons awam.** Nombor telefon penjaga
   disamarkan untuk peranan baca sahaja.
7. **Setiap perubahan status diaudit.** Tulis ke `Log`; untuk lawatan, bas dan
   menu, tulis ke log khusus yang boleh dibaca sebagai garis masa.
8. **Keserasian ke belakang.** API Fasa 1–6 mesti terus berfungsi selepas
   migrasi. Ujian kontrak lama mesti lulus tanpa diubah (kecuali pembetulan
   pepijat yang didokumenkan).

---

## 3. Pindaan kewangan yang mengikat

| Perkara | Nilai |
|---|---|
| Siling perbelanjaan | **RM5,500** |
| Anggaran kos teras | **RM5,495** |
| Sasaran kos asal | sekitar RM5,400 |
| Yuran online | RM110 |
| Yuran manual | RM120 |
| Harga asal | RM180 |
| Hasil 40 online | RM4,400 |
| Hasil 40 manual | RM4,800 |
| Dana masjid pada siling, semua online | RM1,100 |
| Dana masjid pada siling, semua manual | RM700 |
| Dana masjid pada kos teras, semua online | RM1,095 |
| Dana masjid pada kos teras, semua manual | RM695 |

Formula tunggal:

```text
dana_masjid_diperlukan = max(0, jumlah_kos_dikira - hasil_yuran_diterima)
```

Peraturan:

- `jumlah_kos_dikira` = jumlah `anggaran_rm` bagi item yang **bukan**
  `Cadangan` dan **bukan** `Ditolak`.
- `hasil_yuran_diterima` = jumlah `yuran_rm` bagi pendaftaran yang
  `status_bayaran = Sudah` dan `status` bukan `Batal`.
- Item `Cadangan` tidak dikira sehingga status ditukar kepada `Diluluskan`
  dengan harga yang disahkan.
- `B04` (makanan) dikira mengikut `ARAHAN-LAWATAN-MAKANAN-BAS.md`: Hari 1–2
  RM4 + RM7 + RM4 seorang; Hari 3 roti krim sahaja dengan harga yang belum
  diberi. Jika harga roti krim kosong, B04 ialah **anggaran separa** dan
  dashboard mesti menunjukkannya.
- `B01` (bas) kekal RM1,200 sebagai anggaran sehingga sebut harga sebenar
  diterima. Jangan tukar `B01` secara automatik.
- Dashboard mesti memaparkan secara berasingan:
  kos dikira, siling, baki siling, hasil yuran diterima, sasaran yuran,
  dana masjid diperlukan, dana masjid diluluskan/diterima, dan baki dana.

---

## 4. Fasa 7 — Skema dan organisasi

### 4.1 Matlamat

Menambah asas data organisasi, fasilitator dan pembekal tanpa merosakkan 7
helaian sedia ada. Menyediakan peranan baca sahaja.

### 4.2 Perubahan helaian

**Pendaftaran** — tambah di hujung:

| Lajur | Jenis | Nota |
|---|---|---|
| `kumpulan` | teks | Kumpulan peserta; boleh kosong sehingga pembahagian dibuat. |
| `saiz_baju` | teks | Pilihan; hanya diisi jika baju diluluskan. |
| `no_sijil` | teks | Diisi oleh modul sijil; unik. |
| `layak_sijil` | teks | `Ya` / `Tidak`; dikira daripada kehadiran dan tetapan. |

**Bajet** — tukar kepada skema baharu:
`id | kategori | item | kuantiti | unit | harga_unit | anggaran_rm | sebenar_rm | status_kelulusan | pembekal_id | catatan`

**Tugasan** — tambah `pic_jawatan` di hujung. Nilai mesti merujuk
`Jawatankuasa.jawatan`; `pic` lama kekal untuk keserasian.

**Jawatankuasa** (baharu):
`id | unit | jawatan | tugas | nama | tel | status`

**Fasilitator** (baharu):
`id | nama | peranan | sesi | tel | elaun_rm | status_pengesahan | catatan`

**Pembekal** (baharu):
`id | nama | kategori | tel | sebut_harga_rm | tarikh_sebut_harga | status | catatan`

### 4.3 Migrasi

1. Naikkan `skema_versi` dalam `Tetapan` daripada `1` kepada `2`.
2. `setupSheets()` membaca pengepala setiap helaian.
3. Jika helaian tiada: cipta dengan pengepala penuh.
4. Jika helaian ada tetapi lajur baharu tiada: tambah lajur di hujung sahaja.
5. Jika lajur `Bajet` lama berbeza: **jangan** susun semula secara automatik.
   Isi nilai lalai:
   - `kuantiti = 1`
   - `unit = ''`
   - `harga_unit = anggaran_rm` jika hanya satu unit, jika tidak kosong
   - `status_kelulusan = 'Draf'`
   - `pembekal_id = ''`
6. Rekod tindakan migrasi dalam `Log` dan dalam laporan `db.info`.
7. `db.backup` mesti dijalankan sebelum migrasi sebenar; UI memaparkan
   peringatan.

### 4.4 API baharu

| Action | Peranan | Keterangan |
|---|---|---|
| `org.list` | admin, viewer | Senarai jawatankuasa. |
| `org.upsert` | admin | Tambah/kemas kini jawatan. |
| `fasilitator.list` | admin, viewer | Senarai fasilitator; telefon disamarkan untuk viewer. |
| `fasilitator.upsert` | admin | Tambah/kemas kini. |
| `fasilitator.delete` | admin | Padam satu rekod; log tindakan. |
| `pembekal.list` | admin, viewer | Senarai pembekal; telefon disamarkan untuk viewer. |
| `pembekal.upsert` | admin | Tambah/kemas kini. |
| `pembekal.delete` | admin | Padam satu rekod; log tindakan. |

`VIEWER_TOKEN`:
- Baca sahaja.
- Tidak boleh `register`, `updateRegistration`, `settings.set`, `seed`,
  `db.setup`, `db.backup`, atau mana-mana `upsert`/`delete`.
- Nombor telefon penuh tidak dipulangkan; gunakan topeng `01x-xxx 1234`.
-Jika pemilik mahu Ketua Unit Pendaftaran melihat telefon penuh, ini mesti
  keputusan berasingan dan didokumenkan; lalai ialah **tidak**.

### 4.5 UI

- Tab **Organisasi**: carta unit/jawatan, nama kosong dipaparkan merah sebagai
  `[ISI NAMA]`, senarai tugasan tertunggak bagi setiap jawatan.
- Tab **Fasilitator**: senarai, status pengesahan, sesi, elaun, jadual silang
  Hari 1–3, amaran jika bilangan disahkan kurang daripada bilangan elaun dalam
  bajet.
- Dashboard: kad ringkas "Organisasi belum lengkap" dengan bilangan
  `[ISI NAMA]`.

### 4.6 Ujian Fasa 7

- Migrasi daripada 7 helaian v1 kepada v2 mengekalkan semua baris dan nilai.
- Menjalankan `setupSheets()` dua kali tidak menghasilkan lajur berganda.
- `VIEWER_TOKEN` boleh `org.list`, `fasilitator.list`, `pembekal.list` tetapi
  gagal pada setiap tindakan tulis.
- Telefon dalam respons viewer adalah topeng.
- `tasks.list` lama masih mengembalikan `pic` dan kini juga `pic_jawatan`.
- Semua ID baharu unik dan menggunakan awalan yang didokumenkan.

### 4.7 Kriteria selesai Fasa 7

- [ ] Helaian baharu wujud dan boleh dibaca melalui API.
- [ ] Migrasi tidak memadam atau menyusun semula data lama.
- [ ] `VIEWER_TOKEN` diuji secara positif dan negatif.
- [ ] UI Organisasi dan Fasilitator memaparkan placeholder dengan jelas.
- [ ] `CHANGELOG.md` dan `TODO-PEMILIK.md` dikemas kini.

---

## 5. Fasa 8 — Kewangan dan merchandise

### 5.1 Matlamat

Menggantikan bajet mudah dengan bajet berstatus kelulusan, dana masjid,
pembekal, merchandise dan amaran risiko masa — tanpa melebihi RM5,500.

### 5.2 Helaian

**Bajet** menggunakan skema Fasa 7.

**Dana** (baharu):
`id | jenis | jumlah_rm | tarikh | rujukan | catatan`

`jenis`: `Permohonan` | `Kelulusan` | `Terima` | `Pulang`.

**Merchandise** (baharu):
`id | item | saiz_taburan | kuantiti | pembekal_id | status | tarikh_siap_dijangka | tarikh_diterima | catatan`

`saiz_taburan` ialah JSON ringkas, contoh `{"S":5,"M":20,"L":15,"XL":5}`.
`status`: `Cadangan` | `Sebut harga` | `Diluluskan` | `Reka bentuk` |
`Bukti cetak diluluskan` | `Ditempah` | `Siap` | `Diterima` | `Diagih`.

**Pembekal** menggunakan skema Fasa 7. Untuk membandingkan sekurang-kurangnya
3 sebut harga, simpan 3 baris pembekal bagi kategori yang sama; status
`Dipilih` menandakan pemenang. Tiada helaian sebut harga tambahan diperlukan
pada Fasa 8.

### 5.3 Peraturan kewangan

1. Item `Cadangan` dan `Ditolak` tidak dikira.
2. `Diluluskan` mesti mempunyai harga; jika tidak, amaran.
3. `sebenar_rm` hanya diisi selepas bayaran; jangan samakan dengan komitmen.
4. `dana_masjid_diperlukan` dikira daripada yuran yang benar-benar diterima.
5. `Dana` jenis `Terima` menambah dana diterima; `Pulang` mengurangkan.
6. Baki dana = dana diterima - perbelanjaan sebenar yang dibayar.
7. Jika kos dikira melebihi siling, dashboard memaparkan amaran merah dan
   menghalang eksport laporan "muktamad" sehingga diselesaikan.
8. B04 dikira mengikut arahan makanan; B01 kekal anggaran sehingga sebut harga.

### 5.4 API baharu

| Action | Peranan | Keterangan |
|---|---|---|
| `budget.list` | admin, viewer | Kini memulangkan medan baharu dan ringkasan. |
| `budget.upsert` | admin | Validasi status, kuantiti, harga. |
| `budget.delete` | admin | Padam item; log. |
| `merch.list` | admin, viewer | Senarai merchandise dan taburan saiz. |
| `merch.upsert` | admin | Tambah/kemas kini. |
| `merch.delete` | admin | Padam; log. |
| `dana.list` | admin, viewer | Senarai dana. |
| `dana.add` | admin | Tambah satu pergerakan dana. |
| `report.summary` | admin, viewer | Ringkasan kewangan dan program. |

### 5.5 UI

- **Bajet** v2: jadual item, status kelulusan, anggaran vs sebenar, jumlah
  dikira, siling, baki, pembuka kategori, butang "Hantar untuk kelulusan".
- **Kewangan/Dana**: kad jurang pembiayaan, jadual dana, hasil yuran, baucar
  pembekal, baki.
- **Merchandise**: kad setiap item dengan jalur status, pembekal, sebut harga,
  tarikh siap dijangka, taburan saiz daripada `saiz_baju` pendaftaran.
- **Pembekal**: jadual perbandingan sekurang-kurangnya 3 sebut harga,
  tanda `Dipilih`.
- Amaran risiko masa merchandise:
  - tarikh siap dijangka melepasi 14 Disember; atau
  - status belum `Ditempah` pada 3 Disember.
- Semua amaran mengira hari kalendar Kuala Lumpur.

### 5.6 Ujian Fasa 8

- Jumlah dikira mengecualikan `Cadangan`/`Ditolak`.
- Formula dana masjid menghasilkan RM1,100 / RM700 / RM1,095 / RM695 mengikut
  senario.
- Yuran `Menunggu` dan `Senarai Tunggu` tidak dikira sebagai diterima.
- B04 dengan 45 orang: Hari 1–2 RM1,350; roti krim RM4 -> RM1,530;
  roti krim RM6 -> RM1,620; harga kosong -> "separa".
- B04 berubah apabila bilangan peserta disahkan berubah.
- Amaran siling muncul apabila jumlah > RM5,500.
- Amaran risiko merchandise betul pada 3 Dis dan 14 Dis.
- `VIEWER_TOKEN` tidak boleh menulis bajet/merch/dana.

### 5.7 Kriteria selesai Fasa 8

- [ ] Dashboard memaparkan semua angka kewangan yang diwajibkan.
- [ ] Tiada item `Cadangan` dikira secara senyap.
- [ ] B04 dipaparkan sebagai separa jika harga roti krim kosong.
- [ ] B01 tidak berubah tanpa pengesahan bendahari.
- [ ] Halaman Merchandise dan Pembekal berfungsi pada telefon.
- [ ] Ujian kewangan lulus dan `CHANGELOG.md` dikemas kini.

---

## 6. Fasa 9 — Sijil, tag dan dokumen

### 6.1 Matlamat

Menghasilkan sijil dan tag tanpa nombor siri berganda, menjejak surat, dan
mengimport peserta CSV dengan selamat.

### 6.2 Helaian

**Sijil** (baharu):
`id_peserta | no_sijil | dicetak | tarikh_cetak | diserah | catatan`

**Surat** (baharu):
`id | tajuk | penerima | tarikh_dihantar | status | rujukan | catatan`

`status`: `Draf` | `Dihantar` | `Dibalas` | `Ditolak`.

### 6.3 Peraturan sijil

1. Kelayakan lalai: hadir sekurang-kurangnya **2 daripada 3 hari**.
2. Tetapan `sijil_min_hari` boleh diubah; jangan kod keras.
3. `no_sijil` dijana daripada nombor siri terakhir dalam `Sijil`; unik.
4. Jika dua permintaan serentak, gunakan `LockService` supaya nombor tidak
   berganda.
5. `templates/sijil.html` menerima `?senarai=Nama1|Nama2&mula=<no_siri>`.
6. Nama panjang tidak dipotong; susun atur mencetak A4 landskap.
7. URL dipecah kepada kelompok **20 nama**; setiap parameter
   `encodeURIComponent`.
8. Selepas cetak: `dicetak = Ya`, `tarikh_cetak` diisi. Selepas serah:
   `diserah = Ya`.
9. Jangan tanda `diserah` secara automatik selepas cetak.

### 6.4 Peraturan tag nama

1. `templates/tag-nama.html` menerima
   `?senarai=Nama;Kumpulan;peranan|...`.
2. Sertakan peserta, fasilitator dan AJK.
3. Kelompok 20; `encodeURIComponent`.
4. Nama kosong dipaparkan `[ISI NAMA]`, bukan ruang kosong.

### 6.5 Import CSV

1. Format: `peserta-import-templat.csv`.
2. Tolak baris contoh `Contoh Nama Peserta`.
3. Tolak pendua mengikut `tel_penjaga + nama_peserta`.
4. Validasi umur, jantina, telefon, `lancar_quran`.
5. `kaedah_daftar = manual`, yuran manual RM120.
6. Jika kapasiti penuh, status `Senarai Tunggu`.
7. Formula injection dineutralkan sebelum menulis.
8. Pulangkan ringkasan: diterima, ditolak, pendua, sebab.
9. Had saiz fail dan bilangan baris; jangan biarkan satu import menggantung
   Web App.

### 6.6 API baharu

| Action | Peranan | Keterangan |
|---|---|---|
| `sijil.list` | admin, viewer | Senarai dan kelayakan. |
| `sijil.generate` | admin | Jana nombor siri untuk peserta layak. |
| `sijil.markPrinted` | admin | Tanda dicetak dan tarikh. |
| `sijil.markGiven` | admin | Tanda diserah. |
| `surat.list` | admin, viewer | Senarai surat. |
| `surat.upsert` | admin | Tambah/kemas kini. |
| `import.peserta` | admin | Import CSV. |

### 6.7 UI

- Tab **Sijil**: kelayakan, butang cetak terpilih/semua layak, nombor siri
  seterusnya, status cetak/serah.
- Tab **Surat**: pengesan surat, pautan ke `docs/spesifikasi/templat-surat.md`,
  checklist dokumen (kertas kerja, itinerari, modul, borang kebenaran,
  indemniti).
- **Daftar**: panel import CSV dengan pratonton dan ringkasan.
- Semua teks dinamik melalui `textContent`.

### 6.8 Ujian Fasa 9

- Dua permintaan sijil serentak tidak menghasilkan nombor siri berganda.
- Nama panjang (80 aksara) tidak terpotong dalam templat.
- Kelompok URL 20 nama betul; parameter di-encode.
- CSV dengan huruf Melayu, apostrof, sengkang dan `@` diimport dengan betul.
- Baris contoh dan pendua ditolak.
- `VIEWER_TOKEN` tidak boleh menjana/menanda sijil atau mengimport.
- `sijil_min_hari` berubah tanpa ubah kod.

### 6.9 Kriteria selesai Fasa 9

- [ ] Sijil boleh dicetak dan nombor siri tidak berganda.
- [ ] Tag nama peserta/fasilitator/AJK boleh dicetak.
- [ ] Surat boleh dijejak.
- [ ] Import CSV selamat dan memberi ringkasan.
- [ ] `TODO-PEMILIK.md` menyenaraikan penandatangan dan keputusan sijil.

---

## 7. Fasa 10 — Pipeline, laporan dan ujian akhir

### 7.1 Pipeline

Lima peringkat, semua gate mesti ditanda sebelum bergerak:

| Peringkat | Gate |
|---|---|
| 1 Perancangan dan kelulusan | Kertas kerja dilulus, siling RM5,500 dilulus, dana masjid dimohon, AJK dilantik |
| 2 Promosi dan pendaftaran | Poster ada telefon dan QR, borang diuji, pautan disebar, bayaran disemak harian |
| 3 Persediaan | Destinasi disahkan, bas ditempah, penceramah/fasilitator disahkan, modul/tag/sijil bercetak, merchandise diterima |
| 4 Pelaksanaan | Hari 1, 2, 3; kehadiran direkod setiap hari |
| 5 Penutup | Sijil diserah, laporan akhir, kewangan diselaras, baki dana selesai |

- Peringkat semasa dikira daripada status tugasan dan data program, **bukan**
  diedit manual.
- Papar peratus kemajuan setiap peringkat dan gate yang belum lengkap.
- Jika data tidak cukup, papar "belum dapat dikira", bukan 0% yang mengelirukan.

### 7.2 Laporan akhir

Ringkasan automatik:

- bilangan peserta: disahkan, menunggu, senarai tunggu, batal;
- kaedah daftar: online vs manual;
- kehadiran setiap hari dan kadar;
- kewangan: anggaran vs sebenar, yuran diterima, dana masjid, baki;
- status tugasan: selesai, lewat, belum;
- senarai pembekal dan sebut harga dipilih;
- lawatan, makanan dan bas: status pengesahan.

Laporan boleh dicetak sebagai PDF melalui pelayar. Jangan tambah pakej PDF.

### 7.3 Ujian beban dan privasi

- Ujian 50 pendaftaran serentak: skrip Node berasingan yang dijalankan pemilik
  terhadap deployment sebenar. Ia mesti melaporkan bilangan berjaya, senarai
  tunggu, pendua dan ralat. Jangan jalankan terhadap data produksi tanpa
  kebenaran.
- Semak semula: endpoint awam tiada nama/telefon; viewer tidak melihat telefon
  penuh; token tiada dalam repo; CSV BOM; `textContent`; formula injection.
- Semak aksesibiliti: fokus papan kekunci, kontras, saiz butang 44px, skrin
  390px.

### 7.4 Kriteria selesai Fasa 10

- [ ] Pipeline memaparkan 5 peringkat dan gate yang belum lengkap.
- [ ] Laporan akhir menjumlahkan data dengan betul.
- [ ] Ujian beban didokumenkan dan dijalankan oleh pemilik.
- [ ] Semakan privasi dan aksesibiliti lulus.
- [ ] `README.md`, `ARCHITECTURE.md`, `CHANGELOG.md` dan `TODO-PEMILIK.md`
      dikemas kini.
- [ ] Tiada rahsia, tiada placeholder yang tidak disenaraikan.

---

## 8. Peranan dan token selepas Fasa 10

| Token | Baca | Tulis | Telefon penuh |
|---|---|---|---|
| `ADMIN_TOKEN` | Semua | Semua | Ya |
| `VIEWER_TOKEN` | Semua kecuali log sensitif | Tiada | Tidak (topeng) |
| `FASILITATOR_TOKEN` | Peserta Disahkan, kehadiran | Kehadiran sahaja | Ya untuk urusan kehadiran, tetapi tidak dipaparkan dalam senarai awam |
| Tiada token | `stats` dan `register` | `register` sahaja | Tidak |

Nota:

- `VIEWER_TOKEN` tidak boleh membaca `Log` penuh jika ia mengandungi butiran
  peribadi.
- `FASILITATOR_TOKEN` tidak boleh membaca bajet, tetapan, senarai pendaftaran
  penuh atau mengubah pendaftaran.
- Jika pemilik mahu Ketua Unit Pendaftaran melihat telefon penuh, buat token
  peranan keempat atau kebenaran khas; jangan longgarkan `VIEWER_TOKEN`.

---

## 9. Pangkalan data dan sandaran

1. Sebelum Fasa 7: jalankan `db.backup` dan simpan salinan di Drive.
2. Selepas setiap migrasi: jalankan `db.info`, semak `missingSheets`,
   `headerMismatch`, `duplicateIds`, `attendanceOrphans`.
3. Jangan ubah nama lajur selepas migrasi.
4. Jika migrasi gagal: pulihkan sandaran, betulkan kod, ulang pada salinan.
5. Ujian migrasi menggunakan salinan Sheet, bukan data produksi.

---

## 10. Fail yang akan ditambah/diubah

```text
backend/Code.gs                 migrasi, action, peranan, log
backend/PASANG-GAS.md           langkah VIEWER_TOKEN, migrasi, sandaran
web/admin.html                  tab Organisasi, Fasilitator, Kewangan,
                                Merchandise, Pembekal, Sijil, Surat, Laporan
web/js/admin.js                 pengawal tab dan borang baharu
web/css/style.css               kad, jalur status, jadual, cetak
web/data/seed-jawatankuasa.json sudah ada; disemak
web/data/seed-fasilitator.json  sudah ada; disemak
web/data/seed-tugasan-lanjutan.json sudah ada; digabung tanpa pendua
web/data/seed-bajet.json        skema v2; B01/B04 dikemas kini dengan kelulusan
web/data/seed-lawatan.json      baharu (Fasa 11)
web/data/seed-makanan.json      baharu (Fasa 12)
web/data/seed-bas.json          baharu (Fasa 12)
web/templates/sijil.html        sudah ada; disambung
web/templates/tag-nama.html     sudah ada; disambung
tests/*.test.js                 ujian baharu
mcp-ksq26/lib/tools.js          alat baharu (pilihan, read-only dahulu)
PLAN-ADDENDUM.md                dokumen ini
README.md                       kemas kini pemasangan
CHANGELOG.md                    rekod setiap fasa
TODO-PEMILIK.md                 placeholder baharu
```

---

## 11. Soalan terbuka yang mesti dijawab pemilik

### 11.1 Daripada addendum

1. Adakah Ust Shahril dan Khairul Anuar fasilitator berelaun, atau penceramah
   sahaja? Berapa fasilitator berelaun sebenar (4 atau 5)?
2. Item pilihan mana (baju, lencana, fail, beg) yang akan diluluskan dan siapa
   menaja?
3. Kriteria kelayakan sijil: hadir minimum berapa hari? (Lalai cadangan: 2.)
4. Siapa penandatangan sijil (nama dan jawatan)?
5. Adakah `saiz_baju` mahu dikumpul pada borang? (Hanya jika baju diluluskan.)
6. Siapa yang akan memegang `ADMIN_TOKEN` dan `VIEWER_TOKEN`?

### 11.2 Daripada arahan lawatan/makanan/bas

7. Nama dan telefon PIC Yayasan Restu dan Muzium Sultan Alam Shah.
8. Kadar bayaran kumpulan, deposit dan syarat setiap lokasi.
9. Slot masa yang diluluskan untuk setiap lokasi dan masa perjalanan antara
   lokasi.
10. Menu sebenar Hari 1–2 dan pembekal makanan.
11. Harga roti krim seorang dan masa ia diedarkan pada Hari 3.
12. Bilangan makan: 45 (40 peserta + 5 fasilitator) atau termasuk AJK/pemandu?
13. Syarikat bas, jenis bas, kapasiti tempat duduk, kos sebut harga, deposit
    dan sama ada tol/parkir/makan pemandu termasuk.
14. Masa bertolak dan masa pulang sebenar Hari 3; adakah program melebihi
    5:00 petang?
15. Adakah makan tengah hari Hari 3 benar-benar tiada? Jika peserta perlu
    makan, siapa membekal dan bagaimana kos dimasukkan?

### 11.3 Teknikal

16. Adakah `VIEWER_TOKEN` perlu melihat telefon penuh untuk unit pendaftaran?
    (Lalai: tidak.)
17. Adakah 3 sebut harga pembekal disimpan sebagai 3 baris `Pembekal` atau
    helaian `SebutHarga` berasingan? (Cadangan: 3 baris `Pembekal`.)
18. Adakah laporan akhir perlu format surat rasmi atau jadual cetak biasa?
19. Adakah data peserta sedia ada perlu diimport dari Google Form/Sheet lama?
20. Berapa lama data disimpan selepas program? (Cadangan: 12 bulan, kemudian
    arkib dan padam data peribadi.)

---

## 12. Risiko dan mitigasi

| Risiko | Kesan | Mitigasi |
|---|---|---|
| Migrasi merosakkan lajur Bajet | Data kewangan hilang | Sandaran wajib, migrasi tambah-lajur sahaja, ujian pada salinan |
| Item `Cadangan` tersilap dikira | Bajet melebihi siling | Penapis status di server dan ujian |
| Nombor sijil berganda | Sijil tidak sah | `LockService`, nombor unik, ujian serentak |
| Nama panjang terpotong | Sijil rosak | Ujian 80 aksara, reka bentuk fleksibel |
| Telefon terdedah kepada viewer | Pelanggaran privasi | Topeng di server, bukan hanya UI |
| Harga roti krim direka | Bajet tidak tepat | Input kosong, amaran "belum diisi" |
| Sebut harga bas berubah | Melebihi RM1,200 | Bandingkan, kelulusan bendahari, jangan tukar B01 automatik |
| Tarikh lawatan tidak disahkan | Jadual Hari 3 runtuh | Panel Belum Disahkan, amaran 14/7/1 hari, pelan alternatif |
| Import CSV besar menggantung GAS | Web App tidak responsif | Had baris/saiz, kelompok, ringkasan ralat |
| Viewer boleh menulis | Data rosak | Matriks peranan diuji setiap tindakan |

---

## 13. Urutan kerja yang dicadangkan

1. Pemilik menjawab soalan 11.1–11.3 yang menghalang Fasa 7.
2. Sandaran Sheet.
3. Fasa 7: skema, migrasi, organisasi, fasilitator, pembekal, viewer.
4. Ujian Fasa 7; berhenti.
5. Fasa 8: bajet v2, dana, merchandise, pembekal, amaran.
6. Ujian Fasa 8; berhenti.
7. Fasa 9: sijil, tag, surat, import.
8. Ujian Fasa 9; berhenti.
9. Fasa 10: pipeline, laporan, ujian beban, privasi.
10. Ujian Fasa 10; kemas kini dokumen; serah.

---

## 14. Definisi siap keseluruhan

- [ ] Semua Fasa 7–10 lulus ujian dan didokumenkan.
- [ ] Tiada regresi pada Fasa 1–6.
- [ ] Semua placeholder `[ISI ...]` disenaraikan dalam `TODO-PEMILIK.md`.
- [ ] Tiada rahsia dalam repo.
- [ ] Dashboard memaparkan jurang kewangan dengan jujur.
- [ ] Viewer dan fasilitator tidak boleh mengubah data di luar peranan.
- [ ] Laporan akhir boleh dicetak.
- [ ] Pemilik boleh memasang dari `README.md` tanpa bantuan pengaturcara.

---

## 15. Kelulusan

Pelan ini **tidak** memberi kebenaran untuk menulis kod Fasa 7–10. Pemilik perlu
menulis atau menyatakan:

> "Saya luluskan PLAN-ADDENDUM.md. Laksanakan Fasa 7 sahaja. Berhenti selepas
> ujian lulus."

Selepas kelulusan, agent mesti mengemas kini bahagian status dalam dokumen ini
dan `PLAN.md` sebelum memulakan Fasa 7.
