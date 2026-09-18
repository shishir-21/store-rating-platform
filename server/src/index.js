import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import authRouter from './routes/auth.js';
import storesRouter from './routes/stores.js';
import adminRouter from './routes/admin.js';
import ownerRouter from './routes/owner.js';

const app = express();

const allowedOrigins = config.nodeEnv === 'production' 
  ? [config.frontendUrl] 
  : ['http://localhost:5173', config.frontendUrl];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.use(express.json());
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRouter);
app.use('/api/stores', storesRouter);
app.use('/api/admin', adminRouter);
app.use('/api/owner', ownerRouter);

app.use((error, _req, res, _next) => {
  if (config.nodeEnv !== 'production') {
    console.error(error);
  } else {
    console.error(error.message || error);
  }
  if (error.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: 'Not allowed by CORS' });
  }
  res.status(500).json({ message: 'An unexpected server error occurred.' });
});

const { port } = config;
app.listen(port, '0.0.0.0', () => console.log(`API listening on ${port}`));
