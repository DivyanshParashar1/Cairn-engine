import { migrate } from "@cairn/engine";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({ connectionString });

await migrate({ pool });
console.log("migrated OK");
await pool.end();
