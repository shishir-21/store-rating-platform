import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { validateUserInput } from '../validation.js';

const router = Router();
const publicUser = ({ password_hash, ...user }) => user;
const sign = (user) => jwt.sign({ id: user.id, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: '8h' });

export const normalizeRegistrationEmail = (email) =>
  typeof email === 'string' ? email.trim().toLowerCase() : email;

export const isUsersEmailUniqueViolation = (error) =>
  error?.code === '23505' && error.constraint === 'users_email_key';

export async function register(req, res, next, database = pool) {
  try {
    const { name, email, address, password } = req.body;
    const normalizedEmail = normalizeRegistrationEmail(email);
    const errors = validateUserInput({ name, email: normalizedEmail, address, password });
    if (Object.keys(errors).length) return res.status(422).json({ errors });
    const hash = await bcrypt.hash(password, 12);
    const result = await database.query(
      `INSERT INTO users (name, email, address, password_hash, role) VALUES ($1,$2,$3,$4,'USER') RETURNING id,name,email,address,role,created_at`,
      [name.trim(), normalizedEmail, address.trim(), hash]
    );
    const user = result.rows[0];
    return res.status(201).json({ user, token: sign(user) });
  } catch (error) {
    if (isUsersEmailUniqueViolation(error)) return res.status(409).json({ errors: { email: 'This email is already registered.' } });
    return next(error);
  }
}

router.post('/register', (req, res, next) => register(req, res, next));

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email?.toLowerCase()]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password || '', user.password_hash))) return res.status(401).json({ message: 'Invalid email or password.' });
    return res.json({ user: publicUser(user), token: sign(user) });
  } catch (error) { return next(error); }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT id,name,email,address,role,created_at FROM users WHERE id = $1', [req.user.id]);
    if (!rows[0]) return res.status(404).json({ message: 'User not found.' });
    return res.json({ user: rows[0] });
  } catch (error) { return next(error); }
});

router.patch('/password', requireAuth, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const errors = validateUserInput({ password: newPassword }, { requireProfile: false });
    if (errors.password) return res.status(422).json({ errors });
    const { rows } = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    if (!rows[0] || !(await bcrypt.compare(currentPassword || '', rows[0].password_hash))) return res.status(401).json({ message: 'Current password is incorrect.' });
    await pool.query('UPDATE users SET password_hash=$1, updated_at=NOW() WHERE id=$2', [await bcrypt.hash(newPassword, 12), req.user.id]);
    return res.json({ message: 'Password updated successfully.' });
  } catch (error) { return next(error); }
});

export default router;
