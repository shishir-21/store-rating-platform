import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import authRouter from './routes/auth.js';
import storesRouter from './routes/stores.js';
import adminRouter from './routes/admin.js';
import ownerRouter from './routes/owner.js';

const app = express();
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRouter);
app.use('/api/stores', storesRouter);
app.use('/api/admin', adminRouter);
app.use('/api/owner', ownerRouter);
app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: 'An unexpected server error occurred.' });
});

const { port } = config;
app.listen(port, () => console.log(`API listening on ${port}`));
