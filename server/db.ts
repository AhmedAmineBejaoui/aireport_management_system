import { drizzle } from "drizzle-orm/postgres-js";
import 'dotenv/config';
import postgres from "postgres";

// Check for required environment variables
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Create postgres client
const client = postgres(process.env.DATABASE_URL);

// Create drizzle instance
export const db = drizzle(client);
