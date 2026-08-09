import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixDrivers() {
  const users = await prisma.user.findMany({
    where: { role: 'DRIVER' },
    include: { driverProfile: true }
  })
  
  for (const user of users) {
    if (!user.driverProfile) {
      console.log(`Fixing user ${user.id} (${user.email}) - creating DriverProfile`)
      await prisma.driverProfile.create({
        data: {
          userId: user.id,
          licenseNumber: 'DEV-TEST-000',
          vehicleType: 'Sedan',
          vehicleMake: 'Test Make',
          vehiclePlate: 'DEV-000',
          vehicleModel: 'Test Vehicle',
          vehicleColor: 'Test Color',
          status: 'APPROVED',
          availability: 'Mon-Sun',
          preferredAreas: 'Main Campus',
        }
      })
    }
  }
  
  console.log("Done fixing drivers")
}

fixDrivers()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
