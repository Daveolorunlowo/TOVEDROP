import { createRequire } from 'module';
const require = createRequire('c:/Users/daveo/OneDrive/Desktop/TOVEDROP/Tovedrop/package.json');
const { Pool } = require('pg');

const rawUrl = "postgresql://neondb_owner:npg_v5LAkEz6rGcM@ep-summer-moon-ay1fb9vh-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require";
const pool = new Pool({ connectionString: rawUrl, ssl: { rejectUnauthorized: false } });

async function main() {
  const res = await pool.query(`
    SELECT s.id, s."userId", s.endpoint, u.name, u.email, u.role 
    FROM "PushSubscription" s 
    LEFT JOIN "User" u ON s."userId" = u.id
    ORDER BY s."createdAt" DESC;
  `);

  console.log('Total Push Subscriptions in DB:', res.rows.length);
  res.rows.forEach((s, idx) => {
    console.log(`[${idx + 1}] User: ${s.name} (${s.email}), Role: ${s.role}, Endpoint: ${s.endpoint.slice(0, 45)}...`);
  });
}

main().catch(console.error).finally(() => pool.end());
