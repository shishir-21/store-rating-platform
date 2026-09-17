import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { requireAuth, allowRoles } from '../middleware/auth.js';
import { validateUserInput } from '../validation.js';
import { safeSort, direction, pagination } from '../query.js';

const router = Router();
router.use(requireAuth, allowRoles('ADMIN'));

router.get('/stats', async (_req, res, next) => {
  try { const { rows } = await pool.query(`SELECT (SELECT COUNT(*) FROM users)::int users, (SELECT COUNT(*) FROM stores)::int stores, (SELECT COUNT(*) FROM ratings)::int ratings`); return res.json(rows[0]); }
  catch (error) { return next(error); }
});

router.post('/users', async (req, res, next) => {
  try {
    const { name, email, address, password, role = 'USER' } = req.body;
    const errors = validateUserInput({ name, email, address, password });
    if (!['ADMIN', 'USER', 'STORE_OWNER'].includes(role)) errors.role = 'Invalid role.';
    if (Object.keys(errors).length) return res.status(422).json({ errors });
    const { rows } = await pool.query(`INSERT INTO users(name,email,address,password_hash,role) VALUES($1,$2,$3,$4,$5) RETURNING id,name,email,address,role`, [name.trim(),email.toLowerCase(),address.trim(),await bcrypt.hash(password,12),role]);
    return res.status(201).json({ user: rows[0] });
  } catch (error) { if (error.code === '23505') return res.status(409).json({ errors: { email: 'This email is already registered.' } }); return next(error); }
});

router.get('/users', async (req, res, next) => {
  try {
    const { name = '', email = '', address = '', role = '', sort = 'name', order = 'asc' } = req.query; const { limit, offset } = pagination(req.query);
    const col = safeSort(sort, ['name','email','address','role','created_at'], 'name');
    const { rows } = await pool.query(`SELECT u.id,u.name,u.email,u.address,u.role,ROUND(AVG(r.score)::numeric,2) AS rating
      FROM users u LEFT JOIN stores s ON s.owner_id=u.id LEFT JOIN ratings r ON r.store_id=s.id
      WHERE u.name ILIKE $1 AND u.email ILIKE $2 AND u.address ILIKE $3 AND ($4='' OR u.role::text=$4)
      GROUP BY u.id ORDER BY u.${col} ${direction(order)} LIMIT $5 OFFSET $6`, [`%${name}%`,`%${email}%`,`%${address}%`,role,limit,offset]);
    return res.json({ users: rows, limit, offset });
  } catch (error) { return next(error); }
});

router.get('/users/:id', async (req, res, next) => {
  try { const { rows } = await pool.query(`SELECT u.id,u.name,u.email,u.address,u.role,ROUND(AVG(r.score)::numeric,2) AS rating FROM users u LEFT JOIN stores s ON s.owner_id=u.id LEFT JOIN ratings r ON r.store_id=s.id WHERE u.id=$1 GROUP BY u.id`, [req.params.id]); return rows[0] ? res.json({ user: rows[0] }) : res.status(404).json({ message: 'User not found.' }); }
  catch (error) { return next(error); }
});

router.post('/stores', async (req, res, next) => {
  try {
    const { name, email, address, ownerId = null } = req.body;
    const errors = {}; if (!name?.trim()) errors.name = 'Store name is required.'; if (!email?.includes('@')) errors.email = 'Enter a valid email address.'; if (!address?.trim() || address.length > 400) errors.address = 'Address is required and may not exceed 400 characters.';
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (ownerId && !uuidRegex.test(ownerId)) errors.ownerId = 'Choose a valid store owner.';
    if (Object.keys(errors).length) return res.status(422).json({ errors });
    if (ownerId) { const owner = await pool.query(`SELECT id FROM users WHERE id=$1 AND role='STORE_OWNER'`, [ownerId]); if (!owner.rows[0]) return res.status(422).json({ errors: { ownerId: 'Choose a valid store owner.' } }); }
    const { rows } = await pool.query('INSERT INTO stores(name,email,address,owner_id) VALUES($1,$2,$3,$4) RETURNING *', [name.trim(),email.toLowerCase(),address.trim(),ownerId]);
    return res.status(201).json({ store: rows[0] });
  } catch (error) { if (error.code === '23505') return res.status(409).json({ errors: { email: 'This email is already in use.' } }); return next(error); }
});
export default router;

