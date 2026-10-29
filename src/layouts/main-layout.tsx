import { Outlet } from "react-router-dom"

import { AppHeader } from "@/components/layout/app-header"

export function MainLayout() {
  return (
    <div className="min-h-svh bg-white">
      <AppHeader />
      <main className="mx-auto max-w-[1600px] px-6 py-12 md:px-20">
        <Outlet />
      </main>
    </div>
  )
}
