import segLogo from "@/assets/seg-logo.png"
import { cn } from "@/lib/utils"

export function SegLogo({ className }: { className?: string }) {
  return <img src={segLogo} alt="SEG" className={cn("h-6 w-auto", className)} />
}
