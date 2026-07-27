import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

const isValidDb =
  process.env.DATABASE_URL &&
  process.env.DATABASE_URL !== "your_secret" &&
  !process.env.DATABASE_URL.includes("your_secret");

if (!isValidDb) {
  console.warn("⚠️ DATABASE_URL not set or valid. Using fallback in-memory storage.");
}

export const pool = isValidDb
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;

export const db = isValidDb ? drizzle({ client: pool!, schema }) : null;
