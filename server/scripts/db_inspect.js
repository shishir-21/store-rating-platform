import { pool } from '../src/db.js';

async function main() {
  try {
    const q1 = await pool.query("SELECT name FROM schema_migrations ORDER BY name");
    console.log("Migrations:", q1.rows.map(r=>r.name));

    const q2 = await pool.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
    console.log("Tables:", q2.rows.map(r=>r.tablename));

    const q3 = await pool.query("SELECT conname FROM pg_constraint WHERE conname = 'users_name_length'");
    console.log("Constraint users_name_length exists:", q3.rows.length > 0);
  } catch(e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
main();
