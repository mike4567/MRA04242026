import { Pool } from 'pg';

// Create a connection pool to PostgreSQL
// LOCAL DEV: Connects via Cloud SQL Proxy on 127.0.0.1:5432
// CLOUD RUN: Connects via Unix socket (set in DATABASE_URL)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Disable SSL - Cloud SQL Proxy handles encryption
  ssl: false,
  // Connection pool tuning for stability with Cloud SQL Proxy
  max: 5,                      // Limit concurrent connections (proxy has limits)
  idleTimeoutMillis: 30000,    // Close idle connections after 30s
  connectionTimeoutMillis: 10000, // Wait up to 10s for a connection
});

// Log pool errors (helps diagnose ECONNRESET issues)
pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err);
});

export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  return res;
};

export default pool;