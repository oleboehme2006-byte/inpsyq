import { Pool, QueryResult, QueryResultRow, PoolClient } from "pg";
import { getDbConfig } from "../lib/config";

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

// Lazy pool creation to ensure env is loaded first
function createPool(): Pool {
  if (global.__pgPool) return global.__pgPool;

  const config = getDbConfig();
  const isServerless = !!process.env.VERCEL || process.env.NODE_ENV === 'production';

  return new Pool({
    ...config,
    // Item 3.13: Prevent connection exhaustion in serverless
    max: isServerless ? 5 : 10,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 10_000,
  });
}

export const pool = createPool();

if (process.env.NODE_ENV !== "production") {
  global.__pgPool = pool;
}

export function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  return pool.query<T>(text, params);
}

export async function getClient(): Promise<PoolClient> {
  return pool.connect(); // caller must release()
}
