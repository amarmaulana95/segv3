export const TIPE_HARGA = ["Material", "Upah", "Alat", "Subkontraktor"] as const
export type TipeHarga = (typeof TIPE_HARGA)[number]

export interface Lokasi {
  kode: string
  nama: string
}

export interface MasterOptions {
  tipe_harga: string[]
  categories: string[]
  years: number[]
  locations: Lokasi[]
  analisa_tahun: number[]
  analisa_lokasi: Lokasi[]
}

export interface HargaSatuan {
  id: number
  kode: string
  nama: string
  tahun: number | null
  lokasi: string | null
  keterangan: string | null
  unit: string | null
  price: number
  category: string | null
  created_by: string | null
  updated_by: string | null
}

export interface MasterKomponen {
  kode: string
  nama: string
  unit: string
  category: string
}

export interface ApiResult {
  success: boolean
  message: string
}

export interface ApiData<T> {
  success: boolean
  data: T
  message?: string
}

export interface DataTablesResult<T> {
  draw: number
  recordsTotal: number
  recordsFiltered: number
  data: T[]
}

export interface TableQuery {
  start: number
  length: number
  search?: string
  sort?: string
  dir?: "asc" | "desc"
  filter_tipe?: string
  filter_lokasi?: string
  filter_tahun?: string
}

export interface SimpanHargaPayload {
  id_lama?: number
  kode_komponen: string
  uraian_baru?: string
  satuan_baru?: string
  tipe_baru?: string
  lokasi: string
  tahun: number
  harga: number | string
  keterangan: string
}

export interface KonflikImpor {
  baris: number
  uraian: string
  satuan: string
  tipe: string | null
  tahun: number
  lokasi: string
  harga: number
  keterangan: string
  pesan: string
}

export interface ImporResult extends ApiResult {
  errors?: string[]
  konflik?: KonflikImpor[]
}

/* ===================== ANALISA (AHSP) ===================== */

export interface AnalisaRow {
  id: string
  kode: string
  nama: string
  tahun: number | null
  lokasi: string | null
  keterangan: string | null
  unit: string | null
  material: number
  upah: number
  alat: number
  subkontraktor: number
  total: number
  created_by: string | null
  updated_by: string | null
}

export interface AnalisaDetail {
  tipe: string
  kode: string
  nama: string | null
  tahun: number | null
  lokasi: string | null
  keterangan: string | null
  unit: string | null
  coeff: number
  harga_satuan: number
  subtotal: number
}

export interface AnalisaHeader {
  id: string
  kode: string
  nama: string
  unit: string | null
  tahun: number | null
  lokasi_id: string | null
  keterangan: string | null
}

export interface KomponenAnalisa {
  id: number
  kode: string
  uraian: string
  tahun: number | null
  lokasi: string | null
  keterangan: string | null
  satuan: string | null
  harga: number
}

export interface FormAnalisaData {
  analisa: AnalisaHeader | null
  baris: Record<string, { id: number; coeff: number }[]>
  komponen: Record<string, KomponenAnalisa[]>
  lokasi: Lokasi[]
  kode: string
}

export interface SimpanAnalisaPayload {
  id?: string
  uraian: string
  satuan: string
  tahun: number
  lokasi: string
  keterangan: string
  komponen: { tipe: string; id: number; koefisien: string }[]
}
