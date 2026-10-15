import { createRequire } from 'module';
const require = createRequire('c:/Users/daveo/OneDrive/Desktop/TOVEDROP/Tovedrop/package.json');
const { Pool } = require('pg');
const webpush = require('web-push');
const fs = require('fs');

const rawUrl = "postgresql://neondb_owner:npg_v5LAkEz6rGcM@ep-summer-moon-ay1fb9vh-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require";
const pool = new Pool({ connectionString: rawUrl, ssl: { rejectUnauthorized: false } });

// Clean key helper
const cleanKey = (key) => (key ? key.trim().replace(/^["']|["']$/g, '').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_') : '');

async function main() {
  const envContent = fs.readFileSync('.env', 'utf8');
  let pub = '', priv = '', subEmail = 'mailto:support@tovedrop.com';
  envContent.split('\n').forEach(line => {
    if (line.startsWith('NEXT_PUBLIC_VAPID_PUBLIC_KEY=')) pub = cleanKey(line.split('=')[1].trim());
    if (line.startsWith('VAPID_PRIVATE_KEY=')) priv = cleanKey(line.split('=')[1].trim());
    if (line.startsWith('VAPID_SUBJECT=')) subEmail = line.split('=')[1].trim();
  });

  console.log('VAPID Subject:', subEmail);
  console.log('Public Key (first 15 chars):', pub.slice(0, 15));
  console.log('Private Key (first 10 chars):', priv.slice(0, 10));

  webpush.setVapidDetails(subEmail, pub, priv);

  const res = await pool.query(`
    SELECT s.id, s."userId", s.endpoint, s.keys, u.name, u.email, u.role 
    FROM "PushSubscription" s 
    LEFT JOIN "User" u ON s."userId" = u.id
    ORDER BY s."createdAt" DESC;
  `);

  for (const s of res.rows) {
    console.log(`\nAttempting push to ${s.name} (${s.email}, Role: ${s.role})...`);
    try {
      const payload = JSON.stringify({
        title: 'TOVEDROP Push Test 🚀',
        message: 'This is a test notification from TOVEDROP to verify your push alerts!',
        body: 'This is a test notification from TOVEDROP to verify your push alerts!',
        icon: '/icon-192x192.png',
        url: '/dashboard'
      });

      const pushRes = await webpush.sendNotification(
        {
          endpoint: s.endpoint,
          keys: JSON.parse(s.keys)
        },
        payload
      );
      console.log(`SUCCESS for ${s.name}! Status code: ${pushRes.statusCode}`);
    } catch (err) {
      console.error(`FAILED for ${s.name}! Status: ${err.statusCode}, Message: ${err.message}`);
      if (err.body) console.error('Response Body:', err.body);
    }
  }
}

main().catch(console.error).finally(() => pool.end());
