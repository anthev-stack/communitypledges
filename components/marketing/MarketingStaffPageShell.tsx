import MarketingSparkles from "./MarketingSparkles"

export default function MarketingStaffPageShell({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <div className="staff-page-backdrop" aria-hidden>
        <div className="staff-page__gradient" />
        <div className="staff-page__moon" />
        <div className="staff-page__glow staff-page__glow--crimson" />
        <div className="staff-page__glow staff-page__glow--ember" />
        <div className="staff-page__glow staff-page__glow--wine" />
        <div className="staff-page__glow staff-page__glow--shadow" />
        <MarketingSparkles />
      </div>
      <div className="staff-page marketing-page marketing-page__content">{children}</div>
    </>
  )
}
