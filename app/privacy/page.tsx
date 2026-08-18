import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { ShieldCheck, EyeOff, Lock, DownloadCloud, FileText } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy | TOVEDROP',
  description: 'Your data is yours. We collect only what\'s necessary. We don\'t sell it.',
}

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-bg-deep">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-6 sm:px-10 lg:px-16">
          
          {/* Section 1: Hero */}
          <section className="py-16 border-b border-white/10">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-6" style={{ letterSpacing: '-0.025em' }}>
              Your data is <span className="text-orange-brand">yours.</span>
            </h1>
            <p className="text-lg text-white/60 leading-relaxed max-w-2xl">
              We collect only what's necessary. We don't sell it. We protect it like it's our own.
            </p>
          </section>

          {/* Section 2: Quick Summary */}
          <section className="py-20 border-b border-white/10">
            <h2 className="text-2xl font-bold text-white mb-10">Privacy in plain English</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex gap-4">
                <ShieldCheck className="w-6 h-6 text-orange-brand shrink-0" />
                <div>
                  <h3 className="text-white font-bold mb-1">What we collect</h3>
                  <p className="text-sm text-white/60">Name, email, phone, location during rides, and payment info.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <EyeOff className="w-6 h-6 text-orange-brand shrink-0" />
                <div>
                  <h3 className="text-white font-bold mb-1">What we don't do</h3>
                  <p className="text-sm text-white/60">We don't sell your data, share with marketers, or track you after rides end.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <Lock className="w-6 h-6 text-orange-brand shrink-0" />
                <div>
                  <h3 className="text-white font-bold mb-1">Who has access</h3>
                  <p className="text-sm text-white/60">Your driver (during the ride), TOVEDROP support, and our payment processor only.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <DownloadCloud className="w-6 h-6 text-orange-brand shrink-0" />
                <div>
                  <h3 className="text-white font-bold mb-1">How you control it</h3>
                  <p className="text-sm text-white/60">Download your data or delete your account anytime. Opt out of optional features.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Full Privacy Policy */}
          <section className="py-20">
            <h2 className="text-2xl font-bold text-white mb-10">Full Privacy Policy</h2>
            
            <div className="space-y-12 text-white/70 text-[15px] leading-relaxed">
              
              <div>
                <h3 className="text-xl font-bold text-white mb-4">1. Data We Collect</h3>
                <ul className="list-disc list-outside ml-5 space-y-2">
                  <li><strong>Account information:</strong> name, email, phone, student ID, university</li>
                  <li><strong>Location data:</strong> pickup/dropoff coordinates during rides only</li>
                  <li><strong>Ride history:</strong> dates, times, routes, cost</li>
                  <li><strong>Payment information:</strong> processed by our payment provider, we don't store card details</li>
                  <li><strong>Communications:</strong> in-app chat, support emails</li>
                  <li><strong>Device info:</strong> phone model, OS, app version for troubleshooting</li>
                  <li><strong>Optional data:</strong> emergency contacts, photo for ID verification</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-4">2. How We Use Your Data</h3>
                <ul className="list-disc list-outside ml-5 space-y-2">
                  <li><strong>To provide the service:</strong> match you with drivers, process payments</li>
                  <li><strong>Safety and security:</strong> verify drivers, prevent fraud, respond to reports</li>
                  <li><strong>Improve the app:</strong> understand usage patterns, fix bugs</li>
                  <li><strong>Legal compliance:</strong> tax records, fraud prevention</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-4">3. Who We Share Data With</h3>
                <ul className="list-disc list-outside ml-5 space-y-2">
                  <li><strong>Your driver:</strong> name, phone, location — only during the ride</li>
                  <li><strong>Campus security:</strong> only if you report a safety concern</li>
                  <li><strong>Payment processor:</strong> for payment processing</li>
                  <li><strong>Legal authorities:</strong> only if required by law</li>
                </ul>
                <p className="mt-4 text-orange-brand font-semibold">We do NOT share with: marketers, advertisers, or third parties for profit.</p>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-4">4. How Long We Keep Your Data</h3>
                <ul className="list-disc list-outside ml-5 space-y-2">
                  <li><strong>Account data:</strong> kept as long as your account is active</li>
                  <li><strong>Ride history:</strong> kept for 2 years (for support/disputes)</li>
                  <li><strong>Payment records:</strong> kept for 7 years (tax/legal requirement)</li>
                  <li>You can request deletion anytime</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-4">5. Your Rights</h3>
                <ul className="list-disc list-outside ml-5 space-y-2">
                  <li><strong>Right to access:</strong> download your data anytime</li>
                  <li><strong>Right to correct:</strong> update your information</li>
                  <li><strong>Right to delete:</strong> request account deletion</li>
                  <li><strong>Right to export:</strong> get your data in a portable format</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-4">6. Security</h3>
                <ul className="list-disc list-outside ml-5 space-y-2">
                  <li>All data transmitted over encrypted connection (SSL/TLS)</li>
                  <li>Payment data never stored on our servers</li>
                  <li>Access to data restricted to authorized staff</li>
                  <li>Regular security audits and penetration testing</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-4">7. Changes to This Policy</h3>
                <p>We may update this policy. You'll be notified via email if changes affect your privacy rights.</p>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-4">8. Contact Us</h3>
                <p>Questions about privacy? Email: <a href="mailto:privacy@tovedrop.app" className="text-orange-brand font-semibold hover:underline">privacy@tovedrop.app</a></p>
              </div>

            </div>
          </section>

          {/* Section 4: CTA */}
          <section className="py-12 border-t border-white/10 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <button
              className="inline-flex items-center gap-2 font-bold text-[14px] text-white px-6 py-3 rounded-full border transition-all duration-200 hover:bg-white/5"
              style={{ borderColor: 'rgba(255,255,255,0.2)' }}
            >
              <FileText className="w-4 h-4" /> Download privacy policy as PDF
            </button>
            <Link
              href="/privacy-request"
              className="text-sm font-semibold text-purple-brand hover:text-purple-brand/80 transition-colors"
            >
              Data subject request form →
            </Link>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  )
}
