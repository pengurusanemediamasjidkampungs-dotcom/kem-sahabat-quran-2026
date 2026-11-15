# Peraturan kewangan KSQ 2026

Sumber: `ARAHAN-TAMBAHAN-FASA7-10.md` (mengatasi bahagian bajet `AGENTS.md`).

## Siling dan anggaran

- Siling perbelanjaan: **RM5,500**.
- Anggaran kos teras: **RM5,495** (termasuk tiket muzium RM5 x 40 dan sijil RM70).
- Sasaran kos asal: sekitar RM5,400.
- Semua angka seed ialah anggaran. Jangan papar sebagai rasmi sehingga bendahari mengesahkan.

## Yuran

- Online: RM110.
- Manual: RM120.
- Harga asal: RM180.
- Hasil jika 40 peserta semua online: RM4,400.
- Hasil jika 40 peserta semua manual: RM4,800.

## Formula tunggal

```text
dana_masjid_diperlukan = max(0, jumlah_kos_dikira - hasil_yuran_diterima)
```

- Pada siling dan semua online: RM1,100.
- Pada siling dan semua manual: RM700.
- Pada kos teras dan semua online: RM1,095.
- Pada kos teras dan semua manual: RM695.

## Item dikecualikan

Item berstatus `Cadangan` TIDAK dikira sehingga bendahari memberi harga dan menukar status kepada `Diluluskan`:

- Baju-T program
- Lencana
- Fail / folder peserta
- Beg kain atau botol air
- Kit pertolongan cemas

Item `Ditolak` juga tidak dikira.

## Paparan dashboard yang wajib

- Kos dikira berbanding siling; amaran merah jika melebihi.
- Hasil yuran diterima berbanding sasaran.
- Dana masjid diperlukan secara langsung.
- Dana masjid diluluskan/diterima.
- Baki.
- Lencana "Perlu semakan bendahari" sehingga disahkan.

## Nota

- `hasil_yuran_diterima` bermaksud jumlah `yuran_rm` bagi pendaftaran yang `status_bayaran = Sudah` dan status pendaftaran bukan `Batal`.
- Jangan gunakan yuran peserta `Menunggu` atau `Senarai Tunggu` sebagai wang diterima.
