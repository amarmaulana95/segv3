import { Loader2 } from "lucide-react"

import type { ProsesImpor } from "@/lib/impor"
import { cn } from "@/lib/utils"
import type { ImporResult } from "@/types/master"

export function ImporProgress({ proses }: { proses: ProsesImpor }) {
  const adaPersen = proses.tahap === "upload" && proses.persen > 0
  return (
    <div role="status" aria-live="polite" className="space-y-2 rounded-lg border bg-muted/50 px-3 py-3 text-sm">
      <div className="flex items-center gap-2">
        <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
        <span className="flex-1">{proses.pesan}</span>
        {adaPersen && <span className="font-mono text-xs tabular-nums text-muted-foreground">{proses.persen}%</span>}
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        {/* Persen hanya ditampilkan kalau browser mengirim progres upload; selain itu bar berjalan. */}
        {adaPersen ? (
          <div className="h-full bg-primary transition-[width]" style={{ width: `${proses.persen}%` }} />
        ) : (
          <div className="h-full w-1/3 animate-[impor-loading_1.2s_ease-in-out_infinite] rounded-full bg-primary" />
        )}
      </div>
    </div>
  )
}

export function ImporHasilAlert({ hasil }: { hasil: ImporResult }) {
  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2 text-sm",
        hasil.success
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-destructive/30 bg-destructive/5 text-destructive"
      )}
    >
      {hasil.message}
      {!!hasil.errors?.length && (
        <ul className="mt-2 max-h-48 list-disc space-y-0.5 overflow-auto pl-5">
          {hasil.errors.map((err) => (
            <li key={err}>{err}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
