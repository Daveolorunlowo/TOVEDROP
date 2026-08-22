import prisma from '@/lib/prisma'
import { ProfileTabClient } from '@/components/driver/ProfileTabClient'

export async function ProfileTab({ 
  driverId,
  user
}: { 
  driverId: string
  user: any
}) {
  const driverProfile = await prisma.driverProfile.findUnique({
    where: { id: driverId },
  })

  if (!driverProfile) return null

  return (
    <ProfileTabClient driverProfile={driverProfile} user={user} />
  )
}
