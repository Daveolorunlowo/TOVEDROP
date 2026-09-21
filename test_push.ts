import 'dotenv/config';
import { sendPushNotification } from './lib/push';
import prisma from './lib/prisma';

async function main() {
  const subs = await prisma.pushSubscription.findMany();
  if (subs.length === 0) {
    console.log('No push subscriptions found in DB.');
    return;
  }
  
  const uniqueUserIds = [...new Set(subs.map(s => s.userId))];
  console.log(`Sending test push to ${uniqueUserIds.length} users...`);
  
  for (const userId of uniqueUserIds) {
    await sendPushNotification(userId, {
      title: 'Test Notification',
      message: 'This is a test to verify Web Push is working!',
    });
    console.log(`Sent to ${userId}`);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
