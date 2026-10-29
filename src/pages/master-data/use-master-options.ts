import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { masterService } from "@/services/master-service"
import type { Lokasi, MasterOptions } from "@/types/master"

export function lokasiLabel(lokasi: Lokasi) {
  return lokasi.kode === lokasi.nama ? lokasi.kode : `${lokasi.kode} - ${lokasi.nama}`
}

// Data dropdown/filter halaman master dari backend; reload() dipanggil setelah data berubah.
export function useMasterOptions() {
  const [options, setOptions] = useState<MasterOptions | null>(null)

  const reload = useCallback(() => {
    masterService
      .options()
      .then(setOptions)
      .catch(() => toast.error("Gagal memuat pilihan filter."))
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  return { options, reload }
}
