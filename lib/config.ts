// lib/config.ts
export const DATABASE_URL =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL_UNPOOLED ||
  "";

if (!DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is missing. Set DATABASE_URL in Vercel Environment Variables (Neon)."
  );
}
