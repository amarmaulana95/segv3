import {
  CircleCheckBig,
  CircleDollarSign,
  Contrast,
  Database,
  FileText,
  Lightbulb,
} from "lucide-react"

import { MethodIcon } from "@/components/icons/method-icon"
import type { MenuSection } from "@/types/menu"

export const APP_NAME = "Smart Estimating Guide"
export const APP_VERSION = "v1.0.2"

export const ROUTES = {
  dashboard: "/",
  method: "/method",
  innovation: "/innovation",
  valueEng: "/value-eng",
  financeEng: "/finance-eng",
  quickCount: "/quick-count",
  quickCountData: "/quick-count/data",
  quickCountHistory: "/quick-count/history",
  quickCountHistoryDetail: "/quick-count/history/:uuid",
  docs: "/docs",
  masterData: "/master-data",
  masterAnalisa: "/master-data/analisa",
  masterHargaSatuan: "/master-data/harga-satuan",
} as const

export const MENU_SECTIONS: MenuSection[] = [
  {
    title: "Dashboard menu",
    items: [
      { key: "method", label: "Method", path: ROUTES.method, icon: MethodIcon, available: false },
      { key: "innovation", label: "Innovation", path: ROUTES.innovation, icon: Lightbulb, available: false },
      { key: "value-eng", label: "Value Eng", path: ROUTES.valueEng, icon: Contrast, available: false },
      {
        key: "finance-eng",
        label: "Finance Eng",
        path: ROUTES.financeEng,
        icon: CircleDollarSign,
        available: false,
      },
      {
        key: "quick-count-history",
        label: "Quick Count History",
        path: ROUTES.quickCountHistory,
        icon: CircleCheckBig,
      },
    ],
  },
  {
    title: "Help Desk",
    items: [{ key: "docs", label: "Docs", path: ROUTES.docs, icon: FileText }],
  },
  {
    title: "Master Data",
    items: [{ key: "data", label: "Data", path: ROUTES.masterData, icon: Database }],
  },
]

export const ALL_MENU_ITEMS = MENU_SECTIONS.flatMap((section) => section.items)
