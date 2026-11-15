# Privasi dan keselamatan MCP KSQ

Data peserta adalah data kanak-kanak. Gunakan alat ini dengan berhati-hati.

## Tetapan lalai

- Nombor telefon penjaga **disamarkan** melainkan `include_phones=true`.
- Teks alahan/kesihatan **tidak dipulangkan** melainkan `include_health_notes=true`; hanya `ada_alahan` boolean dipulangkan secara lalai.
- Tiada alat memadam pendaftaran atau mengubah status pendaftaran.
- Alat tulis terhad kepada status tugasan dan kehadiran.
- Token tidak pernah dipulangkan oleh alat; `settings.get` hanya memulangkan boolean.

## Token

- `KSQ_ADMIN_TOKEN` disimpan dalam pemboleh ubah persekitaran mesin, bukan dalam repo.
- `KSQ_FASILITATOR_TOKEN` pilihan, untuk kehadiran sahaja.
- Jangan masukkan token ke dalam prompt, log, isu GitHub atau tangkapan skrin.
- Jika token terdedah, tukar dalam Apps Script Script Properties dan deploy semula.

## Log dan output

- Output alat dihantar kepada model AI melalui stdio. Jangan jalankan alat senarai penuh tanpa keperluan.
- Gunakan `limit` kecil dan tapisan status.
- Jangan salin output mengandungi nama/telefon ke dokumen awam atau WhatsApp umum.
- Simpan hanya data yang diperlukan untuk program.

## API

- `KSQ_API_URL` mesti URL HTTPS `script.google.com/macros/s/.../exec`.
- MCP tidak menyimpan cache data.
- Tiada panggilan ke pelayan selain API KSQ yang dikonfigurasi.
