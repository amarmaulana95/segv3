import { createBrowserRouter } from "react-router-dom"

import { ROUTES } from "@/config/menu"
import { MainLayout } from "@/layouts/main-layout"
import { DashboardPage } from "@/pages/dashboard/dashboard-page"
import { DocsPage } from "@/pages/docs/docs-page"
import { FinanceEngPage } from "@/pages/finance-eng/finance-eng-page"
import { InnovationPage } from "@/pages/innovation/innovation-page"
import { AnalisaPage } from "@/pages/master-data/analisa/analisa-page"
import { HargaSatuanPage } from "@/pages/master-data/harga-satuan/harga-satuan-page"
import { MasterLayout } from "@/pages/master-data/master-layout"
import { RekapAnalisaPage } from "@/pages/master-data/rekap/rekap-analisa-page"
import { MethodPage } from "@/pages/method/method-page"
import { NotFoundPage } from "@/pages/not-found/not-found-page"
import { QuickCountDataPage } from "@/pages/quick-count/quick-count-data-page"
import { QuickCountPage } from "@/pages/quick-count/quick-count-page"
import { ProjectDetailPage } from "@/pages/quick-count-history/detail/project-detail-page"
import { QuickCountHistoryPage } from "@/pages/quick-count-history/quick-count-history-page"
import { ValueEngPage } from "@/pages/value-eng/value-eng-page"

export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { path: ROUTES.dashboard, element: <DashboardPage /> },
      { path: ROUTES.method, element: <MethodPage /> },
      { path: ROUTES.innovation, element: <InnovationPage /> },
      { path: ROUTES.valueEng, element: <ValueEngPage /> },
      { path: ROUTES.financeEng, element: <FinanceEngPage /> },
      { path: ROUTES.quickCount, element: <QuickCountPage /> },
      { path: ROUTES.quickCountData, element: <QuickCountDataPage /> },
      { path: ROUTES.quickCountHistory, element: <QuickCountHistoryPage /> },
      { path: ROUTES.quickCountHistoryDetail, element: <ProjectDetailPage /> },
      { path: ROUTES.docs, element: <DocsPage /> },
      {
        element: <MasterLayout />,
        children: [
          { path: ROUTES.masterData, element: <RekapAnalisaPage /> },
          { path: ROUTES.masterAnalisa, element: <AnalisaPage /> },
          { path: ROUTES.masterHargaSatuan, element: <HargaSatuanPage /> },
        ],
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
])
