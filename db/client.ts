import { Pool } from 'pg';
import { config } from '../lib/config';

// Singleton pool
declare global {
    var pgPool: Pool | undefined;
}

let pool: Pool;

if (!global.pgPool) {
    global.pgPool = new Pool(config.db);
}
pool = global.pgPool;

export const query = async (text: string, params?: any[]) => {
    return pool.query(text, params);
};

export const getClient = async () => {
    return pool.connect();
}
