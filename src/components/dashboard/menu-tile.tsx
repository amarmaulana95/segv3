import { Link } from "react-router-dom"

import type { MenuItem } from "@/types/menu"

const tileClass = "group flex w-20 flex-col items-center gap-2.5 text-center outline-none"

interface MenuTileProps {
  item: MenuItem
  // Dipanggil saat menu yang belum tersedia diklik.
  onUnavailable: (item: MenuItem) => void
}

export function MenuTile({ item, onUnavailable }: MenuTileProps) {
  const Icon = item.icon
  const content = (
    <>
      <span className="flex size-14 items-center justify-center rounded-xl bg-gradient-to-b from-blue-700 to-blue-900 text-white shadow-[0_6px_10px_-2px_rgb(30_58_138/0.45)] transition-all group-hover:-translate-y-0.5 group-hover:shadow-[0_10px_16px_-4px_rgb(30_58_138/0.55)] group-focus-visible:ring-3 group-focus-visible:ring-blue-500/50">
        <Icon className="size-6" />
      </span>
      <span className="text-[13px] leading-snug text-slate-600 group-hover:text-blue-700">
        {item.label}
      </span>
    </>
  )

  if (item.available === false) {
    return (
      <button type="button" className={tileClass} onClick={() => onUnavailable(item)}>
        {content}
      </button>
    )
  }

  return (
    <Link to={item.path} className={tileClass}>
      {content}
    </Link>
  )
}
