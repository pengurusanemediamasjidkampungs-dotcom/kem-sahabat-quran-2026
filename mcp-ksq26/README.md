# MCP KSQ 2026

Pelayan **Model Context Protocol (MCP)** untuk sistem Kem Sahabat Quran 2026.
Ia menyambung klien AI (OpenCode, Claude Desktop atau klien MCP lain) kepada API
Google Apps Script sedia ada. Tiada pakej npm, tiada pangkalan data kedua dan
tiada cache data.

```
Klien AI  --stdio JSON-RPC-->  mcp-ksq26/server.js  --HTTPS-->  GAS /exec  -->  Google Sheets
```

## Keperluan

- Node.js 18 atau lebih baharu (`fetch` terbina).
- URL deployment Apps Script `/exec`.
- `ADMIN_TOKEN` untuk alat pentadbir.
- `FASILITATOR_TOKEN` (pilihan) untuk alat kehadiran sahaja.

Token **tidak** disimpan dalam folder ini. Ia dibaca daripada pemboleh ubah
persekitaran yang ditetapkan oleh klien MCP.

## Pemboleh ubah persekitaran

| Nama | Wajib | Kegunaan |
|---|---|---|
| `KSQ_API_URL` | Ya | URL `https://script.google.com/macros/s/<ID>/exec`. |
| `KSQ_ADMIN_TOKEN` | Untuk alat admin | Token pentadbir daripada Script Properties GAS. |
| `KSQ_FASILITATOR_TOKEN` | Pilihan | Token fasilitator; hanya `attendance.*` dan `facilitator.participants`. |

Salinan contoh ada dalam `.env.example`. Jangan commit `.env` sebenar.

## Daftar dalam OpenCode V2

OpenCode V2 meletakkan pelayan di bawah `mcp.servers` (bukan terus di bawah
`mcp`). Tambah `opencode.jsonc` di akar projek:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "servers": {
      "ksq26": {
        "type": "local",
        "command": [
          "node",
          "C:\\Users\\i7\\Downloads\\Projek Automation\\KSQ26\\ksq-sistem\\mcp-ksq26\\server.js"
        ],
        "cwd": "C:\\Users\\i7\\Downloads\\Projek Automation\\KSQ26\\ksq-sistem\\mcp-ksq26",
        "environment": {
          "KSQ_API_URL": "{env:KSQ_API_URL}",
          "KSQ_ADMIN_TOKEN": "{env:KSQ_ADMIN_TOKEN}",
          "KSQ_FASILITATOR_TOKEN": "{env:KSQ_FASILITATOR_TOKEN}"
        }
      }
    }
  }
}
```

`{env:NAMA}` menggantikan pemboleh ubah persekitaran mesin. Tetapkan nilai
sebenar dalam PowerShell **sebelum** membuka OpenCode:

```powershell
$env:KSQ_API_URL = "https://script.google.com/macros/s/XXXX/exec"
$env:KSQ_ADMIN_TOKEN = "..."
$env:KSQ_FASILITATOR_TOKEN = "..."
opencode
```

Atau guna CLI:

```powershell
opencode mcp add ksq26 --env KSQ_API_URL=https://script.google.com/macros/s/XXXX/exec -- node "C:\Users\i7\Downloads\Projek Automation\KSQ26\ksq-sistem\mcp-ksq26\server.js"
opencode mcp list
```

Semak sambungan dalam OpenCode dengan `/mcps`. Jika status `connected`, alat
akan muncul sebagai `ksq26_ksq_stats`, `ksq26_ksq_dashboard`, dan seterusnya.

> Untuk klien lain, gunakan arahan yang sama: jalankan `node server.js` dan
> hantar JSON-RPC 2.0 baris demi baris melalui stdin/stdout. Log diagnostik
> ditulis ke stderr supaya tidak mengganggu protokol.

## Alat

| Alat | Tulis? | Keterangan |
|---|---|---|
| `ksq_stats` | Tidak | Statistik awam: kapasiti, baki slot, yuran, tarikh tutup. Tiada data peribadi. |
| `ksq_dashboard` | Tidak | Ringkasan slot, kewangan, tugasan lewat/hari ini dan milestone seterusnya. |
| `ksq_list_registrations` | Tidak | Senarai pendaftaran dengan tapisan. Telefon disamarkan secara lalai. |
| `ksq_get_settings` | Tidak | Tetapan program; token hanya dipulangkan sebagai boolean. |
| `ksq_list_tasks` | Tidak | Checklist dengan status temporal (`Lewat`, `Hari ini`, `Akan datang`). |
| `ksq_set_task_status` | **Ya** | Tukar status satu tugasan: `Belum`, `Sedang`, `Selesai`. |
| `ksq_list_milestones` | Tidak | Milestone mengikut tarikh. |
| `ksq_list_budget` | Tidak | Bajet; item `Cadangan`/`Ditolak` tidak dikira dalam jumlah. |
| `ksq_financial_summary` | Tidak | Formula `max(0, kos dikira - yuran diterima)`, siling RM5,500. |
| `ksq_list_attendance` | Tidak | Kehadiran Hari 1–3, dengan tapisan hari/status. |
| `ksq_mark_attendance` | **Ya** | Tanda hadir/tidak hadir untuk peserta Disahkan. |
| `ksq_export_registrations_csv` | Tidak | CSV UTF-8 BOM + CRLF; telefon disamarkan melainkan diminta. |
| `ksq_db_info` | Tidak | Semak helaian, pengepala, ID berganda dan rekod yatim. |

Tiada alat memadam pendaftaran, mengubah bayaran atau membaca token penuh.
Perubahan data dihadkan kepada status tugasan dan kehadiran.

## Sumber rujukan

| URI | Kandungan |
|---|---|
| `ksq://program/facts` | Tarikh, lokasi, kapasiti, yuran, syarat umur, sasaran hafazan. |
| `ksq://finance/rules` | Siling RM5,500, formula dana masjid, item `Cadangan` dikecualikan. |
| `ksq://api/reference` | Bentuk permintaan, senarai action, helaian dan kod ralat. |
| `ksq://privacy/guide` | Penyamaran telefon, data kesihatan, token dan had alat. |

Baca dengan alat terbina OpenCode `list_mcp_resources` dan `read_mcp_resource`.

## Privasi

- Data peserta ialah data kanak-kanak. Jangan salin output ke saluran awam.
- Telefon disamarkan (`012-xxx6789`) melainkan `include_phones=true`.
- Teks alahan/kesihatan hanya dipulangkan dengan `include_health_notes=true`;
  secara lalai hanya boolean `ada_alahan`.
- Gunakan `limit` kecil dan tapisan status. Elak senarai penuh tanpa keperluan.
- Token hanya dalam persekitaran mesin. Jika terdedah, tukar dalam Script
  Properties GAS dan deploy semula.

## Ujian

```powershell
# Dari akar projek
npm run test:mcp
```

Ujian menggunakan API palsu dan tidak membuat panggilan rangkaian. Ujian projek
utama:

```powershell
# Dari akar projek
npm test
```

## Ujian manual pantas

```powershell
# Senarai alat tanpa menyambung API
node server.js --list-tools

# Versi
node server.js --version

# Uji API sebenar (baca sahaja)
$env:KSQ_API_URL = "https://script.google.com/macros/s/XXXX/exec"
$env:KSQ_ADMIN_TOKEN = "..."
node ..\tests\api-smoke.js
```

## Penyelesaian masalah

| Gejala | Semakan |
|---|---|
| `KSQ_API_URL` tidak sah | URL mesti berakhir dengan `/exec` dan bukan placeholder `ISI_`. |
| `NO_ADMIN_TOKEN` | Tetapkan `KSQ_ADMIN_TOKEN` dalam persekitaran klien MCP. |
| `UNAUTHORIZED` | Token salah atau sudah ditukar dalam Script Properties. |
| Respons bukan JSON | Deployment GAS bukan versi terkini; Deploy > New version. |
| Alat tidak muncul | Semak `/mcps`; pastikan `mcp.servers.ksq26` dan laluan `server.js` betul. |
| Server keluar serta-merta | Jalankan `node server.js --list-tools` untuk melihat ralat sebenar. |

## Struktur

```
mcp-ksq26\
  server.js              JSON-RPC stdio, initialize/tools/resources
  lib\api-client.js      klien HTTPS GAS, validasi URL, timeout
  lib\tools.js           13 definisi dan pengendali alat
  lib\finance.js         kiraan bajet, yuran, penyamaran telefon
  lib\resources.js       sumber rujukan tempatan
  resources\             fakta program, kewangan, API, privasi
  test\                  ujian Node tanpa rangkaian
  .env.example
```
