import type { SVGProps } from "react"

export function MethodIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} {...props}>
      <circle cx="6" cy="12" r="3" fill="currentColor" stroke="none" />
      <circle cx="16" cy="12" r="4.5" />
    </svg>
  )
}
