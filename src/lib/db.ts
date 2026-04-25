import { Pool } from 'pg';

// Create a connection pool to PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, 
  // FIXED: Disable SSL because we are using Unix Sockets (Cloud Run)
  // The socket itself is secure, so we don't need the driver to negotiate SSL.
  ssl: false,
});

export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  return res;
};

export default pool;