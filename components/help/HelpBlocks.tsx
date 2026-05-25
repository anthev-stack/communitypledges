import { LucideIcon, Check } from "lucide-react"
import { ReactNode } from "react"

export function HelpSection({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon?: LucideIcon
  children: ReactNode
}) {
  return (
    <section>
      <h2 className="help-article__heading flex items-center gap-2">
        {Icon && <Icon className="w-6 h-6 shrink-0 text-[#949cf7]" aria-hidden />}
        {title}
      </h2>
      <div className="help-article__body space-y-4">{children}</div>
    </section>
  )
}

export function HelpSubheading({
  title,
  icon: Icon,
}: {
  title: string
  icon?: LucideIcon
}) {
  return (
    <h3 className="help-article__subheading flex items-center gap-2">
      {Icon && <Icon className="w-5 h-5 shrink-0 text-[#949cf7]" aria-hidden />}
      {title}
    </h3>
  )
}

export function HelpCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`listing-card p-4 md:p-6 ${className}`}>{children}</div>
}

export function HelpCallout({
  label = "Important",
  children,
}: {
  label?: string
  children: ReactNode
}) {
  return (
    <p className="help-article__text text-sm">
      <strong>{label}:</strong> {children}
    </p>
  )
}

export function HelpBulletList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="help-article__list list-disc list-inside space-y-1 text-sm">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  )
}

export function HelpCheckList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2 text-sm">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2">
          <Check className="w-4 h-4 shrink-0 mt-0.5 text-[#57f287]" aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export function HelpFieldTip({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="help-article__tip border-l-4 border-[#5865f2] pl-4">
      <h4 className="font-semibold mb-1">{title}</h4>
      <div className="help-article__text text-sm">{children}</div>
    </div>
  )
}

export function HelpStep({
  number,
  title,
  children,
}: {
  number: number
  title: string
  children: ReactNode
}) {
  return (
    <div className="flex items-start gap-4">
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#5865f2] text-sm font-bold text-white"
        aria-hidden
      >
        {number}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold mb-1">{title}</h4>
        <div className="help-article__text text-sm">{children}</div>
      </div>
    </div>
  )
}
