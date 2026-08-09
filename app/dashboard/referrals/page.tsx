import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Copy, Share2, Users, Gift } from 'lucide-react'

export default async function ReferralsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/api/auth/signin')

  let userCode = await prisma.referralCode.findUnique({
    where: { userId: session.user.id }
  })

  // If user signed up before referrals existed, generate one now
  if (!userCode) {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    userCode = await prisma.referralCode.create({
      data: {
        userId: session.user.id,
        code
      }
    })
  }

  const referrals = await prisma.referral.findMany({
    where: { referrerId: session.user.id },
    include: { referred: { select: { name: true } } }
  })

  const pending = referrals.filter(r => r.status === 'PENDING').length
  const completed = referrals.filter(r => r.status === 'COMPLETED').length

  const referralLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/?ref=${userCode.code}`

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-extrabold mb-2">Invite Friends</h1>
              <p className="text-muted-foreground text-sm">
                Share TOVEDROP with your friends. When they take their first ride, they get 2 Drops and you get 3 Drops!
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Your Referral Link</p>
              <div className="flex gap-2">
                <div className="flex-1 bg-surface-card border border-border rounded-lg px-3 py-2 text-sm font-medium flex items-center overflow-x-auto whitespace-nowrap">
                  {referralLink}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Share this link or tell them to use your code: <strong className="text-foreground">{userCode.code}</strong>
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                <Users className="w-5 h-5 text-secondary mb-3" />
                <p className="text-2xl font-bold">{pending}</p>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Pending Signups</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                <Gift className="w-5 h-5 text-purple-brand mb-3" />
                <p className="text-2xl font-bold">{completed}</p>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Successful Invites</p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold mb-4">Recent Referrals</h3>
              {referrals.length === 0 ? (
                <p className="text-sm text-muted-foreground">You haven't referred anyone yet.</p>
              ) : (
                <div className="space-y-3">
                  {referrals.slice(0, 5).map(r => (
                    <div key={r.id} className="flex justify-between items-center text-sm border-b border-border pb-2 last:border-0 last:pb-0">
                      <span className="font-medium">{r.referred.name || 'Unknown User'}</span>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-md ${
                        r.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500' : 'bg-orange-brand/10 text-orange-brand'
                      }`}>
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
