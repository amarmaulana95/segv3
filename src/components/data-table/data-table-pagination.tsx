import type { Table } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"

// Nomor halaman yang ditampilkan: awal, akhir, dan sekitar halaman aktif (sisanya "...").
function pageNumbers(current: number, count: number): (number | "...")[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i)
  const pages = new Set([0, count - 1, current - 1, current, current + 1])
  const result: (number | "...")[] = []
  let prev = -1
  for (const page of [...pages].filter((p) => p >= 0 && p < count).sort((a, b) => a - b)) {
    if (page - prev > 1) result.push("...")
    result.push(page)
    prev = page
  }
  return result
}

interface DataTablePaginationProps<TData> {
  table: Table<TData>
  total: number
  itemLabel?: string
}

export function DataTablePagination<TData>({ table, total, itemLabel = "data" }: DataTablePaginationProps<TData>) {
  const { pageIndex, pageSize } = table.getState().pagination
  const from = total === 0 ? 0 : pageIndex * pageSize + 1
  const to = Math.min(total, (pageIndex + 1) * pageSize)

  return (
    <div className="flex flex-col gap-3 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
      <p className="text-sm text-muted-foreground">
        {total === 0 ? "Tidak ada data" : `Menampilkan ${from}–${to} dari ${total} ${itemLabel}`}
      </p>
      <div className="flex flex-wrap items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Sebelumnya
        </Button>
        {pageNumbers(pageIndex, table.getPageCount()).map((page, i) =>
          page === "..." ? (
            <span key={`gap-${i}`} className="px-2 text-sm text-muted-foreground">
              ...
            </span>
          ) : (
            <Button
              key={page}
              variant={page === pageIndex ? "default" : "ghost"}
              size="icon-sm"
              onClick={() => table.setPageIndex(page)}
            >
              {page + 1}
            </Button>
          )
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Berikutnya
        </Button>
      </div>
    </div>
  )
}
