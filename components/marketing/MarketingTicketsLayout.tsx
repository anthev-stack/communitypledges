import Link from "next/link"
import { ReactNode } from "react"
import { ArrowLeft } from "lucide-react"
import MarketingPageShell from "./MarketingPageShell"

export default function MarketingTicketsLayout({
  title,
  subtitle,
  children,
  backHref,
  backLabel = "Back to Tickets",
  action,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  backHref?: string
  backLabel?: string
  action?: ReactNode
}) {
  return (
    <MarketingPageShell>
      <section className="marketing-listing-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
          {backHref && (
            <Link href={backHref} className="help-article-back inline-flex items-center text-sm font-medium mb-4">
              <ArrowLeft className="w-4 h-4 mr-1" aria-hidden />
              {backLabel}
            </Link>
          )}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between text-center md:text-left">
            <div>
              <h1 className="marketing-listing-header__title">{title}</h1>
              {subtitle && <p className="marketing-listing-header__subtitle mt-2">{subtitle}</p>}
            </div>
            {action && <div className="shrink-0 flex justify-center md:justify-end">{action}</div>}
          </div>
        </div>
      </section>
      <section className="marketing-section marketing-section--listing">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
      </section>
    </MarketingPageShell>
  )
}
