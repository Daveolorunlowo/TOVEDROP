import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Scale, Users, Shield, FileText } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service | TOVEDROP',
  description: 'Here\'s how TOVEDROP works. Everyone plays by the same rules. We do too.',
}

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-bg-deep">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-6 sm:px-10 lg:px-16">
          
          {/* Section 1: Hero */}
          <section className="py-16 border-b border-white/10">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground mb-6" style={{ letterSpacing: '-0.025em' }}>
              Here's how TOVEDROP <span className="text-orange-brand">works.</span>
            </h1>
            <p className="text-lg text-foreground/60 leading-relaxed max-w-2xl">
              Everyone plays by the same rules. We do too.
            </p>
          </section>

          {/* Section 2: Quick Summary */}
          <section className="py-20 border-b border-white/10">
            <h2 className="text-2xl font-bold text-foreground mb-10">Terms in a nutshell</h2>
            
            <div className="bg-surface-card border border-white/10 rounded-2xl p-8 space-y-4">
              <ul className="space-y-4 text-sm text-foreground/70">
                <li className="flex items-start gap-3">
                  <Scale className="w-5 h-5 text-orange-brand shrink-0" />
                  <span>You agree to be a responsible user (no false reports, no harassment, follow traffic laws).</span>
                </li>
                <li className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-orange-brand shrink-0" />
                  <span>TOVEDROP isn't liable if you get injured due to your own actions.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-orange-brand shrink-0" />
                  <span>Drivers aren't TOVEDROP employees; they're independent contractors.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 text-orange-brand shrink-0 flex items-center justify-center font-bold">!</span>
                  <span>We can kick people off for breaking the rules.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 text-orange-brand shrink-0 flex items-center justify-center font-bold">✓</span>
                  <span>This agreement is binding (but you can leave anytime).</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Section 3: Full Terms of Service */}
          <section className="py-20">
            <h2 className="text-2xl font-bold text-foreground mb-10">Full Terms of Service</h2>
            
            <div className="space-y-10 text-foreground/70 text-[15px] leading-relaxed">
              
              <div>
                <h3 className="text-xl font-bold text-foreground mb-3">1. Definitions</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>"User"</strong> = student or driver using TOVEDROP</li>
                  <li><strong>"Platform"</strong> = the TOVEDROP app and website</li>
                  <li><strong>"Ride"</strong> = one completed trip from pickup to dropoff</li>
                  <li><strong>"Drops"</strong> = in-app currency used for payment</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold text-foreground mb-3">2. Eligibility</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Must be 18+ years old (or 16+ with parental consent in applicable regions)</li>
                  <li>Must be enrolled as a student at a campus where TOVEDROP operates</li>
                  <li>Must provide accurate information during signup</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold text-foreground mb-3">3. User Responsibilities</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Keep your account password confidential</li>
                  <li>Don't create multiple accounts</li>
                  <li>Don't harass, discriminate, or threaten drivers/other users</li>
                  <li>Don't provide false information during safety reports</li>
                  <li>Obey traffic laws during rides</li>
                  <li>Don't tamper with the app or use it for illegal activity</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold text-foreground mb-3">4. Driver Responsibilities</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Maintain valid driver's license and vehicle insurance</li>
                  <li>Don't accept payment outside the app</li>
                  <li>Maintain professional behavior</li>
                  <li>Report safety concerns immediately</li>
                  <li>Follow traffic laws</li>
                  <li>Don't use the app under the influence</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold text-foreground mb-3">5. Rider Responsibilities</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Provide accurate pickup/dropoff locations</li>
                  <li>Be ready at pickup time (riders waiting 5+ minutes can be charged)</li>
                  <li>Don't damage the vehicle</li>
                  <li>Treat drivers with respect</li>
                  <li>Report safety concerns immediately</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold text-foreground mb-3">6. Drops (In-App Currency)</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Drops are non-refundable once purchased (except within 7 days)</li>
                  <li>Drops don't expire</li>
                  <li>1 Drop = 1 standard campus ride</li>
                  <li>Unused Drops can be transferred to another account with written request</li>
                  <li>If TOVEDROP shuts down, unused Drops are refunded in cash</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold text-foreground mb-3">7. Rides & Cancellations</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Riders can cancel free before driver arrives or within 60 seconds of pickup</li>
                  <li>Drivers can only cancel if they have an emergency (cancellation fee applied)</li>
                  <li>If rider is no-show after 10 minutes, driver is compensated</li>
                  <li>If driver no-shows, rider gets free ride and trip refund</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold text-foreground mb-3">8. Liability & Disclaimer</h3>
                <p className="mb-2"><strong>TOVEDROP is not liable for:</strong></p>
                <ul className="list-disc list-inside space-y-1 mb-4">
                  <li>Injuries from accidents (drivers carry insurance; not TOVEDROP's responsibility)</li>
                  <li>Lost or damaged personal items (check with driver, then TOVEDROP)</li>
                  <li>Driver conduct (drivers are independent contractors, not employees)</li>
                  <li>App downtime or technical issues beyond our control</li>
                </ul>
                <p className="mb-2"><strong>TOVEDROP IS liable for:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Data breaches due to our negligence</li>
                  <li>False charges to your account</li>
                  <li>Discriminatory behavior by staff</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold text-foreground mb-3">9. Independent Contractor Status</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Drivers are not TOVEDROP employees</li>
                  <li>TOVEDROP doesn't control HOW drivers drive, only that they follow traffic laws</li>
                  <li>Drivers are responsible for their own vehicle maintenance, insurance, taxes</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold text-foreground mb-3">10. Dispute Resolution</h3>
                <ul className="list-decimal list-inside space-y-1">
                  <li>First step: contact support@tovedrop.app</li>
                  <li>Second step: mediation (neutral third party)</li>
                  <li>Final step: binding arbitration (not court)</li>
                  <li>Disputes must be filed within 30 days</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold text-foreground mb-3">11. Prohibited Conduct</h3>
                <p className="mb-2">You can't:</p>
                <ul className="list-disc list-inside space-y-1 mb-3">
                  <li>Make false safety reports</li>
                  <li>Harass or discriminate against drivers/users</li>
                  <li>Create accounts using false information</li>
                  <li>Share your account with others</li>
                  <li>Attempt to hack or manipulate the platform</li>
                  <li>Reverse-engineer the app</li>
                  <li>Spam or advertise on the platform</li>
                </ul>
                <p className="text-red-400 font-semibold">Violations result in warnings, account suspension, or permanent ban.</p>
              </div>

              <div>
                <h3 className="text-xl font-bold text-foreground mb-3">12. Termination</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>You can delete your account anytime (no penalty)</li>
                  <li>TOVEDROP can suspend/ban you for violating these terms</li>
                  <li>Upon termination, your unused Drops are refunded</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold text-foreground mb-3">13. Changes to These Terms</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>We may update these terms</li>
                  <li>Continued use of TOVEDROP means you accept updates</li>
                  <li>Major changes will be emailed to you</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold text-foreground mb-3">14. Governing Law</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>These terms are governed by the laws of Nigeria</li>
                  <li>Any disputes are resolved in Lagos jurisdiction</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold text-foreground mb-3">15. Contact</h3>
                <p>Questions about these terms? Email: <a href="mailto:legal@tovedrop.app" className="text-orange-brand font-semibold hover:underline">legal@tovedrop.app</a></p>
              </div>

            </div>
          </section>

          {/* Section 4: CTA */}
          <section className="py-12 border-t border-white/10 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <button
              className="inline-flex items-center gap-2 font-bold text-[14px] text-foreground px-6 py-3 rounded-full border transition-all duration-200 hover:bg-white/5"
              style={{ borderColor: 'rgba(255,255,255,0.2)' }}
            >
              <FileText className="w-4 h-4" /> Download terms as PDF
            </button>
            <Link
              href="/contact"
              className="text-sm font-semibold text-red-400 hover:text-red-300 transition-colors"
            >
              Report a Terms violation →
            </Link>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  )
}
