import { pool } from './src/db.js';
import jwt from 'jsonwebtoken';
import { config } from './src/config.js';

const base = 'http://localhost:4000/api';

async function runTests() {
  const pfx = Date.now();
  const rOwner = await pool.query(`INSERT INTO users(name,email,address,password_hash,role) VALUES($1,$2,$3,$4,'STORE_OWNER') RETURNING id`, ['Owner Sort Test 1234', `owner${pfx}@m.com`, 'Ad', 'h']);
  const ownerId = rOwner.rows[0].id;
  const ownerToken = jwt.sign({ id: ownerId, role: 'STORE_OWNER' }, process.env.JWT_SECRET || config.jwtSecret || 'secret', { expiresIn: '1h' });

  const storeRes = await pool.query(`INSERT INTO stores(name,email,address,owner_id) VALUES($1,$2,$3,$4) RETURNING id`, ['Sort Store', `s${pfx}@m.com`, 'A', ownerId]);
  const sId = storeRes.rows[0].id;
  
  // Insert two users and ratings
  const u1 = await pool.query(`INSERT INTO users(name,email,address,password_hash,role) VALUES($1,$2,$3,$4,'USER') RETURNING id`, ['User AAAAA 1234567890', `ua${pfx}@m.com`, 'A', 'h']);
  const u2 = await pool.query(`INSERT INTO users(name,email,address,password_hash,role) VALUES($1,$2,$3,$4,'USER') RETURNING id`, ['User ZZZZZ 1234567890', `uz${pfx}@m.com`, 'Z', 'h']);
  
  await pool.query(`INSERT INTO ratings(user_id,store_id,score) VALUES($1,$2,$3)`, [u1.rows[0].id, sId, 1]);
  await pool.query(`INSERT INTO ratings(user_id,store_id,score) VALUES($1,$2,$3)`, [u2.rows[0].id, sId, 5]);

  // Test name sorting
  let r = await fetch(base + '/owner/dashboard?sort=name&order=asc', { headers: { 'Authorization': 'Bearer ' + ownerToken } });
  let data = await r.json();
  if (data.ratings[0].name.includes('AAAAA') && data.ratings[1].name.includes('ZZZZZ')) console.log('✅ Sort Name ASC');
  else { console.error('❌ Sort Name ASC failed', data.ratings); process.exitCode=1; }

  r = await fetch(base + '/owner/dashboard?sort=name&order=desc', { headers: { 'Authorization': 'Bearer ' + ownerToken } });
  data = await r.json();
  if (data.ratings[0].name.includes('ZZZZZ') && data.ratings[1].name.includes('AAAAA')) console.log('✅ Sort Name DESC');
  else { console.error('❌ Sort Name DESC failed', data.ratings); process.exitCode=1; }

  // Test rating sorting
  r = await fetch(base + '/owner/dashboard?sort=score&order=asc', { headers: { 'Authorization': 'Bearer ' + ownerToken } });
  data = await r.json();
  if (data.ratings[0].score === 1 && data.ratings[1].score === 5) console.log('✅ Sort Score ASC');
  else { console.error('❌ Sort Score ASC failed', data.ratings); process.exitCode=1; }

  r = await fetch(base + '/owner/dashboard?sort=score&order=desc', { headers: { 'Authorization': 'Bearer ' + ownerToken } });
  data = await r.json();
  if (data.ratings[0].score === 5 && data.ratings[1].score === 1) console.log('✅ Sort Score DESC');
  else { console.error('❌ Sort Score DESC failed', data.ratings); process.exitCode=1; }

  await pool.end();
}
runTests();
