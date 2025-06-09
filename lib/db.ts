import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL, // Use environment variable for connection string
  ssl: {
    rejectUnauthorized: false, // For development; consider proper certificate validation in production
  },
});

export default pool;
