import pg from 'pg';
import { config } from './config.js';

export function getDatabasePoolOptions(databaseUrl, nodeEnv) {
  const parsedUrl = new URL(databaseUrl);
  const hasSslMode = parsedUrl.searchParams.has('sslmode');
  parsedUrl.searchParams.delete('sslmode');

  return {
    connectionString: parsedUrl.toString(),
    // Keep production and explicitly SSL-configured URLs encrypted while using
    // modern certificate verification instead of pg's deprecated sslmode aliases.
    ...((nodeEnv === 'production' || hasSslMode) && { ssl: { rejectUnauthorized: true } }),
  };
}

export const pool = new pg.Pool(getDatabasePoolOptions(config.databaseUrl, config.nodeEnv));
