# SEG v3 — Frontend

Frontend **SEG (Smart Estimating Guide)**, pengganti tampilan aplikasi CodeIgniter 3 `simseg`.
React 19 + TypeScript + Vite, UI [shadcn/ui](https://ui.shadcn.com) (Tailwind CSS v4),
tabel server-side dengan [TanStack Table v8](https://tanstack.com/table/v8).

Backend (Go) ada di repo terpisah: https://gitlab.com/amarmaulana798/segv3

## Menjalankan

```bash
cp .env.example .env   # atur URL backend
npm install
npm run dev            # http://localhost:5173
npm run build          # type-check + build produksi ke dist/
npm run lint
```

Variabel `.env`:

| Variabel | Keterangan |
|---|---|
| `VITE_API_BASE_URL` | Base URL API backend, mis. `https://infra-lab.my.id/api` (lokal: `http://localhost:8080/api`) |
| `VITE_API_USER` | (opsional) username yang dikirim sebagai header `X-User` |

## Struktur

```
src/
  app/          App & router
  config/       menu & daftar route
  layouts/      layout utama
  pages/        halaman per fitur (master-data, quick-count, quick-count-history, ...)
  components/
    ui/           komponen shadcn
    data-table/   DataTable + hook useServerTable (paging, sort, search server-side)
    common/       komponen bersama (searchable select, year picker, input angka, feedback impor)
    tender/       komponen quick count
  services/     pemanggilan API (apiFetch, apiUpload, apiDownload)
  types/        tipe data respons API
  lib/          format angka/tanggal, rumus quick count, utilitas
public/templates/  template Excel untuk impor
```

## Halaman

| Route | Halaman |
|---|---|
| `/` | Dashboard |
| `/master-data/harga-satuan` | Master harga satuan (CRUD, impor Excel) |
| `/master-data/analisa` | Master analisa AHSP (CRUD, impor Excel) |
| `/master-data` | Rekap analisa (ekspor Excel) |
| `/quick-count` | Buat quick count (upload Excel, rekomendasi analisa) |
| `/quick-count/data?project=` | Hasil quick count (kalkulator biaya, cetak, ekspor) |
| `/quick-count/history` | Riwayat proyek estimasi |
| `/quick-count/history/:uuid` | Detail proyek & item pekerjaan |

Menu lain (Method, Innovation, Value Eng, dll.) belum tersedia dan menampilkan pemberitahuan.

## Catatan

- Login belum di-port: user aktif diambil dari `VITE_API_USER` dan dikirim ke backend lewat header `X-User`.
