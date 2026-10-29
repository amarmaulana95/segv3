import type { PaginationState, SortingState, Updater } from "@tanstack/react-table"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { useDebounce } from "@/hooks/use-debounce"
import type { DataTablesResult, TableQuery } from "@/types/master"

type Filters = Pick<TableQuery, "filter_tipe" | "filter_lokasi" | "filter_tahun">

// R = bentuk response list; boleh membawa field tambahan di luar format DataTables (mis. can_delete).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface UseServerTableOptions<R extends DataTablesResult<any>> {
  fetcher: (query: TableQuery) => Promise<R>
  filters?: Filters
  defaultSorting: SortingState
  initialSearch?: string
  errorMessage: string
}

// State tabel server-side: search (debounce), paging & sorting dikirim ke backend setiap berubah.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useServerTable<R extends DataTablesResult<any>>({
  fetcher,
  filters,
  defaultSorting,
  initialSearch = "",
  errorMessage,
}: UseServerTableOptions<R>) {
  const [search, setSearchState] = useState(initialSearch)
  const debouncedSearch = useDebounce(search)
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })
  const [sorting, setSortingState] = useState<SortingState>(defaultSorting)
  const [reloadKey, setReloadKey] = useState(0)
  // Hasil terakhir beserta kunci query-nya; loading = query aktif belum punya hasil.
  const [loaded, setLoaded] = useState<{ key: string; response: R | null }>({ key: "", response: null })

  const query: TableQuery = {
    start: pagination.pageIndex * pagination.pageSize,
    length: pagination.pageSize,
    search: debouncedSearch.trim(),
    sort: sorting[0]?.id,
    dir: sorting[0]?.desc ? "desc" : "asc",
    ...filters,
  }
  const queryJson = JSON.stringify(query)
  const queryKey = `${queryJson}#${reloadKey}`

  useEffect(() => {
    let aktif = true
    fetcher(JSON.parse(queryJson) as TableQuery)
      .then((res) => aktif && setLoaded({ key: queryKey, response: res }))
      .catch(() => {
        if (!aktif) return
        toast.error(errorMessage)
        setLoaded((prev) => ({ ...prev, key: queryKey }))
      })
    return () => {
      aktif = false
    }
  }, [fetcher, queryJson, queryKey, errorMessage])

  // Search/filter/sort baru selalu mulai dari halaman pertama.
  const resetPage = useCallback(() => setPagination((p) => (p.pageIndex === 0 ? p : { ...p, pageIndex: 0 })), [])

  const setSearch = useCallback(
    (value: string) => {
      setSearchState(value)
      resetPage()
    },
    [resetPage]
  )

  const setSorting = useCallback(
    (updater: Updater<SortingState>) => {
      setSortingState(updater)
      resetPage()
    },
    [resetPage]
  )

  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  // Query aktif tanpa paging (search/sort/filter), mis. untuk ekspor semua data.
  const { start: _start, length: _length, ...queryTanpaPaging } = query

  return {
    query: queryTanpaPaging,
    search,
    setSearch,
    debouncedSearch,
    pagination,
    setPagination,
    sorting,
    setSorting,
    resetPage,
    reload,
    response: loaded.response,
    rows: (loaded.response?.data ?? []) as R["data"],
    total: loaded.response?.recordsFiltered ?? 0,
    loading: loaded.key !== queryKey,
  }
}
