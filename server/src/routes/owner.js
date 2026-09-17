import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, allowRoles } from '../middleware/auth.js';
import { safeSort, direction, pagination } from '../query.js';
const router = Router();
router.use(requireAuth, allowRoles('STORE_OWNER'));
router.get('/dashboard', async (req, res, next) => {
  try {
    const { limit, offset } = pagination(req.query); const col = safeSort(req.query.sort, ['name','email','address','score','updated_at'], 'updated_at');
    const storeResult = await pool.query('SELECT s.id,s.name,ROUND(AVG(r.score)::numeric,2) average_rating FROM stores s LEFT JOIN ratings r ON r.store_id=s.id WHERE s.owner_id=$1 GROUP BY s.id', [req.user.id]);
    const store = storeResult.rows[0]; if (!store) return res.status(404).json({ message: 'No store is assigned to this owner.' });
    const { rows } = await pool.query(`SELECT u.id,u.name,u.email,u.address,r.score,r.updated_at FROM ratings r JOIN users u ON u.id=r.user_id WHERE r.store_id=$1 ORDER BY ${col === 'score' || col === 'updated_at' ? `r.${col}` : `u.${col}`} ${direction(req.query.order)} LIMIT $2 OFFSET $3`, [store.id,limit,offset]);
    return res.json({ store, ratings: rows, limit, offset });
  } catch (error) { return next(error); }
});
export default router;
