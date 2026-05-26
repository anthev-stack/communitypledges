import { ReactNode } from "react"
import { DollarSign, Users, Server, Heart } from "lucide-react"
import PledgeProgressBar from "@/components/pledge/PledgeProgressBar"
import PledgeAmountBadge from "@/components/pledge/PledgeAmountBadge"
import MarketingCommunityAvatars from "@/components/marketing/MarketingCommunityAvatars"

type VisualVariant = "pledge" | "community" | "owners" | "features"

export default function MarketingGlassPanel({
  title,
  description,
  children,
  visual = "pledge",
  reverse = false,
  className = "",
}: {
  title: string
  description?: string
  children?: ReactNode
  visual?: VisualVariant
  reverse?: boolean
  className?: string
}) {
  const showSplit = visual !== "features"

  return (
    <section className={`marketing-section ${className}`}>
      <div
        className={`marketing-glass ${showSplit ? "marketing-glass--split" : ""} ${
          reverse && showSplit ? "marketing-glass--reverse" : ""
        }`}
      >
        {showSplit && (
          <div className="marketing-glass__visual" aria-hidden>
            <MarketingVisual variant={visual} />
          </div>
        )}
        <div className={showSplit ? "marketing-glass__body" : "marketing-glass__body marketing-glass__body--full"}>
          <h2 className="marketing-glass__title">{title}</h2>
          {description && <p className="marketing-glass__text">{description}</p>}
          {children}
        </div>
      </div>
    </section>
  )
}

function MarketingVisual({ variant }: { variant: VisualVariant }) {
  if (variant === "pledge") {
    return (
      <div className="marketing-visual marketing-visual--pledge">
        <div className="marketing-visual__blob" />
        <div className="marketing-visual__card">
          <div className="marketing-visual__card-header">
            <Server className="w-5 h-5" />
            <span>Realm of Eldoria</span>
          </div>
          <PledgeProgressBar percent={72} size="sm" />
          <p className="marketing-visual__stat">$24 / $40 goal · 9 pledgers</p>
          <div className="marketing-visual__chips">
            <PledgeAmountBadge size="sm">$2</PledgeAmountBadge>
            <PledgeAmountBadge size="sm">$5</PledgeAmountBadge>
            <PledgeAmountBadge size="sm">$10</PledgeAmountBadge>
          </div>
        </div>
      </div>
    )
  }

  if (variant === "community") {
    return (
      <div className="marketing-visual marketing-visual--community">
        <div className="marketing-visual__blob marketing-visual__blob--blue" />
        <div className="marketing-visual__card marketing-visual__card--center">
          <Users className="w-12 h-12 text-white/90 mb-3" />
          <p className="marketing-visual__big">12 members</p>
          <p className="marketing-visual__sub">pledged this month</p>
          <MarketingCommunityAvatars />
        </div>
      </div>
    )
  }

  return (
    <div className="marketing-visual marketing-visual--owners">
      <div className="marketing-visual__blob marketing-visual__blob--green" />
      <div className="marketing-visual__card marketing-visual__card--center">
        <Heart className="w-12 h-12 text-white/90 mb-3" />
        <p className="marketing-visual__big">Hosting covered</p>
        <p className="marketing-visual__sub">68% by your community</p>
        <div className="marketing-visual__meter">
          <span />
        </div>
      </div>
    </div>
  )
}

export function MarketingFeatureTile({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof DollarSign
  title: string
  description: string
}) {
  return (
    <div className="marketing-feature-tile">
      <div className="marketing-feature-tile__icon">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="marketing-feature-tile__title">{title}</h3>
      <p className="marketing-feature-tile__text">{description}</p>
    </div>
  )
}
