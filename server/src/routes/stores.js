import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, allowRoles } from '../middleware/auth.js';
import { safeSort, direction, pagination } from '../query.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const { search = '', name = '', email = '', address = '', sort = 'name', order = 'asc' } = req.query;
    const { limit, offset } = pagination(req.query);
    const sortColumn = safeSort(sort, ['name', 'email', 'address', 'average_rating'], 'name');
    const term = `%${search}%`;
    const { rows } = await pool.query(`
      SELECT s.id,s.name,s.email,s.address,ROUND(AVG(r.score)::numeric, 2) AS average_rating,
        MAX(r.score) FILTER (WHERE r.user_id = $1) AS user_rating, COUNT(r.id)::int AS rating_count
      FROM stores s LEFT JOIN ratings r ON r.store_id=s.id
      WHERE (s.name ILIKE $2 OR s.address ILIKE $2) AND s.name ILIKE $3 AND s.email ILIKE $4 AND s.address ILIKE $5
      GROUP BY s.id ORDER BY ${sortColumn === 'average_rating' ? 'AVG(r.score)' : `s.${sortColumn}`} ${direction(order)} NULLS LAST
      LIMIT $6 OFFSET $7`, [req.user.id, term, `%${name}%`, `%${email}%`, `%${address}%`, limit, offset]);
    return res.json({ stores: rows, limit, offset });
  } catch (error) { return next(error); }
});

router.put('/:storeId/rating', allowRoles('USER'), async (req, res, next) => {
  try {
    const score = Number(req.body.score);
    if (!Number.isInteger(score) || score < 1 || score > 5) return res.status(422).json({ errors: { score: 'Rating must be a whole number from 1 to 5.' } });
    const exists = await pool.query('SELECT id FROM stores WHERE id=$1', [req.params.storeId]);
    if (!exists.rows[0]) return res.status(404).json({ message: 'Store not found.' });
    const { rows } = await pool.query(`INSERT INTO ratings (user_id,store_id,score) VALUES ($1,$2,$3)
      ON CONFLICT (user_id,store_id) DO UPDATE SET score=EXCLUDED.score,updated_at=NOW() RETURNING *`, [req.user.id, req.params.storeId, score]);
    return res.json({ rating: rows[0] });
  } catch (error) { return next(error); }
});
export default router;
