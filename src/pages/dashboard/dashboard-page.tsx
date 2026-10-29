import { Sparkles } from "lucide-react"

import { HeroCard } from "@/components/dashboard/hero-card"
import { MenuSection } from "@/components/dashboard/menu-section"
import { APP_NAME, APP_VERSION, MENU_SECTIONS } from "@/config/menu"

export function DashboardPage() {
  return (
    <div className="grid gap-12 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-16">
      <div className="space-y-10">
        {MENU_SECTIONS.map((section) => (
          <MenuSection key={section.title} section={section} />
        ))}
      </div>

      <div className="space-y-10">
        <h1 className="text-2xl font-bold text-slate-900">
          {APP_NAME} {APP_VERSION}{" "}
          <Sparkles className="inline size-6 -translate-y-0.5 fill-amber-400 text-amber-400" />
        </h1>
        <HeroCard />
      </div>
    </div>
  )
}
