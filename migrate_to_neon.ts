import dotenv from 'dotenv';
dotenv.config();
// @ts-ignore
import Database from 'better-sqlite3';
import { PrismaClient } from './generated/prisma/client';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

async function main() {
  const sqliteDb = new Database('dev.db', { readonly: true });
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log("Clearing existing blank accounts in Postgres...");
    await prisma.referralCode.deleteMany({});
    await prisma.driverProfile.deleteMany({});
    await prisma.account.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.verificationCode.deleteMany({});
    await prisma.adminLoginLog.deleteMany({});
    await prisma.user.deleteMany({});
    
    const toBool = (val: any) => val === 1 ? true : (val === 0 ? false : val);
    
    // 1. Users
    console.log("Migrating Users...");
    const users = sqliteDb.prepare(`SELECT * FROM User`).all();
    for (const u of users) {
      await prisma.user.upsert({
        where: { id: u.id },
        update: {},
        create: {
          id: u.id,
          name: u.name,
          email: u.email,
          emailVerified: u.emailVerified ? new Date(u.emailVerified) : null,
          image: u.image,
          password: u.password,
          university: u.university,
          role: u.role,
          dropsBalance: u.dropsBalance,
          hasUsedFirstTopupDiscount: toBool(u.hasUsedFirstTopupDiscount)
        }
      });
    }

    // 2. DriverProfiles
    console.log("Migrating DriverProfiles...");
    const driverProfiles = sqliteDb.prepare(`SELECT * FROM DriverProfile`).all();
    for (const dp of driverProfiles) {
      await prisma.driverProfile.upsert({
        where: { id: dp.id },
        update: {},
        create: {
          id: dp.id,
          userId: dp.userId,
          phone: dp.phone,
          area: dp.area,
          bio: dp.bio,
          licenseNumber: dp.licenseNumber,
          vehicleMake: dp.vehicleMake,
          vehicleModel: dp.vehicleModel,
          vehicleColor: dp.vehicleColor,
          vehicleType: dp.vehicleType,
          vehiclePlate: dp.vehiclePlate,
          availability: dp.availability,
          preferredAreas: dp.preferredAreas,
          bankName: dp.bankName,
          accountNumber: dp.accountNumber,
          accountName: dp.accountName,
          status: dp.status,
          totalTrips: dp.totalTrips,
          rating: dp.rating,
          walletBalance: dp.walletBalance
        }
      });
    }

    // 3. Accounts
    console.log("Migrating Accounts...");
    const accounts = sqliteDb.prepare(`SELECT * FROM Account`).all();
    for (const acc of accounts) {
      await prisma.account.upsert({
        where: { id: acc.id },
        update: {},
        create: {
          id: acc.id,
          userId: acc.userId,
          type: acc.type,
          provider: acc.provider,
          providerAccountId: acc.providerAccountId,
          refresh_token: acc.refresh_token,
          access_token: acc.access_token,
          expires_at: acc.expires_at,
          token_type: acc.token_type,
          scope: acc.scope,
          id_token: acc.id_token,
          session_state: acc.session_state
        }
      });
    }

    // 4. VerificationCodes
    console.log("Migrating VerificationCodes...");
    const codes = sqliteDb.prepare(`SELECT * FROM VerificationCode`).all();
    for (const vc of codes) {
      await prisma.verificationCode.upsert({
        where: { id: vc.id },
        update: {},
        create: {
          id: vc.id,
          userId: vc.userId,
          code: vc.code,
          expiresAt: new Date(vc.expiresAt),
          used: toBool(vc.used),
          createdAt: new Date(vc.createdAt)
        }
      });
    }

    // 5. AdminLoginLog
    console.log("Migrating AdminLoginLogs...");
    const logs = sqliteDb.prepare(`SELECT * FROM AdminLoginLog`).all();
    for (const log of logs) {
      await prisma.adminLoginLog.upsert({
        where: { id: log.id },
        update: {},
        create: {
          id: log.id,
          email: log.email,
          success: toBool(log.success),
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          createdAt: new Date(log.createdAt)
        }
      });
    }

    // 6. ReferralCode
    console.log("Migrating ReferralCodes...");
    const refCodes = sqliteDb.prepare(`SELECT * FROM ReferralCode`).all();
    for (const rc of refCodes) {
      try {
        await prisma.referralCode.upsert({
          where: { id: rc.id },
          update: {},
          create: {
            id: rc.id,
            userId: rc.userId,
            code: rc.code
          }
        });
      } catch (e) {
        console.log(`Skipping orphaned ReferralCode ${rc.id}`);
      }
    }

    console.log("Migration complete!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
