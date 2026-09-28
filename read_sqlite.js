const Database = require('better-sqlite3');
const db = new Database('dev.db', { readonly: true });

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
console.log("Tables found:", tables.map(t => t.name).join(', '));

for (const t of tables) {
  const rowCount = db.prepare(`SELECT count(*) as count FROM "${t.name}"`).get();
  console.log(`\nTable ${t.name} (${rowCount.count} rows):`);
  if (rowCount.count > 0) {
    const columns = db.prepare(`PRAGMA table_info("${t.name}")`).all();
    console.log(columns.map(c => `${c.name} (${c.type})`).join(', '));
  }
}
