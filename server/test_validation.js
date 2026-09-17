import { pool } from './src/db.js';
import jwt from 'jsonwebtoken';
import { config } from './src/config.js';

const base = 'http://localhost:4000/api';

async function test(name, path, method, token, body, expectedStatus) {
  try {
    const r = await fetch(base + path, {
      method,
      headers: { 
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    });
    if (r.status !== expectedStatus) {
      const data = await r.json().catch(()=>({}));
      console.error(`❌ ${name} - Expected status ${expectedStatus}, got ${r.status}`, data);
      process.exitCode = 1;
      return;
    }
    console.log(`✅ ${name}`);
  } catch (e) {
    console.error(`❌ ${name} - Error`, e);
    process.exitCode = 1;
  }
}

async function runTests() {
  const pfx = Date.now();
  const rAdmin = await pool.query(`INSERT INTO users(name,email,address,password_hash,role) VALUES($1,$2,$3,$4,'ADMIN') RETURNING id`, ['Admin Valid Test 123', `adminvalid${pfx}@m.com`, 'Ad', 'h']);
  const adminId = rAdmin.rows[0].id;
  const adminToken = jwt.sign({ id: adminId, role: 'ADMIN', name: 'Admin Valid Test 123' }, process.env.JWT_SECRET || config.jwtSecret || 'secret', { expiresIn: '1h' });

  console.log("Testing Name Validation...");
  // 19 chars -> rejected
  await test('19 chars name', '/admin/users', 'POST', adminToken, { name: '1234567890123456789', email: `test1${pfx}@m.com`, address: 'A', password: 'Password!1' }, 422);
  // 20 chars -> accepted
  await test('20 chars name', '/admin/users', 'POST', adminToken, { name: '12345678901234567890', email: `test2${pfx}@m.com`, address: 'A', password: 'Password!1' }, 201);
  // 60 chars -> accepted
  await test('60 chars name', '/admin/users', 'POST', adminToken, { name: '1'.repeat(60), email: `test3${pfx}@m.com`, address: 'A', password: 'Password!1' }, 201);
  // 61 chars -> rejected
  await test('61 chars name', '/admin/users', 'POST', adminToken, { name: '1'.repeat(61), email: `test4${pfx}@m.com`, address: 'A', password: 'Password!1' }, 422);

  console.log("Testing Address Validation...");
  // 400 chars -> accepted
  await test('400 chars address', '/admin/users', 'POST', adminToken, { name: '12345678901234567890', email: `test5${pfx}@m.com`, address: 'a'.repeat(400), password: 'Password!1' }, 201);
  // 401 chars -> rejected
  await test('401 chars address', '/admin/users', 'POST', adminToken, { name: '12345678901234567890', email: `test6${pfx}@m.com`, address: 'a'.repeat(401), password: 'Password!1' }, 422);

  console.log("Testing Password Validation...");
  await test('Valid password', '/admin/users', 'POST', adminToken, { name: '12345678901234567890', email: `test7${pfx}@m.com`, address: 'A', password: 'Welcome!1' }, 201);
  await test('7 chars password', '/admin/users', 'POST', adminToken, { name: '12345678901234567890', email: `test8${pfx}@m.com`, address: 'A', password: 'Pass!1' }, 422);
  await test('17 chars password', '/admin/users', 'POST', adminToken, { name: '12345678901234567890', email: `test9${pfx}@m.com`, address: 'A', password: 'Password!12345678' }, 422);
  await test('No uppercase', '/admin/users', 'POST', adminToken, { name: '12345678901234567890', email: `test10${pfx}@m.com`, address: 'A', password: 'password!1' }, 422);
  await test('No special', '/admin/users', 'POST', adminToken, { name: '12345678901234567890', email: `test11${pfx}@m.com`, address: 'A', password: 'Password1' }, 422);

  console.log("Testing Email Validation...");
  await test('Invalid email', '/admin/users', 'POST', adminToken, { name: '12345678901234567890', email: `test12m.com`, address: 'A', password: 'Password!1' }, 422);
  await test('Duplicate email', '/admin/users', 'POST', adminToken, { name: '12345678901234567890', email: `test7${pfx}@m.com`, address: 'A', password: 'Password!1' }, 409); // Already registered above

  await pool.end();
}
runTests();
