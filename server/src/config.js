import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const serverDir = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(serverDir, '../.env');
dotenv.config({ path: envPath });

if (!process.env.DATABASE_URL) {
  throw new Error(`DATABASE_URL is required. Create ${envPath} from .env.example.`);
}
if (!process.env.JWT_SECRET) {
  throw new Error(`JWT_SECRET is required. Create ${envPath} from .env.example.`);
}

export const config = {
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || 'development',
  // Legacy single URL (may be used elsewhere)
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  // Build allowedOrigins list. In development, defaults to localhost and any FRONTEND_URL.
  // In production, include the stable FRONTEND_URL and a safe wildcard for this project's preview URLs.
  allowedOrigins: (function () {
    // If ALLOWED_ORIGINS env var is set, use it directly (comma‑separated list).
    if (process.env.ALLOWED_ORIGINS) {
      return process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean);
    }
    const base = process.env.FRONTEND_URL || 'http://localhost:5173';
    const origins = [base];
    // Add wildcard preview pattern only in production.
    if ((process.env.NODE_ENV || 'development') === 'production') {
      origins.push('https://store-rating-platform-client-*.vercel.app');
    }
    return origins;
  })(),
};
