import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Users, DollarSign, Heart } from "lucide-react"
import LiveStreamerEmbed from "@/components/LiveStreamerEmbed"
import MarketingHero from "@/components/MarketingHero"
import MarketingPageShell from "@/components/marketing/MarketingPageShell"
import MarketingGlassPanel, {
  MarketingFeatureTile,
} from "@/components/marketing/MarketingGlassPanel"

function StepItem({ n, title, text }: { n: number; title: string; text: string }) {
  return (
    <div className="marketing-step">
      <div className="marketing-step__num">{n}</div>
      <div>
        <h4 className="marketing-step__title">{title}</h4>
        <p className="marketing-step__text">{text}</p>
      </div>
    </div>
  )
}

export default async function Home() {
  const session = await getServerSession(authOptions)

  return (
    <MarketingPageShell>
      <MarketingHero isLoggedIn={!!session} />

      <MarketingGlassPanel title="Why Community Pledges?" visual="features">
        <div className="marketing-features-grid">
          <MarketingFeatureTile
            icon={DollarSign}
            title="Split cost sharing"
            description="Pay only what you pledged or less. We optimize costs when others pledge alongside you, respecting your limit."
          />
          <MarketingFeatureTile
            icon={Users}
            title="Community driven"
            description="Join forces with other members to make server costs more affordable for owners."
          />
          <MarketingFeatureTile
            icon={Heart}
            title="Transparent process"
            description="See exactly what you'll pay and how your pledge helped reduce costs for everyone."
          />
        </div>
      </MarketingGlassPanel>

      <MarketingGlassPanel
        visual="pledge"
        title="Split hosting costs fairly"
        description="Set a monthly goal for your server and let members pledge what they can afford. Our system divides the bill so nobody pays more than they promised — and often less when the community grows."
        className="marketing-section--tight-bottom"
      />

      <MarketingGlassPanel
        visual="community"
        reverse
        title="For community members"
        className="marketing-section--tight-top"
        description="Join servers you love and help keep them online without breaking the bank."
      >
        <div className="marketing-steps-grid">
          <StepItem
            n={1}
            title="Browse servers to play"
            text="Discover Minecraft, Rust, Terraria, ARK, Valheim communities and more."
          />
          <StepItem
            n={2}
            title="Pledge your support"
            text="Choose what you can contribute monthly — $2, $5, $10, or more."
          />
          <StepItem
            n={3}
            title="Pay less than you pledged"
            text="When others join, costs split. You often pay less while still supporting the server."
          />
          <StepItem
            n={4}
            title="Enjoy & connect"
            text="Play knowing you're helping keep the server alive with your community."
          />
        </div>
      </MarketingGlassPanel>

      <MarketingGlassPanel
        visual="owners"
        title="For server owners"
        description="Share hosting costs with the people who actually play on your server."
      >
        <div className="marketing-steps-grid">
          <StepItem
            n={1}
            title="Upload your server"
            text="List your community, game type, and monthly hosting costs."
          />
          <StepItem
            n={2}
            title="Invite your community"
            text="Share with Discord, friends, and socials so members can pledge."
          />
          <StepItem
            n={3}
            title="Watch pledges come in"
            text="Track how much of your hosting bill the community covers."
          />
          <StepItem
            n={4}
            title="Focus on your community"
            text="Spend less time on bills and more time building great player experiences."
          />
        </div>
      </MarketingGlassPanel>

      <section className="marketing-section">
        <div className="marketing-glass marketing-glass--stream">
          <LiveStreamerEmbed />
        </div>
      </section>
    </MarketingPageShell>
  )
}
