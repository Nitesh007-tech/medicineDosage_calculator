import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@shared/schema";

const isValidDb =
  !!process.env.DATABASE_URL &&
  process.env.DATABASE_URL !== "your_secret" &&
  !process.env.DATABASE_URL.includes("your_secret");

if (!isValidDb) {
  console.warn("⚠️ DATABASE_URL not set or valid. Using fallback in-memory storage.");
}

const sql = isValidDb ? neon(process.env.DATABASE_URL!) : null;

export const db = sql ? drizzle(sql, { schema }) : null;
