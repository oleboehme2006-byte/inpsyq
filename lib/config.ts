// lib/config.ts

/**
 * Database Configuration
 * 
 * Resolution Order: DATABASE_URL > POSTGRES_URL > DATABASE_URL_UNPOOLED
 */
export function getDatabaseConfig() {
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL_UNPOOLED;

  if (!url) {
    const context = process.env.VERCEL ? 'Vercel' : 'local development';
    const instruction = process.env.VERCEL
      ? 'Set DATABASE_URL in Vercel Environment Variables (Neon integration).'
      : 'Create .env.local with DATABASE_URL="postgresql://..." or run: npm run seed:dev after setup.';

    throw new Error(
      `DATABASE_URL is missing.\n` +
      `  Context: ${context}\n` +
      `  Fix: ${instruction}\n` +
      `  Checked: DATABASE_URL, POSTGRES_URL, DATABASE_URL_UNPOOLED`
    );
  }

  // Parse for logging (mask password)
  try {
    const u = new URL(url);
    const mode = process.env.NODE_ENV || 'development';
    // Server-side logging only for startup visibility
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[DB] Connecting to ${u.host}/${u.pathname.split('/')[1]} [${mode}]`);
    }
  } catch (e) {
    console.warn("[DB] Could not parse connection string for logging.");
  }

  // Neon requires SSL; enable it unless explicitly disabled
  const useSSL = url.includes('neon.tech') || process.env.NODE_ENV === 'production';

  return {
    connectionString: url,
    ssl: useSSL ? { rejectUnauthorized: false } : undefined
  };
}

// Lazy initialization - don't call getDatabaseConfig at import time for scripts
let _dbConfig: ReturnType<typeof getDatabaseConfig> | null = null;

export function getDbConfig() {
  if (!_dbConfig) {
    _dbConfig = getDatabaseConfig();
  }
  return _dbConfig;
}

// For backwards compatibility - lazy evaluated on first access
// Uses a getter to defer evaluation until actually needed
export const dbConfig = new Proxy({} as ReturnType<typeof getDatabaseConfig>, {
  get(_, prop) {
    return getDbConfig()[prop as keyof ReturnType<typeof getDatabaseConfig>];
  }
});
