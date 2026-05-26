import MarketingSparkles from "@/components/marketing/MarketingSparkles"

export default function PledgeModalBackdrop() {
  return (
    <div className="pledge-modal-backdrop" aria-hidden>
      <div className="pledge-modal-backdrop__gradient" />
      <div className="pledge-modal-backdrop__glow pledge-modal-backdrop__glow--violet" />
      <div className="pledge-modal-backdrop__glow pledge-modal-backdrop__glow--indigo" />
      <div className="pledge-modal-backdrop__glow pledge-modal-backdrop__glow--amber" />
      <div className="pledge-modal-backdrop__stars" />
      <MarketingSparkles />
    </div>
  )
}
