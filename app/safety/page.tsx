import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { CheckCircle2, ShieldAlert, Star, MessageSquare, AlertTriangle, Smartphone, UserCheck, Search, Shield, Ear, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Safety | TOVEDROP',
  description: 'Your safety is our first Drop. Every driver is verified. Every ride is tracked.',
}

export default function SafetyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-bg-deep">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-6 sm:px-10 lg:px-16">
          
          {/* Section 1: Hero */}
          <section className="py-16 text-center border-b border-white/10">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-6" style={{ letterSpacing: '-0.025em' }}>
              Your safety is our <span className="text-orange-brand">first Drop.</span>
            </h1>
            <p className="text-lg text-white/60 leading-relaxed max-w-2xl mx-auto">
              Every driver is verified. Every ride is tracked. Every report is taken seriously.
            </p>
          </section>

          {/* Section 2: How We Vet Drivers */}
          <section className="py-20 border-b border-white/10">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Every driver goes through us</h2>
            <p className="text-white/60 text-center max-w-xl mx-auto mb-12">
              Before a driver picks up their first student, they go through a multi-step verification process:
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative">
              <div className="bg-surface-card border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-full bg-orange-brand/10 flex items-center justify-center text-orange-brand font-bold">1</div>
                  <h3 className="text-white font-bold">Identity Check</h3>
                </div>
                <p className="text-sm text-white/60">
                  Valid driver's license, national ID, and university enrollment verification. We confirm who you are.
                </p>
              </div>

              <div className="bg-surface-card border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-full bg-orange-brand/10 flex items-center justify-center text-orange-brand font-bold">2</div>
                  <h3 className="text-white font-bold">Background Screening</h3>
                </div>
                <p className="text-sm text-white/60">
                  Third-party criminal background check covering the past 5 years. We're thorough. No shortcuts.
                </p>
              </div>

              <div className="bg-surface-card border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-full bg-orange-brand/10 flex items-center justify-center text-orange-brand font-bold">3</div>
                  <h3 className="text-white font-bold">Vehicle Inspection</h3>
                </div>
                <p className="text-sm text-white/60">
                  Photos of the car interior/exterior, vehicle registration, proof of insurance. We see what you're driving.
                </p>
              </div>

              <div className="bg-surface-card border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-full bg-orange-brand/10 flex items-center justify-center text-orange-brand font-bold">4</div>
                  <h3 className="text-white font-bold">Student Vetting</h3>
                </div>
                <p className="text-sm text-white/60">
                  Your first 5 rides are rated by students before you hit "trusted" status. The community vouches for you.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Continuous Safety */}
          <section className="py-20 border-b border-white/10">
            <h2 className="text-2xl font-bold text-white mb-10 text-center">Every ride is monitored</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <Search className="w-6 h-6 text-purple-brand shrink-0 mt-1" />
                  <div>
                    <h4 className="text-white font-bold mb-1">Real-time tracking</h4>
                    <p className="text-sm text-white/60">Your ride is visible to you and our safety team from pickup to dropoff. No blind spots.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Star className="w-6 h-6 text-purple-brand shrink-0 mt-1" />
                  <div>
                    <h4 className="text-white font-bold mb-1">Driver rating system</h4>
                    <p className="text-sm text-white/60">After every ride, you rate your driver. Drivers who drop below 4.5★ lose ride access.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <MessageSquare className="w-6 h-6 text-purple-brand shrink-0 mt-1" />
                  <div>
                    <h4 className="text-white font-bold mb-1">In-app messaging only</h4>
                    <p className="text-sm text-white/60">Chat happens only through TOVEDROP, never on personal numbers. We can see conversations if needed.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <ShieldAlert className="w-6 h-6 text-purple-brand shrink-0 mt-1" />
                  <div>
                    <h4 className="text-white font-bold mb-1">Emergency button</h4>
                    <p className="text-sm text-white/60">Tap once to alert campus security and a trusted contact. Drivers know about it. It's taken seriously.</p>
                  </div>
                </div>
              </div>

              {/* Minimal Mockup */}
              <div className="bg-[#12121A] rounded-[2rem] border border-white/10 p-6 flex flex-col items-center mx-auto w-full max-w-sm h-[400px] shadow-2xl relative overflow-hidden">
                <div className="w-32 h-6 bg-black rounded-b-xl absolute top-0 flex items-center justify-center">
                  <div className="w-16 h-4 bg-white/10 rounded-full" />
                </div>
                
                <div className="mt-12 w-full space-y-4">
                  <div className="bg-surface-card p-4 rounded-xl border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-brand rounded-full flex items-center justify-center text-white font-bold">AO</div>
                      <div>
                        <p className="text-white text-sm font-bold">Ade Okafor</p>
                        <p className="text-white/50 text-xs">Toyota Corolla</p>
                      </div>
                    </div>
                    <div className="bg-purple-brand/20 text-purple-brand text-xs font-bold px-2 py-1 rounded">4.8 ★</div>
                  </div>

                  <div className="bg-surface-card p-4 rounded-xl border border-white/5 space-y-2">
                    <p className="text-xs text-white/40 uppercase font-bold tracking-wider">Live Tracking</p>
                    <div className="h-24 bg-[#0A0A10] rounded-lg border border-white/10 relative overflow-hidden flex items-center justify-center">
                       <p className="text-xs text-white/30">Map Interface</p>
                    </div>
                  </div>

                  <div className="bg-red-500/10 text-red-500 font-bold p-4 rounded-xl border border-red-500/20 flex items-center justify-center gap-2 cursor-pointer hover:bg-red-500/20 transition-colors">
                    <ShieldAlert className="w-5 h-5" />
                    Emergency Assistance
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: What to Do If Something Feels Wrong */}
          <section className="py-20 border-b border-white/10">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-white mb-4 text-center">We listen. We act.</h2>
              <p className="text-white/60 text-center mb-10">
                You don't need to be 100% sure. You only need to feel something is off.
              </p>

              <div className="space-y-8">
                <div>
                  <h3 className="text-orange-brand font-bold mb-3 flex items-center gap-2"><Ear className="w-5 h-5" /> Report immediately:</h3>
                  <ul className="space-y-2 text-sm text-white/70">
                    <li>• Use the in-app "Report" button — reaches our safety team in under 5 minutes</li>
                    <li>• Call our emergency line: <strong>+233 55 123 4567</strong></li>
                    <li>• Email our safety team: <strong>safety@tovedrop.app</strong></li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-purple-brand font-bold mb-3 flex items-center gap-2"><ArrowRight className="w-5 h-5" /> What happens next:</h3>
                  <ol className="space-y-2 text-sm text-white/70 list-decimal list-inside">
                    <li>Your report is reviewed within 24 hours</li>
                    <li>Driver is suspended immediately if the report suggests safety concern</li>
                    <li>You get a full refund + support from our team</li>
                    <li>We follow up within 48 hours, always</li>
                  </ol>
                </div>

                <div className="bg-white/5 p-6 rounded-xl">
                  <h3 className="text-white font-bold mb-3">Real case examples:</h3>
                  <ul className="space-y-3 text-sm text-white/70">
                    <li><strong className="text-white">Student reported driver taking unplanned route</strong> → Driver account suspended, student refunded, campus security notified.</li>
                    <li><strong className="text-white">Driver reported reckless student behavior</strong> → Student banned, driver offered psychology support.</li>
                    <li><strong className="text-white">Student felt unsafe mid-ride</strong> → Sent backup driver, completed trip free, incident logged.</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5: Student Rights */}
          <section className="py-20 border-b border-white/10">
            <h2 className="text-2xl font-bold text-white mb-10 text-center">What you're guaranteed</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              <div className="bg-surface-card border border-white/10 rounded-xl p-6">
                <h3 className="text-white font-bold mb-2">Right to Cancel</h3>
                <p className="text-sm text-white/60">Change your mind before pickup? Cancel free. Within 60 seconds of pickup? Free ride.</p>
              </div>

              <div className="bg-surface-card border border-white/10 rounded-xl p-6">
                <h3 className="text-white font-bold mb-2">Right to Report</h3>
                <p className="text-sm text-white/60">Uncomfortable with your driver? Report in-app, no questions asked. Full refund guaranteed.</p>
              </div>

              <div className="bg-surface-card border border-white/10 rounded-xl p-6">
                <h3 className="text-white font-bold mb-2">Right to Privacy</h3>
                <p className="text-sm text-white/60">Your ride data is yours. We don't sell it. Your phone number isn't shared with drivers.</p>
              </div>

              <div className="bg-surface-card border border-white/10 rounded-xl p-6">
                <h3 className="text-white font-bold mb-2">Right to Support</h3>
                <p className="text-sm text-white/60">Our safety team is real humans, not chatbots. Email, call, or chat — we respond.</p>
              </div>

            </div>
          </section>

          {/* Section 6: Driver Safety Too */}
          <section className="py-20 border-b border-white/10">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-white mb-4">We protect drivers too</h2>
              <p className="text-white/60 mb-6">
                Safety goes both ways. Our drivers are also students. They also deserve protection.
              </p>
              <ul className="space-y-4 text-sm text-white/70">
                <li><strong className="text-white">Rider ratings</strong> — Students are rated too. Drivers can report unsafe behavior.</li>
                <li><strong className="text-white">Driver support</strong> — We provide self-defense workshops for drivers (free, optional).</li>
                <li><strong className="text-white">Incident support</strong> — If a driver reports a safety concern, we follow up immediately.</li>
                <li><strong className="text-white">Legal backing</strong> — We stand behind our drivers. If a false report is made, we support them.</li>
              </ul>
            </div>
          </section>

          {/* Section 7: Our Safety Commitment */}
          <section className="py-20 text-center">
            <div className="max-w-2xl mx-auto mb-10">
              <h2 className="text-2xl font-bold text-white mb-4">We're never done</h2>
              <p className="text-white/70">
                Technology alone doesn't make rides safe. Trust does. Every quarter, we audit our safety processes. Every month, we review reported incidents. Every week, we train our team.
              </p>
              <p className="text-white/70 mt-4">
                If you have suggestions on how we can be safer, email us. We listen to every message.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 font-bold text-[15px] text-white px-8 py-4 rounded-full transition-all duration-200 hover:scale-[1.03]"
                style={{
                  background: 'linear-gradient(135deg, var(--red-600), #dc2626)',
                  boxShadow: '0 4px 24px rgba(220,38,38,0.3)',
                }}
              >
                <ShieldAlert className="w-5 h-5" /> Report a safety concern
              </Link>
              <Link
                href="/privacy"
                className="inline-flex items-center gap-2 font-semibold text-[15px] text-white/85 hover:text-white px-8 py-4 rounded-full border transition-all duration-200 hover:border-white/45"
                style={{ borderColor: 'rgba(255,255,255,0.28)', background: 'rgba(255,255,255,0.04)' }}
              >
                Read full Safety Policy
              </Link>
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  )
}
