import Link from "next/link"
import { Search, Plus } from "lucide-react"

export default function MarketingHero({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <section className="marketing-hero">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 lg:py-28 text-center">
        <span className="marketing-hero__eyebrow">Community Pledges · Beta</span>
        <h1 className="marketing-hero__title">
          Server costs that are all fun &amp; games
        </h1>
        <p className="marketing-hero__lead">
          Community Pledges is great for sharing hosting costs, whether you&apos;re part of a
          Minecraft realm, a Rust clan, or a five-person Valheim crew. Pledge what you can — we
          split the bill fairly.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <Link href="/servers" className="btn-marketing-white">
            <Search className="w-5 h-5 shrink-0" />
            Browse servers
          </Link>
          {isLoggedIn ? (
            <Link href="/dashboard/server/create" className="btn-marketing-blurple">
              <Plus className="w-5 h-5 shrink-0" />
              Create a server
            </Link>
          ) : (
            <Link href="/register" className="btn-marketing-blurple">
              Sign up for free
            </Link>
          )}
        </div>
        {!isLoggedIn && (
          <p className="marketing-hero__footnote mt-4">
            Already have an account?{" "}
            <Link href="/login" className="marketing-hero__link">
              Log in
            </Link>
          </p>
        )}
      </div>
    </section>
  )
}
