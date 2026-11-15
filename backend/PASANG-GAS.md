# PASANG-GAS — Panduan memasang backend KSQ 2026

Panduan ini untuk **pemilik projek**, bukan pengaturcara. Ikut langkah mengikut urutan.
Anda memerlukan akaun Google yang akan menjadi pemilik pangkalan data dan Web App.

> **Prinsip penting:** Google Sheet ialah pangkalan data. Jangan kongsi Sheet kepada
> "Anyone with the link". Web App pula perlu diakses "Anyone" supaya borang awam boleh
> menghantar data, tetapi ia hanya membenarkan tindakan yang dikawal oleh kod.

---

## 1. Cipta Google Sheet

1. Buka <https://sheets.google.com> dan klik **Blank spreadsheet**.
2. Namakan fail: **KSQ 2026 - Pangkalan Data**.
3. Jangan taip apa-apa lagi. Helaian akan dicipta oleh sistem.
4. Tutup perkongsian awam: **Share → General access → Restricted**.

## 2. Buka Apps Script dan tampal kod

1. Dalam Sheet, klik **Extensions → Apps Script**.
2. Padam kandungan lalai dalam `Code.gs`.
3. Buka fail `backend/Code.gs` dari komputer anda, salin **semua** kandungan, dan tampal
   ke dalam editor Apps Script.
4. Klik **Save** (ikon disket) dan namakan projek: **KSQ 2026 Backend**.
5. Klik **Project Settings** (ikon gear) → tandakan **Show "appsscript.json" manifest
   file in editor**.
6. Buka `appsscript.json` dalam editor dan ganti kandungannya dengan kandungan
   `backend/appsscript.json`. Pastikan `"timeZone": "Asia/Kuala_Lumpur"`.
7. Klik **Save**.

## 3. Tetapkan token dalam Script Properties

Token ialah kata laluan panjang untuk dashboard admin dan halaman fasilitator.

1. Di Apps Script, buka **Project Settings** → **Script Properties**.
2. Klik **Add script property**.
3. Tambah:
   - Property: `ADMIN_TOKEN`
   - Value: teks rawak panjang (sekurang-kurangnya 24 aksara).
4. (Pilihan) Tambah `FASILITATOR_TOKEN` dengan teks rawak lain jika fasilitator perlu
   menggunakan `web/fasilitator.html`.
5. Klik **Save**. Simpan token dalam pengurus kata laluan. **Jangan** masukkan token ke
   dalam repo, WhatsApp, atau fail `config.js`.

Jana token dengan PowerShell:

```powershell
[guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N')
```

Atau:

```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 48 | ForEach-Object { [char]$_ })
```

## 4. Sediakan helaian dan data awal

1. Dalam editor Apps Script, pilih fungsi **`setupSheets`** dari menu lungsur di atas
   editor, kemudian klik **Run**.
2. Google akan meminta kebenaran. Klik **Review permissions**, pilih akaun, klik
   **Advanced → Go to KSQ 2026 Backend (unsafe)**, kemudian **Allow**. Ini normal untuk
   skrip peribadi yang anda sendiri pasang.
3. Selepas selesai, pilih fungsi **`seedData`** dan klik **Run**. Ini memasukkan
   milestone, tugasan dan bajet awal ke dalam helaian yang masih kosong.
4. Kembali ke Google Sheet. Anda sepatutnya melihat tab:
   `Pendaftaran`, `Tetapan`, `Tugasan`, `Milestone`, `Bajet`, `Kehadiran`, `Log`.
5. Anda juga boleh menggunakan menu **KSQ 2026** di Sheet untuk menjalankan kedua-dua
   fungsi ini.

> **Jangan ubah nama lajur.** Sistem akan menolak operasi jika pengepala tidak sepadan.
> Jika perlu menambah lajur, buat salinan sandaran dan ubah kod terlebih dahulu.

## 5. Deploy Web App

1. Dalam Apps Script, klik **Deploy → New deployment**.
2. Klik ikon gear di sebelah **Select type** dan pilih **Web app**.
3. Isi:
   - **Description**: `KSQ 2026 API v1`
   - **Execute as**: `Me (akaun anda)`
   - **Who has access**: `Anyone`
4. Klik **Deploy**.
5. Salin **Web app URL** yang berakhir dengan `/exec`.

> URL ini adalah awam tetapi bukan rahsia. Ia tidak mendedahkan Sheet. Jangan letak
> token dalam URL.

## 6. Uji API

Buka URL berikut dalam pelayar (ganti `<URL_EXEC>`):

```text
<URL_EXEC>?action=stats
```

Anda sepatutnya melihat JSON seperti:

```json
{
  "ok": true,
  "data": {
    "kapasiti": 40,
    "disahkan": 0,
    "menunggu": 0,
    "bakiSlot": 40,
    "pendaftaranDibuka": true
  },
  "serverTime": "2026-11-15T10:00:00+08:00"
}
```

Jika keluar halaman log masuk Google, semak semula **Who has access: Anyone**.

## 7. Sambungkan frontend

1. Buka `web/config.js`.
2. Ganti nilai `API_URL` dengan URL `/exec` anda:

```js
export const CONFIG = {
  API_URL: 'https://script.google.com/macros/s/XXXXXXXX/exec',
  SITE_URL: 'https://nama-pengguna.github.io/nama-repo/'
};
```

3. Jangan letak token dalam fail ini.

## 8. Hoskan frontend di GitHub Pages

1. Cipta repositori GitHub baharu (contohnya `ksq-2026`).
2. Muat naik **kandungan** folder `web/` ke repositori (bukan folder `web` itu sendiri
   jika anda mahu URL akar berfungsi). Pastikan `index.html` berada di akar repo.
3. Buka **Settings → Pages**.
4. Di **Build and deployment**, pilih **Deploy from a branch**, branch `main`, folder
   `/ (root)`. Klik **Save**.
5. Tunggu 1–2 minit. URL akan menjadi `https://<pengguna>.github.io/<repo>/`.
6. Uji:
   - Halaman awam: `https://<pengguna>.github.io/<repo>/`
   - Admin: `https://<pengguna>.github.io/<repo>/admin.html` (jangan sebar)
   - Fasilitator: `https://<pengguna>.github.io/<repo>/fasilitator.html` (jangan sebar)
7. Kemas kini `SITE_URL` dalam `web/config.js` dan `og:image` dalam `web/index.html`
   dengan URL penuh supaya pratonton WhatsApp betul.

## 9. Setiap kali kod backend diubah

Ini perangkap paling biasa:

> **Selepas mengubah `Code.gs`, deployment lama masih menjalankan kod lama.**
> Anda mesti buat versi baharu.

1. Simpan kod.
2. **Deploy → Manage deployments**.
3. Cari deployment aktif, klik ikon pensel **Edit**.
4. Di **Version**, pilih **New version**.
5. Klik **Deploy**.
6. URL `/exec` kekal sama. Uji semula `?action=stats`.

## 10. Mod Sheet luar (pilihan)

Jika pendaftaran sudah dibuat melalui Google Form atau Sheet lain:

1. Buka admin → **Tetapan**.
2. Pilih **Sumber pendaftaran: Sheet luar**.
3. Tampal **pautan penuh Google Sheet** (sistem akan mengekstrak ID) dan nama tab
   (contohnya `Form Responses 1`).
4. Simpan. Dashboard akan mengira bilangan baris data dalam Sheet itu.
5. Pastikan Sheet itu boleh dibaca oleh akaun Google yang memiliki Web App.
6. Dalam mod ini, borang awam sistem akan ditutup dan memaparkan mesej kepada urus
   setia. Pendaftaran manual masih boleh direkod dalam Sheet sistem, tetapi angka
   dashboard mengikut Sheet luar.

## 11. Keselamatan dan privasi

- Data peserta ialah data kanak-kanak. Kumpul minimum, gunakan untuk pengurusan program
  sahaja, dan jangan siarkan nama/telefon di kumpulan WhatsApp.
- Jangan kongsi Sheet secara awam.
- Jangan letak token dalam `config.js`, GitHub, atau tangkapan skrin.
- Token admin disimpan dalam `sessionStorage` pelayar dan hilang apabila tab ditutup.
- Jika token terdedah: tukar `ADMIN_TOKEN` dalam Script Properties. Semua sesi lama
  akan gagal serta-merta.
- Buat sandaran melalui admin → **Data → Sandaran ke Drive** atau
  **File → Make a copy** dalam Google Sheet.
- Jangan simpan gambar peserta tanpa kebenaran ibu bapa.

## 12. Masalah biasa

| Masalah | Punca | Pembetulan |
|---|---|---|
| Halaman awam kata "API belum disambungkan" | `API_URL` masih placeholder | Isi URL `/exec` dalam `web/config.js` |
| `Token tidak sah` walaupun betul | Token berbeza atau ada ruang | Salin semula dari Script Properties; jangan tambah ruang |
| Perubahan kod tidak berkesan | Deployment lama | Deploy → Manage deployments → Edit → New version |
| `Helaian ... tiada` | `setupSheets` belum dijalankan | Jalankan `setupSheets` |
| `Pengepala helaian tidak sepadan` | Lajur diubah | Pulihkan nama lajur asal atau pulihkan sandaran |
| API keluar halaman log masuk | Web App access bukan Anyone | Deploy semula dengan access Anyone |
| Tarikh salah | Zon masa peranti | Sistem menggunakan `serverTime`; pastikan `appsscript.json` ada `Asia/Kuala_Lumpur` |
| `Sheet luar tidak dapat dibaca` | Sheet tidak dikongsi dengan akaun Web App | Kongsi baca kepada akaun pemilik Web App |
| `Ralat pelayan` | Ralat kod/izin | Buka Apps Script → Executions untuk log penuh |

## 13. Senarai semak selepas pemasangan

- [ ] `?action=stats` keluar JSON.
- [ ] Borang awam boleh hantar satu pendaftaran ujian.
- [ ] Pendaftaran ujian muncul dalam admin.
- [ ] Token salah ditolak.
- [ ] Admin boleh tambah tugasan dan milestone.
- [ ] Eksport CSV dibuka betul dalam Excel.
- [ ] `TODO-PEMILIK.md` tiada placeholder yang tinggal untuk telefon/bayaran.
- [ ] Sandaran pertama dibuat.
