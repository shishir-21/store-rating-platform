import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import authRouter from './routes/auth.js';

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRouter);
app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: 'An unexpected server error occurred.' });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API listening on ${port}`));
