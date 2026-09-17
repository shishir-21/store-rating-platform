import bcrypt from 'bcryptjs';
import { pool } from '../src/db.js';

const password = await bcrypt.hash('Welcome!1', 12);
const users = [
  ['Platform System Admin', 'admin@storescore.test', '100 Platform Avenue, Bengaluru', 'ADMIN'],
  ['Ananya Regular Customer', 'user@storescore.test', '42 Customer Road, Mumbai', 'USER'],
  ['Priya Neighbourhood Owner', 'owner@storescore.test', '9 Market Street, Delhi', 'STORE_OWNER']
];
try {
  for (const [name, email, address, role] of users) await pool.query(`INSERT INTO users(name,email,address,password_hash,role) VALUES($1,$2,$3,$4,$5) ON CONFLICT(email) DO NOTHING`, [name,email,address,password,role]);
  const owner = await pool.query(`SELECT id FROM users WHERE email='owner@storescore.test'`);
  await pool.query(`INSERT INTO stores(name,email,address,owner_id) VALUES($1,$2,$3,$4) ON CONFLICT(email) DO NOTHING`, ['Neighbourhood Market', 'hello@neighbourhood.test', '9 Market Street, Delhi', owner.rows[0].id]);
  console.log('Seed complete. Demo password for all users: Welcome!1');
} finally { await pool.end(); }
