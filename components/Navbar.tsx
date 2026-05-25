"use client"

import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"

function StaffLink() {
  const [isStaff, setIsStaff] = useState(false)

  useEffect(() => {
    fetch("/api/user/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.role === "ADMIN" || data.role === "MODERATOR") {
          setIsStaff(true)
        }
      })
      .catch(() => {})
  }, [])

  if (!isStaff) return null

  return (
    <Link href="/staff" className="nav-link flex items-center px-3 py-2 text-sm font-medium">
      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
      Staff
    </Link>
  )
}

const navLinkClass = "nav-link px-3 py-2 text-sm font-medium rounded-md"

export default function Navbar() {
  const { data: session } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="site-nav relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 shrink-0 rounded-sm hover:opacity-90 transition-opacity">
              <span className="text-sm font-bold tracking-wide text-[var(--color-text)] uppercase">
                Community Pledges
              </span>
              <span className="label-badge px-1.5 py-0.5">Beta</span>
            </Link>
            <div className="hidden md:flex items-center gap-1">
              <Link href="/" className={navLinkClass}>
                Home
              </Link>
              <Link href="/servers" className={navLinkClass}>
                Servers
              </Link>
              <Link href="/communities" className={navLinkClass}>
                Communities
              </Link>
              {session && (
                <>
                  <Link href="/dashboard" className={navLinkClass}>
                    Dashboard
                  </Link>
                  <Link href="/tickets" className={navLinkClass}>
                    Tickets
                  </Link>
                  <StaffLink />
                </>
              )}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2">
            {session ? (
              <>
                <Link href="/settings">
                  <div className="flex items-center gap-2 px-2 py-1 rounded-[4px] hover:bg-[var(--color-hover)] transition">
                    {session.user?.image ? (
                      <Image
                        src={session.user.image}
                        alt={session.user?.name || "User"}
                        width={32}
                        height={32}
                        className="rounded-full object-cover border border-[var(--color-border)]"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white bg-[var(--color-primary)]">
                        {session.user?.name?.[0]?.toUpperCase() ||
                          session.user?.email?.[0]?.toUpperCase() ||
                          "U"}
                      </div>
                    )}
                    <span className="text-sm font-medium text-[var(--color-text)] max-w-[140px] truncate">
                      {session.user?.name || session.user?.email}
                    </span>
                  </div>
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="btn-secondary px-4 py-1.5 text-sm"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn-secondary px-4 py-1.5 text-sm">
                  Sign in
                </Link>
                <Link href="/register" className="btn-primary px-4 py-1.5 text-sm">
                  Sign up
                </Link>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-[4px] text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text)] transition"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-[var(--color-border)]">
            <div className="flex flex-col gap-0.5 pt-3">
              <Link href="/" onClick={() => setMobileMenuOpen(false)} className={navLinkClass}>
                Home
              </Link>
              <Link href="/servers" onClick={() => setMobileMenuOpen(false)} className={navLinkClass}>
                Servers
              </Link>
              <Link href="/communities" onClick={() => setMobileMenuOpen(false)} className={navLinkClass}>
                Communities
              </Link>
              {session && (
                <>
                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className={navLinkClass}>
                    Dashboard
                  </Link>
                  <Link href="/tickets" onClick={() => setMobileMenuOpen(false)} className={navLinkClass}>
                    Tickets
                  </Link>
                  <StaffLink />
                  <div className="border-t border-[var(--color-border)] pt-3 mt-2">
                    <Link href="/settings" onClick={() => setMobileMenuOpen(false)}>
                      <div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-[var(--color-hover)]">
                        {session.user?.image ? (
                          <Image
                            src={session.user.image}
                            alt={session.user?.name || "User"}
                            width={40}
                            height={40}
                            className="rounded-full object-cover border border-[var(--color-border)]"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full flex items-center justify-center font-medium text-white bg-[var(--color-primary)]">
                            {session.user?.name?.[0]?.toUpperCase() ||
                              session.user?.email?.[0]?.toUpperCase() ||
                              "U"}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-[var(--color-text)] truncate">
                            {session.user?.name || "User"}
                          </div>
                          <div className="text-xs text-[var(--color-text-secondary)] truncate">
                            {session.user?.email}
                          </div>
                        </div>
                      </div>
                    </Link>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false)
                        signOut({ callbackUrl: "/" })
                      }}
                      className="w-full mt-2 btn-secondary px-4 py-2 text-sm"
                    >
                      Sign out
                    </button>
                  </div>
                </>
              )}
              {!session && (
                <div className="border-t border-[var(--color-border)] pt-3 mt-2 flex flex-col gap-2 px-1">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn-secondary w-full py-2 text-center text-sm"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn-primary w-full py-2 text-center text-sm"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
