"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function ServerDetailScrollBack({ showAfter = 200 }: { showAfter?: number }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > showAfter)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [showAfter])

  return (
    <Link
      href="/servers"
      className={`server-detail-scroll-back ${visible ? "server-detail-scroll-back--visible" : ""}`}
      aria-label="Back to servers"
      title="Back to servers"
    >
      <ArrowLeft className="w-5 h-5" aria-hidden />
    </Link>
  )
}
