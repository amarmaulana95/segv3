import { apiDownload, apiFetch, apiUpload, toQuery } from "@/services/api"
import type { ApiData, ApiResult, TableQuery } from "@/types/master"
import type {
  EksporHasilPayload,
  HargaPekerjaan,
  LokasiProvinsi,
  PreviewResult,
  RekomendasiAnalisa,
  SimpanQuickCountPayload,
  SimpanQuickCountResult,
  PekerjaanOption,
  ProjectDetailResult,
  ProjectHistoryResult,
  SimpanEstimasiPayload,
  UpdateItemPayload,
} from "@/types/tender"

const uuidPath = (uuid: string) => `/tender/history/${encodeURIComponent(uuid)}`

export const tenderService = {
  /* ===================== QUICK COUNT HISTORY ===================== */

  listHistory: (query: TableQuery) => apiFetch<ProjectHistoryResult>(`/tender/history${toQuery({ ...query })}`),

  hapusProyek: (uuid: string) => apiFetch<ApiResult>(uuidPath(uuid), { method: "DELETE" }),

  detail: (uuid: string) => apiFetch<ApiData<ProjectDetailResult>>(uuidPath(uuid)).then((res) => res.data),

  // Header & item baru sekaligus; cost proyek ditambah total item baru.
  simpanEstimasi: (uuid: string, payload: SimpanEstimasiPayload) =>
    apiFetch<ApiResult>(`${uuidPath(uuid)}/items`, { method: "POST", body: JSON.stringify(payload) }),

  updateItem: (uuid: string, id: number, payload: UpdateItemPayload) =>
    apiFetch<ApiResult>(`${uuidPath(uuid)}/items/${id}`, { method: "PUT", body: JSON.stringify(payload) }),

  hapusItem: (uuid: string, id: number) => apiFetch<ApiResult>(`${uuidPath(uuid)}/items/${id}`, { method: "DELETE" }),

  /* ===================== BANK DATA PEKERJAAN ===================== */

  // itemName terisi = hasil diurutkan menurut kemiripan dengan nama item (quick count).
  searchPekerjaan: (term: string, idLocation: string | null, page = 1, itemName?: string) =>
    apiFetch<{ data: PekerjaanOption[]; more: boolean }>(
      `/tender/pekerjaan${toQuery({ term, id_location: idLocation, page, item_name: itemName })}`
    ),

  hargaPekerjaan: (id: string) =>
    apiFetch<ApiData<HargaPekerjaan>>(`/tender/pekerjaan/${encodeURIComponent(id)}/harga`).then((res) => res.data),

  /* ===================== QUICK COUNT ===================== */

  lokasi: () => apiFetch<ApiData<LokasiProvinsi[]>>("/tender/lokasi").then((res) => res.data),

  previewExcel: (file: File, onProgress?: (persen: number) => void) => {
    const body = new FormData()
    body.append("excel_file", file)
    return apiUpload<PreviewResult>("/tender/quick-count/preview", body, onProgress)
  },

  // Hasil per urutan nama (index sama dengan names).
  rekomendasi: (idLocation: string, names: string[]) =>
    apiFetch<ApiData<RekomendasiAnalisa[][]>>("/tender/quick-count/rekomendasi", {
      method: "POST",
      body: JSON.stringify({ id_location: idLocation, names }),
    }).then((res) => res.data),

  simpanQuickCount: (payload: SimpanQuickCountPayload) =>
    apiFetch<SimpanQuickCountResult>("/tender/quick-count", { method: "POST", body: JSON.stringify(payload) }),

  eksporItem: (uuid: string, namaProyek: string) =>
    apiDownload(`${uuidPath(uuid)}/ekspor-item`, `Quick_Count_Item_${namaFile(namaProyek)}.xlsx`),

  eksporHasil: (uuid: string, namaProyek: string, payload: EksporHasilPayload) =>
    apiDownload(`${uuidPath(uuid)}/ekspor-hasil`, `Quick_Count_${namaFile(namaProyek)}.xlsx`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
}

const namaFile = (nama: string) => nama.replace(/[^a-zA-Z0-9_]/g, "_")
