import type { DataTablesResult } from "@/types/master"

export interface ProjectHistory {
  uuid: string
  name: string
  location: string | null
  created_at: string | null
  created_by: string | null
  cost: number
}

export interface ProjectHistoryResult extends DataTablesResult<ProjectHistory> {
  can_delete: boolean
}

export interface ProjectDetail {
  id: number
  uuid: string
  name: string
  construction_type: string | null
  hps: number | null
  cost: number
  years_imp: string | null
  month_imp: string | null
  location: string | null
  id_location: string | null
  created_at: string | null
  created_by: string | null
}

export interface EstimasiItem {
  id: number
  no: number
  nama_pekerjaan: string | null
  unit: string | null
  nama_material: string | null
  id_pekerjaan: string | null
  volume: number
  adj: number
  price_ref: number
  ref_price_year: string | null
  project_ref: string | null
  amount: number
}

export interface EstimasiHeader {
  id: number
  name: string
  level: number
  items: EstimasiItem[]
}

export interface ProjectDetailResult {
  project: ProjectDetail
  headers: EstimasiHeader[]
}

export interface SimpanEstimasiPayload {
  headers: { temp_id: string; header_name: string }[]
  items: {
    header_id: string
    nama_pekerjaan: string
    id_pekerjaan: string
    unit: string
    volume: number
    adj: number
    price_ref: number
    ref_price_year: string
    project_ref: string
  }[]
}

export interface UpdateItemPayload {
  nama_pekerjaan: string
  unit: string
  volume: number
  adj: number
  price_ref: number
}

export interface PekerjaanOption {
  id: string
  nama: string
  project: string | null
  kategori: "subkon" | "non-subkon"
}

export interface HargaPekerjaan {
  harga: number
  harga_terendah: number
  tahun: string
  satuan: string
  jumlah_item: number
}

/* ===================== QUICK COUNT ===================== */

export interface LokasiProvinsi {
  kode: string
  alias: string
  nama: string
}

export interface PreviewBaris {
  is_header: boolean
  kode?: string
  nama: string
  project_ref?: string
  no?: string
  volume: number
  unit?: string
  adj: number
  ref_price: number
  amount: number
}

export interface PreviewResult {
  success: boolean
  message?: string
  errors?: { baris: number; kolom: string; nilai: string; pesan: string }[]
  contoh?: string[]
  data?: PreviewBaris[]
}

export interface RekomendasiAnalisa {
  id: string
  kode: string
  nama: string
  unit: string | null
  tahun: number | null
  total: number
  score: number
}

export interface SimpanQuickCountPayload {
  project_name: string
  id_location: string
  construction_type: string
  nilai_hps: number
  years_imp: string
  month_imp: string
  items: {
    is_header: boolean
    header_name?: string
    nama_pekerjaan?: string
    id_pekerjaan?: string
    volume?: number
    adj?: number
    price_ref?: number
    unit?: string
    ref_price_year?: string
    project_ref?: string
  }[]
}

export interface SimpanQuickCountResult {
  success: boolean
  message: string
  uuid?: string
}

export interface EksporHasilPayload {
  kontrol_biaya_umum: number
  rows: { no: string; label: string; nilai: number | null; persen: string; kategori: boolean }[]
}
