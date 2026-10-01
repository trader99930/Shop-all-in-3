import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: Pool | undefined;
}

export const createPool = () => {
  if (!global._postgresPool) {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not configured');
    }

    global._postgresPool = new Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes('neon.tech')
        ? { rejectUnauthorized: false }
        : undefined,
      max: 10,
      connectionTimeoutMillis: 15000,
    });

    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }

  return global._postgresPool;
};

const pool = createPool();

export const db = drizzle(pool, {
  schema,
});