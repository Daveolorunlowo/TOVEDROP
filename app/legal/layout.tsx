import Link from 'next/link'

export const metadata = {
  title: 'Legal & Policies - Tovedrop',
  description: 'Legal policies and compliance documents for Tovedrop',
}

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  const links = [
    { name: 'Terms of Service', href: '/legal/terms' },
    { name: 'Privacy Policy', href: '/legal/privacy' },
    { name: 'Driver SLA', href: '/legal/driver-sla' },
    { name: 'Refund Policy', href: '/legal/refunds' },
  ]

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-black text-xl tracking-tighter">
            TOVE<span className="text-[var(--orange-brand)]">DROP</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            {links.map((link) => (
              <Link 
                key={link.href} 
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-12 flex flex-col md:flex-row gap-12">
        <aside className="w-full md:w-64 shrink-0">
          <div className="sticky top-12 flex flex-col gap-2">
            <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground mb-4">Legal Directory</h3>
            {links.map((link) => (
              <Link 
                key={link.href} 
                href={link.href}
                className="text-sm font-medium p-3 rounded-lg hover:bg-card border border-transparent hover:border-border transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </aside>

        <main className="flex-1 bg-card border border-border rounded-3xl p-8 md:p-12 prose prose-sm md:prose-base dark:prose-invert max-w-none">
          {children}
        </main>
      </div>
    </div>
  )
}
