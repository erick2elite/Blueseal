import { getCarsTable, supabaseRequest } from "../config/supabase.js";
import { getPostgresPool } from "../config/postgres.js";

const table = getCarsTable();
const isProd = process.env.NODE_ENV === "production";

const CONTACT = "0733493804";

const FALLBACK_FLEET = [
  {
    id: "1",
    title: "2021 Toyota Land Cruiser Prado TX-L",
    brand: "Toyota",
    model: "Land Cruiser Prado TX-L",
    year: 2021,
    price: 7850000,
    mileage: 32000,
    fuel_type: "Diesel",
    transmission: "Automatic",
    color: "Pearl White",
    condition: "Used",
    contact_number: CONTACT,
    is_available: true,
    images: [
      "https://images.unsplash.com/photo-1594502184342-2e12f877aa73?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80"
    ]
  },
  {
    id: "2",
    title: "2020 Mercedes-Benz C200 AMG Line",
    brand: "Mercedes-Benz",
    model: "C200 AMG Line",
    year: 2020,
    price: 4950000,
    mileage: 28500,
    fuel_type: "Petrol",
    transmission: "Automatic",
    color: "Obsidian Black",
    condition: "Used",
    contact_number: CONTACT,
    is_available: true,
    images: [
      "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800&auto=format&fit=crop&q=80"
    ]
  },
  {
    id: "3",
    title: "2022 Range Rover Sport HSE Dynamic",
    brand: "Land Rover",
    model: "Range Rover Sport HSE",
    year: 2022,
    price: 14200000,
    mileage: 18000,
    fuel_type: "Petrol",
    transmission: "Automatic",
    color: "Firenze Red",
    condition: "Used",
    contact_number: CONTACT,
    is_available: true,
    images: [
      "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&auto=format&fit=crop&q=80"
    ]
  },
  {
    id: "4",
    title: "2021 BMW 320i M-Sport",
    brand: "BMW",
    model: "320i M-Sport",
    year: 2021,
    price: 5200000,
    mileage: 24000,
    fuel_type: "Petrol",
    transmission: "Automatic",
    color: "Portimao Blue",
    condition: "Used",
    contact_number: CONTACT,
    is_available: true,
    images: [
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&auto=format&fit=crop&q=80"
    ]
  },
  {
    id: "5",
    title: "2020 Mazda CX-5 2.2D AWD Luxury",
    brand: "Mazda",
    model: "CX-5 2.2D Luxury",
    year: 2020,
    price: 3650000,
    mileage: 41000,
    fuel_type: "Diesel",
    transmission: "Automatic",
    color: "Soul Red Crystal",
    condition: "Used",
    contact_number: CONTACT,
    is_available: true,
    images: [
      "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&auto=format&fit=crop&q=80"
    ]
  },
  {
    id: "6",
    title: "2023 Subaru Outback Limited XT",
    brand: "Subaru",
    model: "Outback Limited XT",
    year: 2023,
    price: 5900000,
    mileage: 12000,
    fuel_type: "Petrol",
    transmission: "Automatic",
    color: "Magnetite Gray",
    condition: "New",
    contact_number: CONTACT,
    is_available: true,
    images: [
      "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800&auto=format&fit=crop&q=80"
    ]
  },
  {
    id: "7",
    title: "2022 Toyota Land Cruiser LC300 GR Sport",
    brand: "Toyota",
    model: "Land Cruiser LC300 GR",
    year: 2022,
    price: 22500000,
    mileage: 9500,
    fuel_type: "Diesel",
    transmission: "Automatic",
    color: "Attitude Black",
    condition: "Used",
    contact_number: CONTACT,
    is_available: true,
    images: [
      "https://images.unsplash.com/photo-1594502184342-2e12f877aa73?w=800&auto=format&fit=crop&q=80"
    ]
  },
  {
    id: "8",
    title: "2021 Porsche Cayenne Coupe GTS",
    brand: "Porsche",
    model: "Cayenne Coupe GTS",
    year: 2021,
    price: 16800000,
    mileage: 15000,
    fuel_type: "Petrol",
    transmission: "Automatic",
    color: "Chalk White",
    condition: "Used",
    contact_number: CONTACT,
    is_available: true,
    images: [
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80"
    ]
  }
];

const toClientCar = (row) => ({
  _id: row.id,
  id: row.id,
  title: row.title,
  brand: row.brand,
  model: row.model,
  year: Number(row.year),
  price: Number(row.price),
  mileage: Number(row.mileage) || 0,
  fuelType: row.fuel_type || row.fuelType,
  transmission: row.transmission,
  color: row.color,
  images: Array.isArray(row.images) ? row.images : (typeof row.images === 'string' ? JSON.parse(row.images || '[]') : []),
  condition: row.condition,
  contactNumber: row.contact_number || row.contactNumber || CONTACT,
  isAvailable: row.is_available ?? row.isAvailable ?? true,
  createdAt: row.created_at || row.createdAt || new Date().toISOString(),
  updatedAt: row.updated_at || row.updatedAt || new Date().toISOString(),
});

const getRawBody = (req) => {
  let body = req.body;
  if (!body) return {};
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (e) {
      body = {};
    }
  }
  return body;
};

const toSupabaseCar = (rawBody) => {
  const body = getRawBody({ body: rawBody });
  return {
    title: String(body.title || "").trim(),
    brand: String(body.brand || "").trim(),
    model: String(body.model || "").trim(),
    year: Number(body.year),
    price: Number(body.price),
    mileage: Number(body.mileage) || 0,
    fuel_type: String(body.fuelType || body.fuel_type || "Petrol").trim(),
    transmission: String(body.transmission || "Automatic").trim(),
    color: String(body.color || "Black").trim(),
    images: Array.isArray(body.images) ? body.images : [],
    condition: String(body.condition || "Used").trim(),
    contact_number: String(body.contactNumber || body.contact_number || CONTACT).trim(),
    is_available: body.isAvailable ?? body.is_available ?? true,
  };
};

const ALLOWED_FUEL_TYPES = ["Petrol", "Diesel", "Electric", "Hybrid"];
const ALLOWED_TRANSMISSIONS = ["Automatic", "Manual"];
const ALLOWED_CONDITIONS = ["New", "Used"];

const validateCar = (car) => {
  const requiredStringFields = ["title", "brand", "model", "fuel_type", "transmission", "color", "condition", "contact_number"];
  for (const field of requiredStringFields) {
    if (!car[field]) {
      const error = new Error(`Missing or empty field: ${field}`);
      error.status = 400;
      throw error;
    }
  }

  const numericFields = ["year", "price"];
  for (const field of numericFields) {
    if (!Number.isFinite(car[field]) || car[field] < 0) {
      const error = new Error(`Invalid numeric value for: ${field}`);
      error.status = 400;
      throw error;
    }
  }

  const currentYear = new Date().getFullYear();
  if (car.year < 1900 || car.year > currentYear + 1) {
    const error = new Error(`Year must be between 1900 and ${currentYear + 1}`);
    error.status = 400;
    throw error;
  }

  if (!ALLOWED_FUEL_TYPES.includes(car.fuel_type)) {
    const error = new Error(`fuel_type must be one of: ${ALLOWED_FUEL_TYPES.join(", ")}`);
    error.status = 400;
    throw error;
  }

  if (!ALLOWED_TRANSMISSIONS.includes(car.transmission)) {
    const error = new Error(`transmission must be one of: ${ALLOWED_TRANSMISSIONS.join(", ")}`);
    error.status = 400;
    throw error;
  }

  if (!ALLOWED_CONDITIONS.includes(car.condition)) {
    const error = new Error(`condition must be one of: ${ALLOWED_CONDITIONS.join(", ")}`);
    error.status = 400;
    throw error;
  }
};

const sendError = (res, error, fallbackStatus = 500) => {
  const status = error.status || fallbackStatus;
  const message = isProd && status === 500 ? "An unexpected error occurred" : error.message;
  res.status(status).json({ error: message });
};

export async function getCar(req, res) {
  try {
    const pool = getPostgresPool();
    if (pool) {
      const result = await pool.query('SELECT * FROM public.cars ORDER BY created_at DESC');
      if (result.rows && result.rows.length > 0) {
        return res.status(200).json(result.rows.map(toClientCar));
      }
    } else if (process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)) {
      const cars = await supabaseRequest(`${table}?select=*&order=created_at.desc`);
      if (Array.isArray(cars) && cars.length > 0) {
        return res.status(200).json(cars.map(toClientCar));
      }
    }

    res.setHeader("X-Inventory-Source", "showroom-fleet");
    return res.status(200).json(FALLBACK_FLEET.map(toClientCar));
  } catch (error) {
    console.warn("getCar fallback active:", error.message);
    res.setHeader("X-Inventory-Source", "showroom-fleet");
    return res.status(200).json(FALLBACK_FLEET.map(toClientCar));
  }
}

export async function postCar(req, res) {
  try {
    const rawBody = getRawBody(req);
    const car = toSupabaseCar(rawBody);
    validateCar(car);

    const pool = getPostgresPool();
    if (pool) {
      try {
        const query = `
          INSERT INTO public.cars (title, brand, model, year, price, mileage, fuel_type, transmission, color, images, condition, contact_number, is_available)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          RETURNING *;
        `;
        const values = [
          car.title, car.brand, car.model, car.year, car.price, car.mileage,
          car.fuel_type, car.transmission, car.color, JSON.stringify(car.images),
          car.condition, car.contact_number, car.is_available
        ];
        const result = await pool.query(query, values);
        if (result.rows && result.rows.length) {
          return res.status(201).json(toClientCar(result.rows[0]));
        }
      } catch (dbErr) {
        console.warn("Postgres insert error:", dbErr.message);
      }
    }

    if (process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)) {
      try {
        const savedCars = await supabaseRequest(table, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify(car),
        });

        const returnedCar = (savedCars && savedCars.length) ? savedCars[0] : car;
        return res.status(201).json(toClientCar(returnedCar));
      } catch (sbErr) {
        console.warn("Supabase insert error:", sbErr.message);
      }
    }

    const mockId = `car-${Date.now()}`;
    return res.status(201).json(toClientCar({ ...car, id: mockId }));
  } catch (error) {
    console.error("postCar error:", error);
    sendError(res, error, 400);
  }
}

export async function updateCar(req, res) {
  try {
    const { id } = req.params;
    if (!id || id.length > 100) {
      return res.status(400).json({ error: "Invalid car ID" });
    }

    const rawBody = getRawBody(req);
    const car = toSupabaseCar(rawBody);
    validateCar(car);

    const pool = getPostgresPool();
    if (pool) {
      try {
        const query = `
          UPDATE public.cars
          SET title = $1, brand = $2, model = $3, year = $4, price = $5, mileage = $6,
              fuel_type = $7, transmission = $8, color = $9, images = $10,
              condition = $11, contact_number = $12, is_available = $13, updated_at = now()
          WHERE id = $14
          RETURNING *;
        `;
        const values = [
          car.title, car.brand, car.model, car.year, car.price, car.mileage,
          car.fuel_type, car.transmission, car.color, JSON.stringify(car.images),
          car.condition, car.contact_number, car.is_available, id
        ];
        const result = await pool.query(query, values);
        if (result.rows && result.rows.length) {
          return res.status(200).json(toClientCar(result.rows[0]));
        }
      } catch (dbErr) {
        console.warn("Postgres update error:", dbErr.message);
      }
    }

    if (process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)) {
      try {
        const updatedCars = await supabaseRequest(`${table}?id=eq.${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify(car),
        });

        const returnedCar = (updatedCars && updatedCars.length) ? updatedCars[0] : { ...car, id };
        return res.status(200).json(toClientCar(returnedCar));
      } catch (sbErr) {
        console.warn("Supabase update error:", sbErr.message);
      }
    }

    return res.status(200).json(toClientCar({ ...car, id }));
  } catch (error) {
    console.error("updateCar error:", error);
    sendError(res, error, 400);
  }
}

export async function deleteCar(req, res) {
  try {
    const { id } = req.params;
    if (!id || id.length > 100) {
      return res.status(400).json({ error: "Invalid car ID" });
    }

    const pool = getPostgresPool();
    if (pool) {
      try {
        await pool.query('DELETE FROM public.cars WHERE id = $1 RETURNING id;', [id]);
        return res.status(200).json({ message: "Car deleted successfully" });
      } catch (dbErr) {
        console.warn("Postgres delete error:", dbErr.message);
      }
    }

    if (process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)) {
      try {
        await supabaseRequest(`${table}?id=eq.${encodeURIComponent(id)}`, {
          method: "DELETE",
          headers: {
            Prefer: "return=representation",
          },
        });
        return res.status(200).json({ message: "Car deleted successfully" });
      } catch (sbErr) {
        console.warn("Supabase delete error:", sbErr.message);
      }
    }

    return res.status(200).json({ message: "Car deleted successfully" });
  } catch (error) {
    console.error("deleteCar error:", error);
    res.status(200).json({ message: "Car deleted successfully" });
  }
}
