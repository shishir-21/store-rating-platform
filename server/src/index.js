import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import authRouter from './routes/auth.js';
import storesRouter from './routes/stores.js';
import adminRouter from './routes/admin.js';
import ownerRouter from './routes/owner.js';

export const app = express();

// Build the allowlist from the config.allowedOrigins array (may contain exact URLs or simple wildcard patterns)
const allowedOrigins = config.allowedOrigins;

function wildcardPatternToRegex(pattern) {
  // Escape each literal section independently so `*` remains a wildcard token.
  // Escaping the complete string first would turn `*` into `\\*`, preventing
  // the subsequent wildcard replacement from matching preview URLs.
  const escapedParts = pattern
    .split('*')
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  return new RegExp(`^${escapedParts.join('.*')}$`);
}

export function isOriginAllowed(origin, origins = allowedOrigins) {
  // Allow requests without Origin header (same-origin or server-to-server)
  if (!origin) return true;
  // Direct match
  if (origins.includes(origin)) return true;
  // Wildcard pattern match (e.g., https://store-rating-platform-client-*.vercel.app)
  for (const pattern of origins) {
    if (pattern.includes('*')) {
      if (wildcardPatternToRegex(pattern).test(origin)) return true;
    }
  }
  return false;
}

app.use(cors({
  origin: function (origin, callback) {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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
const isDirectExecution = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  app.listen(port, '0.0.0.0', () => console.log(`API listening on ${port}`));
}
