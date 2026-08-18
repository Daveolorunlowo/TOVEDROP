"use client"
import Link from 'next/link'
import { Globe, Mail, ExternalLink, Link2 } from 'lucide-react'
import { useBookRideNavigation } from '@/hooks/useBookRideNavigation'
import { useSession } from 'next-auth/react'

const platformLinks = [
  { href: '/dashboard', label: 'Book a Ride', isBookRide: true },
  { href: '/apply', label: 'Become a Driver' },
  { href: '/dashboard', label: 'My Trips' },
  { href: '/driver', label: 'Driver Portal' },
]

const companyLinks = [
  { href: '/about', label: 'About Us' },
  { href: '/safety', label: 'Safety' },
  { href: '/contact', label: 'Contact' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Service' },
]

const socials = [
  { Icon: Globe, href: '#', label: 'Website' },
  { Icon: Mail, href: '#', label: 'Email' },
  { Icon: Link2, href: '#', label: 'Link' },
  { Icon: ExternalLink, href: '#', label: 'External' },
]

export function Footer() {
  const handleBookRideClick = useBookRideNavigation()
  const { status } = useSession()

  // Hide footer globally for authenticated users
  if (status === 'authenticated') {
    return null
  }

  return (
    <footer className="bg-[#060611] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-12">
          {/* Col 1 — Brand */}
          <div className="flex flex-col gap-4">
            <Link
              href="/"
              className="text-2xl font-extrabold tracking-tight"
              style={{ letterSpacing: '-0.02em' }}
            >
              <span className="text-white">TOVE</span>
              <span className="text-orange-brand">DROP</span>
            </Link>
            <p className="text-sm text-white/50 leading-relaxed max-w-[13rem]">
              University-first ride connections. Safe, pre-scheduled, student-vetted.
            </p>
            <div className="flex items-center gap-3 mt-1">
              {socials.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:border-orange-brand/60 transition-colors"
                >
                  <Icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Col 2 — Platform */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-5">Platform</h3>
            <ul className="flex flex-col gap-3">
              {platformLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} onClick={link.isBookRide ? handleBookRideClick : undefined} className="text-sm text-white/60 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Company */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-5">Company</h3>
            <ul className="flex flex-col gap-3">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-white/60 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4 — Newsletter */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-5">Stay Updated</h3>
            <p className="text-sm text-white/50 mb-4 leading-relaxed">
              Get campus ride tips and platform news.
            </p>
            <form className="flex flex-col gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="your@university.edu"
                className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-orange-brand/60 transition-colors"
              />
              <button
                type="submit"
                className="w-full px-4 py-2.5 rounded-lg text-white text-sm font-semibold transition-all hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, var(--orange-brand), var(--orange-brand))' }}
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-orange-brand/15 text-center">
          <p className="text-xs text-white/30">
            &copy; {new Date().getFullYear()} TOVEDROP. All rights reserved. Built for campus communities.
          </p>
        </div>
      </div>
    </footer>
  )
}
