export default function PledgeProgressBar({
  percent,
  size = "md",
  className = "",
}: {
  percent: number
  size?: "sm" | "md" | "lg"
  className?: string
}) {
  const clamped = Math.min(Math.max(percent, 0), 100)
  const sizeClass =
    size === "lg" ? "pledge-progress-track--lg" : size === "sm" ? "pledge-progress-track--sm" : ""

  return (
    <div className={`pledge-progress-track ${sizeClass} ${className}`.trim()}>
      <span className="pledge-progress-fill" style={{ width: `${clamped}%` }} />
    </div>
  )
}
