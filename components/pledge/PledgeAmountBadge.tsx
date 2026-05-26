import { ReactNode } from "react"

export default function PledgeAmountBadge({
  children,
  variant = "default",
  size = "md",
  className = "",
}: {
  children: ReactNode
  variant?: "default" | "optimized"
  size?: "sm" | "md" | "lg"
  className?: string
}) {
  const variantClass =
    variant === "optimized" ? "pledge-amount-badge--optimized" : ""
  const sizeClass =
    size === "lg" ? "pledge-amount-badge--lg" : size === "sm" ? "pledge-amount-badge--sm" : ""

  return (
    <span className={`pledge-amount-badge ${variantClass} ${sizeClass} ${className}`.trim()}>
      {children}
    </span>
  )
}
