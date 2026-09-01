"use client"

import { useState } from 'react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Mail, Phone, MessageCircle, ShieldAlert, Briefcase, Plus, Minus, ArrowRight, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default function ContactPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  const faqs = [
    {
      q: "How do I get my first 3 free Drops?",
      a: "Sign up, verify your student ID, and they appear in your account instantly."
    },
    {
      q: "Can I refund unused Drops?",
      a: "Drops don't expire and can be used anytime. Refunds available within 7 days of purchase only."
    },
    {
      q: "What if my driver is late?",
      a: "Wait 10 minutes. If still not there, cancel free and get a refund. Your time is worth it."
    },
    {
      q: "Can I request a specific driver?",
      a: "Not yet, but it's coming. For now, drivers are matched by proximity and rating."
    },
    {
      q: "What if I left something in the car?",
      a: "Message your driver through TOVEDROP. If they don't respond, email support with your trip ID and photo of the item."
    },
    {
      q: "How do drivers cash out?",
      a: "Weekly payouts to the bank account they registered with. Drops are converted to cash at the rate shown in their app."
    },
    {
      q: "Is TOVEDROP available off-campus?",
      a: "No. We're campus-only by design. Rides outside campus aren't available (yet)."
    },
    {
      q: "Can I use TOVEDROP without a smartphone?",
      a: "Not yet. You need the app to book. But we're exploring basic phone options."
    },
    {
      q: "What if I have a disability — can I still use TOVEDROP?",
      a: "Yes. Select \"accessibility need\" when booking and drivers will know. We're also working on driver training for better support."
    },
    {
      q: "Who do I contact if my data is breached?",
      a: "We take security seriously. If there's ever a breach, you'll be notified within 24 hours with steps to protect yourself."
    }
  ]

  return (
    <div className="flex flex-col min-h-screen bg-bg-deep">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-6 sm:px-10 lg:px-16">
          
          {/* Section 1: Hero */}
          <section className="py-16 text-center border-b border-white/10">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground mb-6" style={{ letterSpacing: '-0.025em' }}>
              We're here to help.
            </h1>
            <p className="text-lg text-foreground/60 leading-relaxed max-w-2xl mx-auto">
              Questions? Issues? Ideas? We read every message. Most are answered within 2 hours.
            </p>
          </section>

          {/* Section 2: Contact Methods */}
          <section className="py-20 border-b border-white/10">
            <h2 className="text-2xl font-bold text-foreground mb-10 text-center">How to reach us</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              <div className="bg-surface-card border border-white/10 rounded-2xl p-6">
                <Mail className="w-8 h-8 text-orange-brand mb-4" />
                <h3 className="text-foreground font-bold mb-1">Email</h3>
                <p className="text-sm font-semibold text-foreground/90 mb-3">support@tovedrop.app</p>
                <p className="text-xs text-foreground/50 mb-4">General support, account issues, billing</p>
                <div className="text-[11px] uppercase tracking-widest text-foreground/30 font-bold">Response: 2hrs (weekday)</div>
              </div>

              <div className="bg-surface-card border border-white/10 rounded-2xl p-6">
                <Phone className="w-8 h-8 text-orange-brand mb-4" />
                <h3 className="text-foreground font-bold mb-1">Phone / WhatsApp</h3>
                <p className="text-sm font-semibold text-foreground/90 mb-3">+234 80 123 4567</p>
                <p className="text-xs text-foreground/50 mb-4">Quick questions, urgent issues</p>
                <div className="text-[11px] uppercase tracking-widest text-foreground/30 font-bold">Hours: 8am - 9pm</div>
              </div>

              <div className="bg-surface-card border border-white/10 rounded-2xl p-6">
                <MessageCircle className="w-8 h-8 text-orange-brand mb-4" />
                <h3 className="text-foreground font-bold mb-1">In-App Chat</h3>
                <p className="text-sm font-semibold text-foreground/90 mb-3">Settings → Help</p>
                <p className="text-xs text-foreground/50 mb-4">Fastest way to reach us for ride issues</p>
                <div className="text-[11px] uppercase tracking-widest text-foreground/30 font-bold">Response: 30 mins</div>
              </div>

              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 md:col-span-2 lg:col-span-1">
                <ShieldAlert className="w-8 h-8 text-red-500 mb-4" />
                <h3 className="text-foreground font-bold mb-1">Safety Emergency</h3>
                <p className="text-sm font-semibold text-red-400 mb-3">safety@tovedrop.app</p>
                <p className="text-xs text-foreground/60 mb-4">Safety concerns only (rides, drivers, security)</p>
                <div className="text-[11px] uppercase tracking-widest text-red-500/50 font-bold">Response: 5 mins (24/7)</div>
              </div>

              <div className="bg-surface-card border border-white/10 rounded-2xl p-6 md:col-span-1 lg:col-span-2">
                <Briefcase className="w-8 h-8 text-purple-brand mb-4" />
                <h3 className="text-foreground font-bold mb-1">Partnership / Press</h3>
                <p className="text-sm font-semibold text-foreground/90 mb-3">hello@tovedrop.app</p>
                <p className="text-xs text-foreground/50 mb-4">Media inquiries, campus partnerships, sponsorships</p>
                <div className="text-[11px] uppercase tracking-widest text-foreground/30 font-bold">Response: 24 hrs</div>
              </div>

            </div>
          </section>

          {/* Section 3: FAQ */}
          <section className="py-20 border-b border-white/10">
            <h2 className="text-2xl font-bold text-foreground mb-10 text-center">Quick answers</h2>
            
            <div className="max-w-2xl mx-auto space-y-3">
              {faqs.map((faq, index) => (
                <div 
                  key={index} 
                  className="bg-surface-card border border-white/10 rounded-xl overflow-hidden transition-all duration-300"
                >
                  <button 
                    onClick={() => toggleFaq(index)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-white/5 transition-colors"
                  >
                    <span className="font-semibold text-sm text-foreground/90 pr-4">{faq.q}</span>
                    {openFaq === index ? (
                      <Minus className="w-5 h-5 text-orange-brand shrink-0" />
                    ) : (
                      <Plus className="w-5 h-5 text-foreground/40 shrink-0" />
                    )}
                  </button>
                  
                  <div 
                    className={`px-6 text-sm text-foreground/60 overflow-hidden transition-all duration-300 ${openFaq === index ? 'max-h-40 pb-4 opacity-100' : 'max-h-0 opacity-0'}`}
                  >
                    {faq.a}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 4 & 5: Report Issue & Community Feedback */}
          <section className="py-20 border-b border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-3xl mx-auto">
              
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Something not working?</h2>
                <p className="text-sm text-foreground/60 mb-6">
                  Fill out our simple form. Select your issue type, add a description, and we'll follow up within 2 hours.
                </p>
                <Link
                  href="#"
                  className="inline-flex items-center gap-2 text-sm font-bold text-orange-brand hover:text-orange-brand/80 transition-colors"
                >
                  Submit a ticket <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Help us build better</h2>
                <p className="text-sm text-foreground/60 mb-6">
                  Have an idea? Found a bug? Want to see a feature? We read all feature requests to shape our roadmap.
                </p>
                <Link
                  href="#"
                  className="inline-flex items-center gap-2 text-sm font-bold text-purple-brand hover:text-purple-brand/80 transition-colors"
                >
                  Submit a feature request <ExternalLink className="w-4 h-4" />
                </Link>
              </div>

            </div>
          </section>

          {/* Section 6: Hours Table */}
          <section className="py-20 border-b border-white/10">
            <h2 className="text-2xl font-bold text-foreground mb-10 text-center">When to reach us</h2>
            
            <div className="max-w-2xl mx-auto bg-surface-card border border-white/10 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-foreground/70">
                  <thead className="bg-white/5 text-foreground/50 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Channel</th>
                      <th className="px-6 py-4 font-semibold">Hours</th>
                      <th className="px-6 py-4 font-semibold">Response Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-semibold text-foreground">Email</td>
                      <td className="px-6 py-4">24/7</td>
                      <td className="px-6 py-4">2 hours (weekday), 4 hours (weekend)</td>
                    </tr>
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-semibold text-foreground">WhatsApp</td>
                      <td className="px-6 py-4">8am - 9pm</td>
                      <td className="px-6 py-4">15 minutes</td>
                    </tr>
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-semibold text-foreground">In-app chat</td>
                      <td className="px-6 py-4">24/7</td>
                      <td className="px-6 py-4">30 minutes</td>
                    </tr>
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-semibold text-red-400">Safety line</td>
                      <td className="px-6 py-4">24/7</td>
                      <td className="px-6 py-4">5 minutes</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Section 7: CTA */}
          <section className="py-20 text-center">
            <Link
              href="mailto:support@tovedrop.app"
              className="inline-flex items-center justify-center gap-2 font-bold text-[15px] text-foreground px-8 py-4 rounded-full transition-all duration-200 hover:scale-[1.03]"
              style={{
                background: 'linear-gradient(135deg, var(--orange-brand), var(--orange-brand))',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              }}
            >
              Contact us now
            </Link>
            <div className="mt-6">
              <Link
                href="#"
                className="text-sm font-semibold text-foreground/60 hover:text-foreground transition-colors"
              >
                Check support status
              </Link>
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  )
}
