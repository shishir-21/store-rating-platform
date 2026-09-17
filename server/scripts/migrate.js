import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../src/db.js';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../db/migrations');
try {
  await pool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
  for (const file of fs.readdirSync(dir).sort()) {
    await pool.query(fs.readFileSync(path.join(dir, file), 'utf8'));
    console.log(`Applied ${file}`);
  }
} finally { await pool.end(); }

