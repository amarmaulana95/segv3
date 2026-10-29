import { Outlet, useLocation, useNavigate } from "react-router-dom"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ROUTES } from "@/config/menu"

const MASTER_TABS = [
  { path: ROUTES.masterData, label: "Rekap Analisa", title: "Rekap Analisa" },
  { path: ROUTES.masterAnalisa, label: "Analisa", title: "Data Analisa" },
  { path: ROUTES.masterHargaSatuan, label: "Harga Satuan", title: "Harga Satuan" },
]

export function MasterLayout() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const active = MASTER_TABS.find((tab) => tab.path === pathname) ?? MASTER_TABS[0]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{active.title}</h1>
          <p className="text-sm text-muted-foreground">Estimating &amp; Analisis Biaya</p>
        </div>
        <Tabs value={active.path} onValueChange={navigate} className="print:hidden">
          <TabsList className="h-10!">
            {MASTER_TABS.map((tab) => (
              <TabsTrigger key={tab.path} value={tab.path} className="px-4">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      <Outlet />
    </div>
  )
}
