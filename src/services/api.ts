export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api"

// Sementara belum ada login: user untuk created_by/updated_by dikirim lewat header X-User.
export const API_USER = import.meta.env.VITE_API_USER ?? ""

export class ApiError extends Error {
  status: number

  constructor(status: number, statusText: string) {
    super(`API ${status}: ${statusText}`)
    this.status = status
  }
}

// Pesan error untuk user: bedakan server mati, endpoint belum ada, dan error server.
export function apiErrorMessage(err: unknown, aksi: string) {
  if (err instanceof ApiError) {
    if (err.status === 404 || err.status === 405) {
      return `${aksi}: endpoint belum tersedia di server (HTTP ${err.status}). Restart backend dengan build terbaru.`
    }
    return `${aksi}: server error (HTTP ${err.status}). Cek log backend.`
  }
  return `${aksi}: tidak bisa terhubung ke server. Pastikan backend jalan di ${API_BASE_URL}.`
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const isFormData = init?.body instanceof FormData
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(API_USER ? { "X-User": API_USER } : {}),
      ...init?.headers,
    },
  })
  if (!res.ok) {
    throw new ApiError(res.status, res.statusText)
  }
  return res.json() as Promise<T>
}

// Upload FormData dengan progres (fetch tidak punya event progres upload).
export function apiUpload<T>(path: string, body: FormData, onProgress?: (persen: number) => void): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("POST", `${API_BASE_URL}${path}`)
    if (API_USER) xhr.setRequestHeader("X-User", API_USER)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.min(99, Math.round((e.loaded / e.total) * 100)))
    }
    // Upload selesai (event progres tidak selalu dikirim): sisanya menunggu server memproses.
    xhr.upload.onload = () => onProgress?.(100)
    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new ApiError(xhr.status, xhr.statusText))
        return
      }
      try {
        resolve(JSON.parse(xhr.responseText) as T)
      } catch {
        reject(new ApiError(xhr.status, "Respons bukan JSON"))
      }
    }
    xhr.onerror = () => reject(new Error("Network error"))
    xhr.send(body)
  })
}

// Unduh file dari API (mis. ekspor Excel) lalu simpan dengan nama file yang diberikan.
export async function apiDownload(path: string, namaFile: string, init?: RequestInit) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(API_USER ? { "X-User": API_USER } : {}),
    },
  })
  if (!res.ok) {
    throw new ApiError(res.status, res.statusText)
  }
  const url = URL.createObjectURL(await res.blob())
  const link = document.createElement("a")
  link.href = url
  link.download = namaFile
  link.click()
  URL.revokeObjectURL(url)
}

// Query string dari object; nilai kosong/undefined dilewati.
export function toQuery(params: Record<string, string | number | undefined | null>) {
  const q = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") q.set(key, String(value))
  }
  const s = q.toString()
  return s ? `?${s}` : ""
}
