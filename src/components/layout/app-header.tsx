import { Grip, LogOut, User } from "lucide-react"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { FiturBelumTersediaDialog } from "@/components/common/fitur-belum-tersedia-dialog"
import { SegLogo } from "@/components/icons/seg-logo"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ALL_MENU_ITEMS, ROUTES } from "@/config/menu"

export function AppHeader() {
  const navigate = useNavigate()
  const [fitur, setFitur] = useState<string | null>(null)

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white shadow-sm print:hidden">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-6 md:px-20">
        <div className="flex items-center gap-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-lg" aria-label="Open apps menu">
                <Grip className="size-6 text-slate-800" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Menu</DropdownMenuLabel>
              {ALL_MENU_ITEMS.map((item) => (
                <DropdownMenuItem
                  key={item.key}
                  onSelect={() => (item.available === false ? setFitur(item.label) : navigate(item.path))}
                >
                  <item.icon />
                  {item.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Link to={ROUTES.dashboard} aria-label="SEG home">
            <SegLogo />
          </Link>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Account menu"
              className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-blue-500/50"
            >
              <Avatar className="size-11 ring-2 ring-slate-100">
                <AvatarFallback className="bg-slate-600 text-white">
                  <User className="size-6" />
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive">
              <LogOut />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <FiturBelumTersediaDialog fitur={fitur} onClose={() => setFitur(null)} />
    </header>
  )
}
