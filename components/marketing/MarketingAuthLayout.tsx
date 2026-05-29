import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ReactNode } from "react"

type Props = {
  title: string
  subtitle?: ReactNode
  backHref?: string
  backLabel?: string
  children: ReactNode
}

export default function MarketingAuthLayout({
  title,
  subtitle,
  backHref,
  backLabel = "Back to login",
  children,
}: Props) {
  return (
    <section className="auth-page marketing-auth">
      <div className="marketing-auth__inner">
        {backHref && (
          <Link href={backHref} className="marketing-auth__back">
            <ArrowLeft className="w-4 h-4" aria-hidden />
            {backLabel}
          </Link>
        )}
        <div className="marketing-auth__card">
          <header className="marketing-auth__header">
            <h1 className="marketing-auth__title">{title}</h1>
            {subtitle && <p className="marketing-auth__subtitle">{subtitle}</p>}
          </header>
          {children}
        </div>
      </div>
    </section>
  )
}
