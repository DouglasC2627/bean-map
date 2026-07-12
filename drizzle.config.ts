import { defineConfig } from "drizzle-kit";

// drizzle-kit doesn't load .env on its own, so the db:* scripts wouldn't see
// DATABASE_URL. Load it here (Next-style precedence: .env.local over .env).
if (typeof process.loadEnvFile === "function") {
  for (const file of [".env", ".env.local"]) {
    try {
      process.loadEnvFile(file);
    } catch {
      // file may not exist — ignore
    }
  }
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
