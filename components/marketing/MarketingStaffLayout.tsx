import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ReactNode } from "react"
import MarketingStaffPageShell from "./MarketingStaffPageShell"

type Props = {
  children: ReactNode
  title?: string
  subtitle?: string
  backHref?: string
  backLabel?: string
  headerAction?: ReactNode
  /** Use "tabs" when the panel contains a staff-tabs nav (main staff dashboard). */
  variant?: "tabs" | "content"
}

export default function MarketingStaffLayout({
  children,
  title = "Staff",
  subtitle = "Moderate users, servers, tickets, and site assets.",
  backHref,
  backLabel = "Back to Dashboard",
  headerAction,
  variant = "content",
}: Props) {
  return (
    <MarketingStaffPageShell>
      <section className="marketing-listing-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
          {backHref && (
            <Link href={backHref} className="help-article-back staff-back-link inline-flex items-center text-sm font-medium mb-4">
              <ArrowLeft className="w-4 h-4 mr-1" aria-hidden />
              {backLabel}
            </Link>
          )}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between text-center md:text-left">
            <div>
              <h1 className="marketing-listing-header__title">{title}</h1>
              <p className="marketing-listing-header__subtitle mt-2">{subtitle}</p>
            </div>
            {headerAction && (
              <div className="shrink-0 flex justify-center md:justify-end">{headerAction}</div>
            )}
          </div>
        </div>
      </section>
      <section className="marketing-section marketing-section--listing">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="marketing-glass marketing-glass--listing staff-panel">
            {variant === "tabs" ? children : <div className="staff-tabs__body">{children}</div>}
          </div>
        </div>
      </section>
    </MarketingStaffPageShell>
  )
}
