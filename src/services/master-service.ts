import { apiDownload, apiFetch, apiUpload, toQuery } from "@/services/api"
import type {
  AnalisaDetail,
  AnalisaRow,
  ApiData,
  FormAnalisaData,
  SimpanAnalisaPayload,
  ApiResult,
  DataTablesResult,
  HargaSatuan,
  ImporResult,
  KonflikImpor,
  MasterKomponen,
  MasterOptions,
  SimpanHargaPayload,
  TableQuery,
} from "@/types/master"

export const masterService = {
  options: () => apiFetch<ApiData<MasterOptions>>("/master/options").then((res) => res.data),

  /* ===================== HARGA SATUAN ===================== */

  listHarga: (query: TableQuery) =>
    apiFetch<DataTablesResult<HargaSatuan>>(`/master/harga${toQuery({ ...query })}`),

  komponen: () =>
    apiFetch<ApiData<MasterKomponen[]>>("/master/harga/komponen").then((res) => res.data),

  kodeHargaBaru: (category: string) =>
    apiFetch<{ kode: string }>(`/master/harga/kode-baru${toQuery({ category })}`).then((res) => res.kode),

  simpanHarga: (payload: SimpanHargaPayload) =>
    apiFetch<ApiResult>("/master/harga", { method: "POST", body: JSON.stringify(payload) }),

  hapusHarga: (id: number) => apiFetch<ApiResult>(`/master/harga/${id}`, { method: "DELETE" }),

  imporHarga: (file: File, onProgress?: (persen: number) => void) => {
    const body = new FormData()
    body.append("file_excel", file)
    return apiUpload<ImporResult>("/master/harga/impor", body, onProgress)
  },

  imporHargaUlang: (rows: KonflikImpor[]) =>
    apiFetch<ImporResult>("/master/harga/impor-ulang", { method: "POST", body: JSON.stringify({ rows }) }),

  // File statis di public/templates.
  templateHargaUrl: "/templates/template-harga-satuan.xlsx",

  /* ===================== ANALISA (AHSP) ===================== */

  listAnalisa: (query: TableQuery) =>
    apiFetch<DataTablesResult<AnalisaRow>>(`/master/analisa${toQuery({ ...query })}`),

  detailAnalisa: (id: string) =>
    apiFetch<ApiData<AnalisaDetail[]>>(`/master/analisa/${encodeURIComponent(id)}/detail`),

  // Tanpa id = form analisa baru (kode berikutnya), dengan id = form edit.
  formAnalisa: (id?: string) =>
    apiFetch<ApiData<FormAnalisaData>>(`/master/analisa/form${toQuery({ id })}`).then((res) => res.data),

  simpanAnalisa: (payload: SimpanAnalisaPayload) =>
    apiFetch<ApiResult>("/master/analisa", { method: "POST", body: JSON.stringify(payload) }),

  hapusAnalisa: (id: string) =>
    apiFetch<ApiResult>(`/master/analisa/${encodeURIComponent(id)}`, { method: "DELETE" }),

  imporAnalisa: (file: File, onProgress?: (persen: number) => void) => {
    const body = new FormData()
    body.append("file_excel", file)
    return apiUpload<ImporResult>("/master/analisa/impor", body, onProgress)
  },

  templateAnalisaUrl: "/templates/template-analisa.xlsx",

  // Rekap analisa ke Excel: semua baris sesuai search/sort/filter (tanpa paging).
  eksporRekapAnalisa: (query: Omit<TableQuery, "start" | "length">) =>
    apiDownload(`/master/analisa/ekspor${toQuery({ ...query })}`, "rekap-analisa.xlsx"),
}
