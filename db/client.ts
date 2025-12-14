import { Pool, QueryResult, QueryResultRow, PoolClient } from "pg";
import { dbConfig } from "../lib/config";

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

export const pool =
  global.__pgPool ??
  new Pool(dbConfig);

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
