import pg from 'pg';

const { Pool } = pg;
let pool = null;

export const getPostgresPool = () => {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) return null;

  pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }, // Required for Supabase SSL connection
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  return pool;
};

export const initPostgresTable = async () => {
  const p = getPostgresPool();
  if (!p) return;

  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS public.cars (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      year INTEGER NOT NULL,
      price NUMERIC NOT NULL,
      mileage INTEGER DEFAULT 0,
      fuel_type TEXT NOT NULL,
      transmission TEXT NOT NULL,
      color TEXT NOT NULL,
      images JSONB NOT NULL DEFAULT '[]'::jsonb,
      condition TEXT NOT NULL DEFAULT 'Used',
      contact_number TEXT NOT NULL DEFAULT '0733493804',
      is_available BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;

  try {
    await p.query(createTableQuery);
  } catch (err) {
    console.warn("Postgres auto-init notice:", err.message);
  }
};

export const checkPostgres = async () => {
  const p = getPostgresPool();
  if (!p) throw new Error("No DATABASE_URL configured");
  const res = await p.query("SELECT NOW()");
  return Boolean(res.rows.length);
};
