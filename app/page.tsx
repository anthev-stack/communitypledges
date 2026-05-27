import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Users, DollarSign, Heart } from "lucide-react"
import LiveStreamerEmbed from "@/components/LiveStreamerEmbed"
import MarketingHero from "@/components/MarketingHero"
import MarketingPageShell from "@/components/marketing/MarketingPageShell"
import { COMMUNITY_DISCORD_INVITE } from "@/lib/discord-invite"
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
        className="marketing-section--tight-bottom"
      >
        <div className="marketing-steps-grid">
          <StepItem
            n={1}
            title="List your server"
            text="Upload your server, set your monthly goal, and tell players what makes it special."
          />
          <StepItem
            n={2}
            title="Connect payouts"
            text="Link Stripe so pledges go straight to you when the community hits your goal."
          />
          <StepItem
            n={3}
            title="Grow your community"
            text="Share your page, boost your listing, and let members pledge what they can afford."
          />
          <StepItem
            n={4}
            title="Hosting covered"
            text="When pledges add up, your players help keep the server online every month."
          />
        </div>
      </MarketingGlassPanel>

      <MarketingGlassPanel
        visual="discord"
        reverse
        title="Join us on Discord"
        className="marketing-section--tight-top"
        description="Hang out with server owners and players, get help, share feedback, and see who's online right now."
      >
        <div className="marketing-steps-grid">
          <StepItem
            n={1}
            title="Meet the community"
            text="Connect with people who run and play on community-funded servers."
          />
          <StepItem
            n={2}
            title="Get support fast"
            text="Ask questions about pledges, payouts, and listing your server."
          />
          <StepItem
            n={3}
            title="Stay in the loop"
            text="Hear about updates, new features, and tips for growing your server."
          />
        </div>
        <a
          href={COMMUNITY_DISCORD_INVITE}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-marketing-blurple marketing-discord-cta"
        >
          discord.gg/jj7GJFe3vH
        </a>
      </MarketingGlassPanel>

      <section className="marketing-section">
        <div className="marketing-glass marketing-glass--stream">
          <LiveStreamerEmbed />
        </div>
      </section>
    </MarketingPageShell>
  )
}
