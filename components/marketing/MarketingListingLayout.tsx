import { ReactNode } from "react"
import MarketingPageShell from "./MarketingPageShell"

export default function MarketingListingLayout({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <MarketingPageShell>
      <section className="marketing-listing-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12 text-center md:text-left">
          <h1 className="marketing-listing-header__title">{title}</h1>
          <p className="marketing-listing-header__subtitle">{subtitle}</p>
        </div>
      </section>
      <section className="marketing-section marketing-section--listing">
        <div className="marketing-glass marketing-glass--listing">{children}</div>
      </section>
    </MarketingPageShell>
  )
}
