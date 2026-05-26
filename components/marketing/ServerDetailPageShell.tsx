import MarketingSparkles from "./MarketingSparkles"

/** Darker grey + purple starry backdrop — distinct from main marketing pages */
export default function ServerDetailPageShell({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <div className="server-detail-page-backdrop marketing-page-backdrop" aria-hidden>
        <div className="server-detail-page__gradient marketing-page__gradient" />
        <div className="server-detail-page__glow server-detail-page__glow--purple marketing-page__glow" />
        <div className="server-detail-page__glow server-detail-page__glow--violet marketing-page__glow" />
        <div className="server-detail-page__glow server-detail-page__glow--deep marketing-page__glow" />
        <MarketingSparkles />
      </div>
      <div className="server-detail-page marketing-page marketing-page__content">{children}</div>
    </>
  )
}
