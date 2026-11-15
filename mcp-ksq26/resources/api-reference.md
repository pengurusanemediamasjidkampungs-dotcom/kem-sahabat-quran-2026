# Rujukan API KSQ 2026

Satu URL deployment Apps Script: `https://script.google.com/macros/s/<ID>/exec`.

## Bentuk permintaan

- GET: `/exec?action=stats`
- POST: `Content-Type: text/plain;charset=utf-8`, badan `{"action":"...","token":"..."}`.
- POST digunakan untuk semua tindakan admin supaya token tidak muncul dalam URL atau log pelayar.
- Setiap respons: `{ "ok": true, "data": ..., "serverTime": "2026-...+08:00" }` atau `{ "ok": false, "error": "...", "code": "..." }`.

## Tindakan awam

| Action | Kaedah | Keterangan |
|---|---|---|
| `stats` | GET | Kapasiti, bilangan status, baki slot, yuran, tarikh tutup. Tiada data peribadi. |
| `register` | POST | Cipta pendaftaran. Medan: `nama_peserta`, `umur`, `jantina`, `nama_penjaga`, `tel_penjaga`, `lancar_quran`, `alahan_kesihatan`, `persetujuan_data`, `website` (honeypot). |

## Tindakan admin

Semua memerlukan `token` = `ADMIN_TOKEN`.

| Action | Keterangan |
|---|---|
| `list` | Senarai pendaftaran. |
| `updateRegistration` | Kemas kini `status`, `status_bayaran`, `rujukan_bayaran`, `catatan`. |
| `registration.createManual` | Tambah pendaftaran manual. |
| `tasks.list`, `tasks.upsert`, `tasks.delete` | Checklist. |
| `milestones.list`, `milestones.upsert`, `milestones.delete` | Milestone. |
| `budget.list`, `budget.upsert`, `budget.delete` | Bajet. |
| `attendance.list`, `attendance.mark` | Kehadiran (admin atau fasilitator). |
| `facilitator.participants` | Peserta Disahkan tanpa data bayaran (admin atau fasilitator). |
| `settings.get`, `settings.set` | Tetapan. |
| `seed` | Isi helaian kosong dengan data awal. |
| `db.info`, `db.setup`, `db.backup` | Penyelenggaraan pangkalan data. |

## Tindakan fasilitator

`FASILITATOR_TOKEN` hanya boleh:

- `attendance.list`
- `attendance.mark`
- `facilitator.participants`

Ia tidak boleh membaca bajet, tetapan, senarai pendaftaran penuh atau mengubah pendaftaran.

## Helaian

`Pendaftaran`, `Tetapan`, `Tugasan`, `Milestone`, `Bajet`, `Kehadiran`, `Log`.

Fasa 7-10 akan menambah `Jawatankuasa`, `Fasilitator`, `Pembekal`, `Merchandise`, `Sijil`, `Dana`, `Surat` dan lajur baharu. Lihat `PLAN-ADDENDUM.md`.

## Ralat biasa

| Code | Maksud |
|---|---|
| `UNAUTHORIZED` | Token tiada atau salah. |
| `VALIDATION` | Medan tidak sah. |
| `NOT_FOUND` | ID tidak dijumpai. |
| `NOT_CONFIRMED` | Peserta belum Disahkan (kehadiran). |
| `BUSY` | Kunci pelayan sedang digunakan; cuba lagi. |
| `SETUP_REQUIRED` | Helaian belum disediakan; jalankan `setupSheets`. |
| `UNKNOWN_ACTION` | Action tidak dikenali. |
