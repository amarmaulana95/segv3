import type { ComponentType, SVGProps } from "react"

export type MenuIcon = ComponentType<SVGProps<SVGSVGElement>>

export interface MenuItem {
  key: string
  label: string
  path: string
  icon: MenuIcon
  // false = fitur belum tersedia: klik menampilkan pemberitahuan, bukan membuka halaman.
  available?: boolean
}

export interface MenuSection {
  title: string
  items: MenuItem[]
}
