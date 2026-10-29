import { Check, Loader2, Search } from "lucide-react"

import { cn } from "@/lib/utils"

export interface LoaderState {
  title: string
  sub: string
  step: 1 | 2 | 3 // tahap aktif; tahap sebelumnya dianggap selesai
  done?: boolean // semua tahap selesai, tampilkan ringkasan
}

const LANGKAH = ["Mengunggah & membaca file", "Mencocokkan nama dengan bank data AHSP", "Membandingkan harga"]

// Overlay proses upload & pencocokan rekomendasi (meniru #rek-loader simseg).
export function RekomendasiLoader({ state }: { state: LoaderState | null }) {
  if (!state) return null
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-2xl bg-background p-6 text-center shadow-xl">
        <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full border-2 border-blue-100 bg-blue-50 text-blue-700">
          {state.done ? <Check className="size-8" /> : <Search className="size-8 animate-pulse" />}
        </div>
        <h2 className="text-lg font-bold">{state.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{state.sub}</p>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
          {state.done ? (
            <div className="h-full w-full bg-blue-700" />
          ) : (
            <div className="h-full w-1/3 animate-[impor-loading_1.2s_ease-in-out_infinite] rounded-full bg-blue-700" />
          )}
        </div>
        <ul className="mt-5 space-y-2.5 text-left text-sm">
          {LANGKAH.map((label, i) => {
            const nomor = i + 1
            const selesai = state.done || nomor < state.step
            const aktif = !state.done && nomor === state.step
            return (
              <li key={label} className="flex items-center gap-2.5">
                {selesai ? (
                  <span className="flex size-5 items-center justify-center rounded-full bg-blue-700 text-white">
                    <Check className="size-3" />
                  </span>
                ) : aktif ? (
                  <Loader2 className="size-5 animate-spin text-blue-700" />
                ) : (
                  <span className="size-5 rounded-full border-2 border-muted" />
                )}
                <span
                  className={cn(
                    selesai && "text-blue-700",
                    aktif && "font-medium",
                    !selesai && !aktif && "text-muted-foreground"
                  )}
                >
                  {label}
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
