import Link from "next/link"
import { ReactNode } from "react"
import { ArrowLeft } from "lucide-react"
import MarketingListingLayout from "@/components/marketing/MarketingListingLayout"

export default function HelpArticleLayout({
  title,
  subtitle,
  backHref = "/help",
  backLabel = "Back to Help Center",
  children,
}: {
  title: string
  subtitle: string
  backHref?: string
  backLabel?: string
  children: ReactNode
}) {
  return (
    <MarketingListingLayout title={title} subtitle={subtitle}>
      <Link
        href={backHref}
        className="help-article-back inline-flex items-center text-sm font-medium mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-1" aria-hidden />
        {backLabel}
      </Link>
      <article className="help-article space-y-8">{children}</article>
    </MarketingListingLayout>
  )
}
