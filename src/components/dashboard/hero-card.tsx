import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ROUTES } from "@/config/menu"

export function HeroCard() {
  return (
    <Card className="border-0 bg-slate-50/70 py-0 shadow-sm ring-1 ring-slate-100">
      <CardContent className="flex flex-col gap-8 p-6 md:flex-row md:items-start">
        <div className="flex-1 space-y-5">
          <p className="text-justify leading-relaxed text-slate-700">
            <span className="font-bold text-blue-600">SEG</span> provides highly accurate
            construction cost estimates, offering a wide range of estimating methods, innovative
            solutions, value engineering, and financial engineering. By focusing on efficient
            techniques, SEG helps achieve total project savings, increase client profits, and
            reduce both time and costs.
          </p>
          <Button
            asChild
            size="lg"
            className="h-11 rounded-sm bg-blue-600 px-4 text-base text-white hover:bg-blue-700"
          >
            <Link to={ROUTES.quickCount}>Quick Count</Link>
          </Button>
        </div>

        <div className="relative flex h-36 w-full shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-pink-50 via-sky-50 to-blue-100 shadow-lg md:w-64">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-emerald-50/60" />
          <div className="relative size-20 animate-[spin_6s_linear_infinite] rounded-full bg-[conic-gradient(from_0deg,#2563eb,#06b6d4,#a855f7,#ec4899,#2563eb)] p-2 shadow-[0_0_24px_rgb(59_130_246/0.45)]">
            <div className="size-full rounded-full bg-sky-50" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
