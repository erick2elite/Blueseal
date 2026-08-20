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
    await seedInitialCars();
  } catch (err) {
    console.warn("Postgres auto-init notice:", err.message);
  }
};

export const seedInitialCars = async () => {
  const p = getPostgresPool();
  if (!p) return;

  try {
    const countRes = await p.query("SELECT COUNT(*) FROM public.cars");
    if (parseInt(countRes.rows[0].count, 10) === 0) {
      console.log("Seeding initial Blue Seal showroom inventory into Supabase...");
      const seedQuery = `
        INSERT INTO public.cars (title, brand, model, year, price, mileage, fuel_type, transmission, color, images, condition, contact_number, is_available)
        VALUES
        ('2021 Toyota Land Cruiser Prado TX-L', 'Toyota', 'Land Cruiser Prado TX-L', 2021, 7850000, 32000, 'Diesel', 'Automatic', 'Pearl White', '["https://images.unsplash.com/photo-1594502184342-2e12f877aa73?w=800&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80"]'::jsonb, 'Used', '0733493804', true),
        ('2020 Mercedes-Benz C200 AMG Line', 'Mercedes-Benz', 'C200 AMG Line', 2020, 4950000, 28500, 'Petrol', 'Automatic', 'Obsidian Black', '["https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800&auto=format&fit=crop&q=80"]'::jsonb, 'Used', '0733493804', true),
        ('2022 Range Rover Sport HSE Dynamic', 'Land Rover', 'Range Rover Sport HSE', 2022, 14200000, 18000, 'Petrol', 'Automatic', 'Firenze Red', '["https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&auto=format&fit=crop&q=80"]'::jsonb, 'Used', '0733493804', true),
        ('2021 BMW 320i M-Sport', 'BMW', '320i M-Sport', 2021, 5200000, 24000, 'Petrol', 'Automatic', 'Portimao Blue', '["https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&auto=format&fit=crop&q=80"]'::jsonb, 'Used', '0733493804', true),
        ('2020 Mazda CX-5 2.2D AWD Luxury', 'Mazda', 'CX-5 2.2D Luxury', 2020, 3650000, 41000, 'Diesel', 'Automatic', 'Soul Red Crystal', '["https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&auto=format&fit=crop&q=80"]'::jsonb, 'Used', '0733493804', true),
        ('2023 Subaru Outback Limited XT', 'Subaru', 'Outback Limited XT', 2023, 5900000, 12000, 'Petrol', 'Automatic', 'Magnetite Gray', '["https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800&auto=format&fit=crop&q=80"]'::jsonb, 'New', '0733493804', true),
        ('2022 Toyota Land Cruiser LC300 GR Sport', 'Toyota', 'Land Cruiser LC300 GR', 2022, 22500000, 9500, 'Diesel', 'Automatic', 'Attitude Black', '["https://images.unsplash.com/photo-1594502184342-2e12f877aa73?w=800&auto=format&fit=crop&q=80"]'::jsonb, 'Used', '0733493804', true),
        ('2021 Porsche Cayenne Coupe GTS', 'Porsche', 'Cayenne Coupe GTS', 2021, 16800000, 15000, 'Petrol', 'Automatic', 'Chalk White', '["https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80"]'::jsonb, 'Used', '0733493804', true);
      `;
      await p.query(seedQuery);
      console.log("Successfully seeded Blue Seal showroom inventory!");
    }
  } catch (err) {
    console.warn("Seeding notice:", err.message);
  }
};

export const checkPostgres = async () => {
  const p = getPostgresPool();
  if (!p) throw new Error("No DATABASE_URL configured");
  const res = await p.query("SELECT NOW()");
  return Boolean(res.rows.length);
};
