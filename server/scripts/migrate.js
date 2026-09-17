import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../src/db.js';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../db/migrations');
try {
  await pool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
  await pool.query('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())');
  for (const file of fs.readdirSync(dir).sort()) {
    const prior = await pool.query('SELECT 1 FROM schema_migrations WHERE name=$1', [file]);
    if (prior.rows[0]) continue;
    await pool.query(fs.readFileSync(path.join(dir, file), 'utf8'));
    await pool.query('INSERT INTO schema_migrations(name) VALUES($1)', [file]);
    console.log(`Applied ${file}`);
  }
} finally { await pool.end(); }
