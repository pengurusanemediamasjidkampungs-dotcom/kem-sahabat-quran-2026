# ARAHAN TAMBAHAN (ADDENDUM): PENGURUSAN PENUH KSQ 2026

> Fail ini MELENGKAPKAN `AGENTS.md`. Baca `AGENTS.md` dahulu. Jika ada percanggahan, **fail ini mengatasi** untuk bajet, kewangan dan modul pengurusan. Peraturan agent (Bahagian 1 AGENTS.md) tetap terpakai: satu fasa pada satu masa, jangan reka maklumat, tiada rahsia dalam kod.

## 0. Letak fail dalam projek (Windows)
```
ksq-sistem\
  docs\spesifikasi\spesifikasi-merchandise.md, templat-surat.md
  web\data\seed-bajet.json, seed-jawatankuasa.json, seed-fasilitator.json,
           seed-tugasan-lanjutan.json, peserta-import-templat.csv
  web\templates\sijil.html, tag-nama.html
  assets\logo.png
```
Templat membaca logo di `..\assets\logo.png` (relatif dari `web\templates\`). Pastikan laluan ini wujud, atau laraskan dan catat dalam CHANGELOG.

## 1. Pindaan kewangan (menggantikan Bahagian 7 bajet AGENTS.md)
- Sasaran kos ~RM5,400; **siling RM5,500**. Anggaran kos teras daripada seed: **RM5,495** (sebahagiannya anggaran atas, contohnya tiket muzium RM5 x 40).
- Yuran: online RM110, manual RM120, harga asal RM180. Hasil jika 40 orang online = RM4,400; jika semua manual = RM4,800.
- **Penganjur (masjid) menyediakan dana** untuk menampung jurang. Formula tunggal dalam sistem: `dana_masjid_diperlukan = max(0, jumlah_kos_dikira - hasil_yuran_diterima)`. Pada siling dan semua online ia ialah RM1,100; pada kos teras ialah RM1,095.
- Item bajet berstatus `Cadangan` (baju, lencana, fail, beg, kit pertolongan cemas) TIDAK dikira sehingga bendahari memberi harga dan menukar status kepada `Diluluskan`.
- Dashboard mesti paparkan: kos dikira vs siling (amaran merah jika melebihi), hasil yuran diterima vs sasaran, dana masjid diperlukan (langsung), dana masjid diluluskan/diterima, baki. Jangan sorokkan jurang.
- Semua angka seed ialah anggaran. Jangan paparkannya sebagai "rasmi". Letak lencana "Perlu semakan bendahari" sehingga bendahari menanda disahkan.

## 2. Helaian baharu dan lajur tambahan (Google Sheets)
Kekalkan helaian lama. Tambah/kemas kini melalui `setupSheets()` secara tidak merosakkan (jika helaian wujud, tambah lajur hilang di hujung, jangan padam data).

- **Pendaftaran** tambah: `kumpulan`, `saiz_baju` (pilihan), `no_sijil`, `layak_sijil`.
- **Bajet** tukar kepada: `id | kategori | item | kuantiti | unit | harga_unit | anggaran_rm | sebenar_rm | status_kelulusan | pembekal_id | catatan`.
- **Jawatankuasa**: `id | unit | jawatan | tugas | nama | tel | status`.
- **Fasilitator**: `id | nama | peranan | sesi | tel | elaun_rm | status_pengesahan | catatan`.
- **Pembekal**: `id | nama | kategori | tel | sebut_harga_rm | tarikh_sebut_harga | status | catatan`.
- **Merchandise**: `id | item | saiz_taburan(JSON) | kuantiti | pembekal_id | status | tarikh_siap_dijangka | tarikh_diterima | catatan`. Status: `Cadangan, Sebut harga, Diluluskan, Reka bentuk, Bukti cetak diluluskan, Ditempah, Siap, Diterima, Diagih`.
- **Sijil**: `id_peserta | no_sijil | dicetak | tarikh_cetak | diserah | catatan`.
- **Dana**: `id | jenis(Permohonan|Kelulusan|Terima|Pulang) | jumlah_rm | tarikh | rujukan | catatan`.
- **Surat**: `id | tajuk | penerima | tarikh_dihantar | status(Draf|Dihantar|Dibalas|Ditolak) | rujukan | catatan`.
- **Tugasan** tambah lajur `pic_jawatan` (rujuk `Jawatankuasa.jawatan`).

`seedData()` memuatkan fail `web\data\seed-*.json` yang sepadan (hanya jika helaian kosong). Admin boleh menjalankan seed melalui UI atau apps script; agent tidak perlu menyalin JSON ke dalam `Code.gs` jika boleh dimuat naik melalui `action=seed` dengan badan JSON dari frontend.

## 3. API tambahan (admin, perlu token)
`org.list|upsert`, `fasilitator.list|upsert|delete`, `pembekal.list|upsert|delete`, `merch.list|upsert|delete`, `sijil.list|generate|markPrinted|markGiven`, `dana.list|add`, `surat.list|upsert`, `report.summary` (angka laporan akhir), `import.peserta` (CSV rujuk `peserta-import-templat.csv`, tolak baris sampel dan pendua).

Tambah **`VIEWER_TOKEN`** (Script Properties): akses baca sahaja untuk AJK. Pemilik/pengarah/bendahari guna `ADMIN_TOKEN`. Elak papar nama dan telefon penjaga kepada token baca sahaja, kecuali halaman Daftar yang dikecualikan untuk Ketua Unit Pendaftaran (jika tidak mahu kerumitan, rekod semua `VIEWER_TOKEN` tidak melihat nombor telefon; masking `01x-xxx 1234`).

## 4. Pipeline projek (papar di Dashboard sebagai langkah mendatar)
| Peringkat | Pintu keluar (gate), semua perlu ditanda sebelum bergerak |
|---|---|
| 1 Perancangan dan kelulusan | Kertas kerja dilulus, siling RM5,500 dilulus, dana masjid dimohon, AJK dilantik |
| 2 Promosi dan pendaftaran | Poster ada telefon dan QR, borang diuji, pautan disebar, bayaran disemak harian |
| 3 Persediaan | Destinasi disahkan (Yayasan Restu, Muzium, Masjid Negeri), bas ditempah, penceramah dan fasilitator disahkan, modul/tag/sijil bercetak, merchandise diterima |
| 4 Pelaksanaan | Hari 1, Hari 2, Hari 3 (kehadiran direkod setiap hari) |
| 5 Penutup | Sijil diserah, laporan akhir, kewangan diselaras, baki dana selesai |
Peringkat semasa dikira daripada status tugasan, bukan diedit manual. Papar % kemajuan setiap peringkat dan gate yang belum lengkap.

## 5. Halaman admin tambahan
1. **Organisasi**: carta unit dan jawatan, kosong = "[ISI NAMA]" ditandakan merah. Papar tugasan yang tertunggak bagi setiap jawatan.
2. **Fasilitator dan penceramah**: senarai, status pengesahan, sesi, elaun, jadual silang (siapa bertugas Hari 1-3). Amaran jika bilangan disahkan kurang daripada bilangan elaun dalam bajet.
3. **Merchandise**: kad bagi setiap item dengan jalur status (aliran dalam Bahagian 2), pembekal, sebut harga, tarikh siap dijangka. Amaran **"risiko masa"** jika tarikh siap dijangka melepasi 14 Disember atau jika status belum `Ditempah` pada 3 Disember. Jadual taburan saiz diambil daripada `saiz_baju` pendaftaran.
4. **Pembekal dan sebut harga**: bandingkan sekurang-kurangnya 3 sebut harga bagi setiap kategori, tanda yang dipilih.
5. **Sijil**: papar kelayakan (lalai: hadir sekurang-kurangnya 2 daripada 3 hari; boleh ubah di Tetapan, jangan hardcode), butang "Cetak sijil terpilih/semua layak" yang membuka `templates/sijil.html?senarai=Nama1|Nama2&mula=<no_siri_seterusnya>` dalam tab baharu; ambil nombor siri daripada helaian Sijil supaya tidak berganda; tanda `dicetak` dan `diserah`. Had panjang URL: pecah kepada kelompok 20 nama.
6. **Tag nama**: butang "Cetak tag" membuka `templates/tag-nama.html?senarai=Nama;Kumpulan;peranan|...` (peserta, fasilitator, ajk). Pecah kepada kelompok 20.
7. **Dana dan kewangan**: papar jadual Dana, hasil yuran, baucar/bayaran pembekal (rujuk `Bajet.sebenar_rm`). Kad "Jurang pembiayaan" seperti Bahagian 1.
8. **Surat dan dokumen**: pengesan surat (Draf, Dihantar, Dibalas) dengan pautan ke teks dalam `docs\spesifikasi\templat-surat.md`; checklist dokumen: kertas kerja, itinerari, modul, borang kebenaran, indemniti.
9. **Laporan akhir** (`report.html` atau tab cetak): ringkasan automatik, bilangan peserta, kaedah daftar, kehadiran setiap hari, kewangan (anggaran vs sebenar, dana masjid), status tugasan, senarai pembekal. Boleh dicetak sebagai PDF melalui pelayar.
Semua teks dalam DOM guna `textContent`. Semua parameter URL ke templat mesti di-`encodeURIComponent`.

## 6. Data awal (seed) yang dibekalkan
`seed-jawatankuasa.json` (13 jawatan, nama kosong), `seed-fasilitator.json` (Ust Shahril, Khairul Anuar + 5 tempat kosong; sahkan ejaan nama dan sama ada mereka fasilitator berelaun atau penceramah sahaja), `seed-tugasan-lanjutan.json` (40 tugasan; **tarikh ialah cadangan**), `seed-bajet.json`. Gabungkan tugasan lanjutan dengan tugasan dalam `AGENTS.md` Bahagian 7; jika ada pertindihan, kekalkan satu dan catat dalam CHANGELOG. Jangan padam yang sedia ada.

## 7. FASA
**Fasa 7, Skema dan organisasi.** Kemas kini `setupSheets()`/API untuk helaian baharu, Jawatankuasa, Fasilitator, Pembekal; halaman Organisasi dan Fasilitator; token baca sahaja.
**Fasa 8, Kewangan dan merchandise.** Bajet baharu dengan status kelulusan, dana masjid, jurang pembiayaan, halaman Merchandise dan Pembekal, amaran risiko masa.
**Fasa 9, Sijil, tag dan dokumen.** Integrasi templat, penomboran siri, log cetak, import CSV, Surat tracker.
**Fasa 10, Pipeline, laporan dan ujian akhir.** Pipeline dan gate, laporan akhir, ujian beban ringan (50 pendaftaran serentak), semakan privasi, kemas kini README.
Setiap fasa: bina, uji, ringkaskan, **berhenti**. Mulakan dengan `PLAN-ADDENDUM.md` (tiada kod) dan soalan terbuka.

## 8. Soalan terbuka (agent mesti tanya, jangan teka)
1. Adakah Ust Shahril dan Khairul Anuar fasilitator berelaun, atau penceramah sahaja? Berapa fasilitator berelaun sebenar (4 atau 5)?
2. Item pilihan mana (baju, lencana, fail, beg) yang akan diluluskan dan siapa menaja?
3. Kriteria kelayakan sijil: hadir minimum berapa hari?
4. Siapa penandatangan sijil (nama dan jawatan)?
5. Adakah `saiz_baju` mahu dikumpul pada borang (hanya jika baju diluluskan)?
6. Siapa yang akan memegang `ADMIN_TOKEN` dan `VIEWER_TOKEN`?

## 9. Kriteria siap tambahan
- [ ] Kos dikira tidak termasuk item `Cadangan`; amaran muncul bila melebihi RM5,500.
- [ ] Dana masjid diperlukan dikira daripada hasil yuran sebenar yang direkod `Sudah`.
- [ ] Sijil tidak boleh dicetak dengan nombor siri berganda; nama panjang tidak terpotong.
- [ ] `VIEWER_TOKEN` tidak boleh mengubah data atau melihat telefon penuh.
- [ ] Eksport/Import CSV melepasi ujian dengan nama berbahasa Melayu dan simbol (' - @).
- [ ] Semua placeholder `[ISI ...]` disenaraikan dalam `TODO-PEMILIK.md`.
