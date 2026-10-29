// "upload" + persen saat file dikirim; "proses" saat server memvalidasi & menyimpan.
export interface ProsesImpor {
  tahap: "upload" | "proses"
  persen: number
  pesan: string
}

export const MAKS_UKURAN_IMPOR = 100 * 1024 * 1024

// Status proses impor yang dipanggil dari callback progres upload.
export function prosesUpload(namaFile: string, persen: number): ProsesImpor {
  return persen < 100
    ? { tahap: "upload", persen, pesan: `Mengunggah ${namaFile}...` }
    : { tahap: "proses", persen: 100, pesan: "Memvalidasi & menyimpan data, mohon tunggu..." }
}
