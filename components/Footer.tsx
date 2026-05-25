import Link from "next/link"

export default function Footer() {
  return (
    <footer className="bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-1">
            <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">
              Community Pledges
            </h3>
            <p className="text-sm leading-relaxed">
              Keeping community servers alive since 2025. Share the cost with your community or
              pledge to your favorite server.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[var(--color-text)] mb-3">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/servers" className="hover:text-[var(--color-accent)] transition-colors">
                  Browse Servers
                </Link>
              </li>
              <li>
                <Link href="/users" className="hover:text-[var(--color-accent)] transition-colors">
                  Members
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-[var(--color-accent)] transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/settings" className="hover:text-[var(--color-accent)] transition-colors">
                  Settings
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[var(--color-text)] mb-3">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/help" className="hover:text-[var(--color-accent)] transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/tickets" className="hover:text-[var(--color-accent)] transition-colors">
                  Support Tickets
                </Link>
              </li>
              <li>
                <Link href="/tickets/create" className="hover:text-[var(--color-accent)] transition-colors">
                  Create Ticket
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[var(--color-text)] mb-3">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="hover:text-[var(--color-accent)] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[var(--color-accent)] transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/refund" className="hover:text-[var(--color-accent)] transition-colors">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link href="/security" className="hover:text-[var(--color-accent)] transition-colors">
                  Security
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col md:flex-row justify-between items-center gap-3 border-t border-[var(--color-border)] text-sm">
          <span className="text-[var(--color-text-secondary)]">
            © {new Date().getFullYear()} Community Pledges
          </span>
          <span className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
            Secured with Stripe
          </span>
        </div>
      </div>
    </footer>
  )
}
