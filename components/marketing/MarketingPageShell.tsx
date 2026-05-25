import MarketingSparkles from "./MarketingSparkles"

export default function MarketingPageShell({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <div className="marketing-page-backdrop" aria-hidden>
        <div className="marketing-page__gradient" />
        <div className="marketing-page__glow marketing-page__glow--purple" />
        <div className="marketing-page__glow marketing-page__glow--blue" />
        <div className="marketing-page__glow marketing-page__glow--pink" />
        <div className="marketing-page__glow marketing-page__glow--mid" />
        <MarketingSparkles />
      </div>
      <div className="marketing-page marketing-page__content">{children}</div>
    </>
  )
}
