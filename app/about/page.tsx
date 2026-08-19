import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { MapPin, ShieldCheck, Banknote, Users, Sparkles, Smartphone } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'About Us | TOVEDROP',
  description: 'What TOVEDROP is, how it operates, and why it benefits the campus community.',
}

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-bg-deep">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-6 sm:px-10 lg:px-16">
          
          {/* Section 1: What TOVEDROP is */}
          <section className="py-16 text-center border-b border-white/10">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground mb-6" style={{ letterSpacing: '-0.025em' }}>
              Built for <span className="text-orange-brand">Campus.</span>
            </h1>
            <p className="text-lg text-foreground/60 leading-relaxed max-w-2xl mx-auto">
              TOVEDROP is an exclusive, student-only ride network designed to solve the unique transportation challenges of campus life. We connect students with pre-vetted campus drivers for safe, cashless, and reliable rides.
            </p>
          </section>

          {/* Section 2: How It Operates */}
          <section className="py-20 border-b border-white/10">
            <h2 className="text-2xl font-bold text-foreground mb-10 text-center">How It Operates</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
              {/* Connecting line for desktop */}
              <div className="hidden md:block absolute top-1/2 left-[15%] right-[15%] h-px bg-white/10 -translate-y-1/2" />
              
              <div className="bg-surface-card border border-white/10 rounded-2xl p-6 flex flex-col items-center text-center relative z-10">
                <div className="w-12 h-12 bg-orange-brand/10 rounded-full flex items-center justify-center mb-4 text-orange-brand font-bold text-lg">
                  1
                </div>
                <h3 className="text-foreground font-bold mb-2">Book with Drops</h3>
                <p className="text-sm text-foreground/60">
                  Load your account with "Drops" (our in-app currency). No need to carry cash or negotiate fares. 1 Drop = 1 standard campus ride.
                </p>
              </div>

              <div className="bg-surface-card border border-white/10 rounded-2xl p-6 flex flex-col items-center text-center relative z-10">
                <div className="w-12 h-12 bg-purple-brand/10 rounded-full flex items-center justify-center mb-4 text-purple-brand font-bold text-lg">
                  2
                </div>
                <h3 className="text-foreground font-bold mb-2">Get Matched</h3>
                <p className="text-sm text-foreground/60">
                  Request a ride from anywhere on campus. You are instantly matched with a pre-vetted, trusted driver who knows the campus layout.
                </p>
              </div>

              <div className="bg-surface-card border border-white/10 rounded-2xl p-6 flex flex-col items-center text-center relative z-10">
                <div className="w-12 h-12 bg-orange-brand/10 rounded-full flex items-center justify-center mb-4 text-orange-brand font-bold text-lg">
                  3
                </div>
                <h3 className="text-foreground font-bold mb-2">Ride Securely</h3>
                <p className="text-sm text-foreground/60">
                  Track your ride in real-time. Every trip is monitored by our system to ensure you get to your lecture hall or dorm safely.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: The Benefits */}
          <section className="py-20 border-b border-white/10">
            <h2 className="text-2xl font-bold text-foreground mb-10 text-center">The Benefits</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              <div className="bg-white/5 rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-colors">
                <ShieldCheck className="w-8 h-8 text-orange-brand mb-4" />
                <h3 className="text-foreground font-bold mb-2">Unmatched Safety</h3>
                <p className="text-sm text-foreground/60">
                  Our drivers go through rigorous background checks, vehicle inspections, and community vetting. You always know exactly who is picking you up.
                </p>
              </div>

              <div className="bg-white/5 rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-colors">
                <Banknote className="w-8 h-8 text-orange-brand mb-4" />
                <h3 className="text-foreground font-bold mb-2">100% Cashless</h3>
                <p className="text-sm text-foreground/60">
                  Say goodbye to scrambling for change. The Drop system makes payments completely seamless and transparent without hidden surge pricing.
                </p>
              </div>

              <div className="bg-white/5 rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-colors">
                <MapPin className="w-8 h-8 text-orange-brand mb-4" />
                <h3 className="text-foreground font-bold mb-2">Campus-Specific Routes</h3>
                <p className="text-sm text-foreground/60">
                  Unlike generic rideshare apps, TOVEDROP understands campus geography. Drivers know where the lecture halls, specific dorm gates, and study centers are.
                </p>
              </div>

              <div className="bg-white/5 rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-colors">
                <Users className="w-8 h-8 text-orange-brand mb-4" />
                <h3 className="text-foreground font-bold mb-2">Built for the Community</h3>
                <p className="text-sm text-foreground/60">
                  By using TOVEDROP, you are supporting fellow student drivers. It's a closed, trusted ecosystem that keeps resources within the campus community.
                </p>
              </div>

            </div>
          </section>

          {/* Section 4: CTA */}
          <section className="py-20 text-center">
            <h2 className="text-3xl font-extrabold text-foreground mb-6">Experience the campus network</h2>
            <Link
              href="/auth?tab=signup"
              className="inline-flex items-center justify-center gap-2 font-bold text-[15px] text-foreground px-8 py-4 rounded-full transition-all duration-200 hover:scale-[1.03]"
              style={{
                background: 'linear-gradient(135deg, var(--orange-brand), var(--orange-brand))',
                boxShadow: '0 4px 24px rgba(217,119,6,0.4)',
              }}
            >
              Download TOVEDROP free
            </Link>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  )
}
