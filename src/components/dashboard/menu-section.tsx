import { useState } from "react"

import { FiturBelumTersediaDialog } from "@/components/common/fitur-belum-tersedia-dialog"
import type { MenuSection as MenuSectionType } from "@/types/menu"

import { MenuTile } from "./menu-tile"

export function MenuSection({ section }: { section: MenuSectionType }) {
  const [fitur, setFitur] = useState<string | null>(null)

  return (
    <section className="space-y-6">
      <h2 className="text-sm font-semibold text-slate-600">{section.title}</h2>
      <div className="flex flex-wrap gap-x-4 gap-y-6">
        {section.items.map((item) => (
          <MenuTile key={item.key} item={item} onUnavailable={(menu) => setFitur(menu.label)} />
        ))}
      </div>
      <FiturBelumTersediaDialog fitur={fitur} onClose={() => setFitur(null)} />
    </section>
  )
}
