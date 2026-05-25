const SPARKLES = [
  { top: "4%", left: "6%", kind: "plus", size: 18, opacity: 0.5 },
  { top: "7%", left: "24%", kind: "dot", size: 4, opacity: 0.65 },
  { top: "5%", left: "42%", kind: "square", size: 8, opacity: 0.35 },
  { top: "9%", left: "58%", kind: "plus", size: 14, opacity: 0.4 },
  { top: "6%", left: "76%", kind: "dot", size: 5, opacity: 0.55 },
  { top: "8%", left: "92%", kind: "plus", size: 20, opacity: 0.45 },
  { top: "14%", left: "12%", kind: "square", size: 6, opacity: 0.4 },
  { top: "18%", left: "88%", kind: "dot", size: 4, opacity: 0.5 },
  { top: "22%", left: "35%", kind: "plus", size: 16, opacity: 0.35 },
  { top: "26%", left: "68%", kind: "dot", size: 5, opacity: 0.45 },
  { top: "30%", left: "8%", kind: "plus", size: 12, opacity: 0.38 },
  { top: "34%", left: "52%", kind: "square", size: 9, opacity: 0.3 },
  { top: "38%", left: "82%", kind: "plus", size: 14, opacity: 0.42 },
  { top: "42%", left: "22%", kind: "dot", size: 4, opacity: 0.5 },
  { top: "46%", left: "48%", kind: "plus", size: 20, opacity: 0.4 },
  { top: "50%", left: "72%", kind: "square", size: 7, opacity: 0.35 },
  { top: "54%", left: "5%", kind: "dot", size: 5, opacity: 0.55 },
  { top: "58%", left: "38%", kind: "plus", size: 15, opacity: 0.36 },
  { top: "62%", left: "91%", kind: "dot", size: 4, opacity: 0.48 },
  { top: "66%", left: "18%", kind: "square", size: 8, opacity: 0.32 },
  { top: "70%", left: "58%", kind: "plus", size: 22, opacity: 0.45 },
  { top: "74%", left: "78%", kind: "dot", size: 6, opacity: 0.5 },
  { top: "78%", left: "32%", kind: "plus", size: 13, opacity: 0.38 },
  { top: "82%", left: "8%", kind: "dot", size: 4, opacity: 0.42 },
  { top: "86%", left: "62%", kind: "square", size: 10, opacity: 0.3 },
  { top: "90%", left: "44%", kind: "plus", size: 17, opacity: 0.4 },
  { top: "94%", left: "85%", kind: "dot", size: 5, opacity: 0.55 },
  { top: "96%", left: "15%", kind: "plus", size: 14, opacity: 0.35 },
] as const

function Sparkle({
  kind,
  size,
  opacity,
}: {
  kind: (typeof SPARKLES)[number]["kind"]
  size: number
  opacity: number
}) {
  const style = { width: size, height: size, opacity }
  if (kind === "plus") {
    return (
      <span className="marketing-sparkle marketing-sparkle--plus" style={style} aria-hidden>
        +
      </span>
    )
  }
  if (kind === "square") {
    return <span className="marketing-sparkle marketing-sparkle--square" style={style} aria-hidden />
  }
  return <span className="marketing-sparkle marketing-sparkle--dot" style={style} aria-hidden />
}

export default function MarketingSparkles() {
  return (
    <div className="marketing-page__sparkles" aria-hidden>
      {SPARKLES.map((s, i) => (
        <span
          key={i}
          className="marketing-page__sparkle-item"
          style={{ top: s.top, left: s.left }}
        >
          <Sparkle kind={s.kind} size={s.size} opacity={s.opacity} />
        </span>
      ))}
    </div>
  )
}
