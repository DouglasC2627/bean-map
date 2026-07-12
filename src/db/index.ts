import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

export { schema };

let cached: NeonHttpDatabase<typeof schema> | null = null;

/** True when a database connection string is configured. */
export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

/**
 * Lazily constructs the Drizzle client. Only called from route handlers after
 * an auth check, so the app builds and runs fully without a database — the
 * client is never instantiated until a request actually needs it.
 */
export function getDb(): NeonHttpDatabase<typeof schema> {
  if (cached) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  cached = drizzle(neon(url), { schema });
  return cached;
}
