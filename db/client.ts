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

  // Pool sizing:
  //   3 concurrent orgs × 3 concurrent teams × ~2 queries/team = 18 connections.
  //   20 gives safe headroom for org-rollup queries running alongside.
  //   DB_POOL_SIZE env var allows tuning without a deploy.
  const maxConnections = process.env.DB_POOL_SIZE
    ? parseInt(process.env.DB_POOL_SIZE, 10)
    : isServerless ? 20 : 30;

  return new Pool({
    ...config,
    max: maxConnections,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 15_000,
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
