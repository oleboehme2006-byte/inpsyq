// lib/config.ts

// Resolution Order: DATABASE_URL > POSTGRES_URL > DATABASE_URL_UNPOOLED
export function getDatabaseConfig() {
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL_UNPOOLED;

  if (!url) {
    throw new Error(
      "DATABASE_URL is missing. Set DATABASE_URL in Vercel Environment Variables (Neon)."
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

  return {
    connectionString: url,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined
  };
}

export const dbConfig = getDatabaseConfig();

