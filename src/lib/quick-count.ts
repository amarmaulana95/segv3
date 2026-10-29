// Kalkulator klasifikasi biaya quick count (port calc() simseg quck_final_tender_estimate).
// Kode baris mengikuti sel Excel asal: D = nilai (Rp), E = persen.

// Baris yang persennya diisi user (persen dari Jumlah Penawaran D30).
export const BARIS_PERSEN = ["12", "13", "16", "17", "18", "21", "22", "23"] as const
export type KodePersen = (typeof BARIS_PERSEN)[number] | "26"

export interface InputQuickCount {
  biayaKonstruksi: number // D10 = cost proyek
  hps: number
  durasiBulan: number
  biayaLain: number // D11 (Rp)
  persen: Record<KodePersen, number>
}

export interface HasilQuickCount {
  nilai: Record<string, number> // D10..D30
  persenTampil: Record<string, number> // persen yang ditampilkan (bukan input): E10, E11, E27, E29, E30
  kontrolBiayaUmum: number
}

const bulat2 = (n: number) => Math.round(n * 100) / 100

export function hitungQuickCount(input: InputQuickCount): HasilQuickCount {
  const { biayaKonstruksi: D10, hps, durasiBulan, biayaLain: D11, persen } = input
  const D29 = D10 + D11 // Bobot
  const totalBobot = BARIS_PERSEN.reduce((sum, k) => sum + (persen[k] || 0), 0)
  const e30 = 1 - totalBobot / 100
  const D30 = e30 > 0 ? D29 / e30 : 0 // Jumlah Penawaran

  const nilai: Record<string, number> = { "10": D10, "11": D11, "29": D29, "30": D30 }
  // Dibulatkan 2 desimal seperti simseg: di sana nilai baris ditampilkan (2 desimal) lalu dibaca ulang dari teks
  // saat menjumlah D25, sehingga Non PPN/PPN/Estimate memakai nilai yang sudah dibulatkan.
  for (const k of BARIS_PERSEN) nilai[k] = bulat2((D30 * (persen[k] || 0)) / 100)

  const D25 = D10 + D11 + BARIS_PERSEN.reduce((sum, k) => sum + nilai[k], 0) // Quick Count (Non PPN)
  const D26 = (D25 * (persen["26"] || 0)) / 100 // PPN
  const D27 = D25 + D26 // Quick Count Estimate
  Object.assign(nilai, { "25": D25, "26": D26, "27": D27 })

  return {
    nilai,
    persenTampil: {
      "10": D30 > 0 ? (D10 / D30) * 100 : 0,
      "11": D30 > 0 ? (D11 / D30) * 100 : 0,
      "27": hps > 0 ? (D27 / hps) * 100 : 0,
      "29": totalBobot,
      "30": e30 * 100,
    },
    kontrolBiayaUmum: durasiBulan > 0 ? nilai["16"] / durasiBulan : 0,
  }
}

export interface BarisKlasifikasi {
  kode?: string // kode D/E; kosong = baris kategori
  no: string
  label: string
  kategori?: boolean
  persenInput?: KodePersen
}

// Susunan tabel klasifikasi biaya (urutan sama dengan simseg & ekspor Excel).
export const TABEL_KLASIFIKASI: BarisKlasifikasi[] = [
  { no: "I", label: "I. Biaya Langsung", kategori: true },
  { kode: "10", no: "1.1", label: "Total Biaya Konstruksi" },
  { kode: "11", no: "1.2", label: "Biaya Lain-lain" },
  { kode: "12", no: "1.3", label: "Resiko Konstruksi", persenInput: "12" },
  { kode: "13", no: "1.4", label: "Biaya Metode", persenInput: "13" },
  { no: "II", label: "II. Biaya Tidak Langsung", kategori: true },
  { kode: "16", no: "2.1", label: "Biaya Umum", persenInput: "16" },
  { kode: "17", no: "2.2", label: "Biaya Bank", persenInput: "17" },
  { kode: "18", no: "2.3", label: "Biaya Perencanaan", persenInput: "18" },
  { no: "III", label: "III. Biaya Lain - Lain", kategori: true },
  { kode: "21", no: "3.1", label: "Biaya Pemeliharaan", persenInput: "21" },
  { kode: "22", no: "3.2", label: "PPH", persenInput: "22" },
  { kode: "23", no: "3.3", label: "Laba", persenInput: "23" },
]
