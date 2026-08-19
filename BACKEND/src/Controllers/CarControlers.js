import { getCarsTable, supabaseRequest } from "../config/supabase.js";

const table = getCarsTable();
const isProd = process.env.NODE_ENV === "production";

const toClientCar = (row) => ({
  _id: row.id,
  id: row.id,
  title: row.title,
  brand: row.brand,
  model: row.model,
  year: row.year,
  price: Number(row.price),
  mileage: row.mileage,
  fuelType: row.fuel_type,
  transmission: row.transmission,
  color: row.color,
  images: row.images || [],
  condition: row.condition,
  contactNumber: row.contact_number,
  isAvailable: row.is_available,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toSupabaseCar = (body) => ({
  title: String(body.title || "").trim(),
  brand: String(body.brand || "").trim(),
  model: String(body.model || "").trim(),
  year: Number(body.year),
  price: Number(body.price),
  mileage: Number(body.mileage) || 0,
  fuel_type: String(body.fuelType || "").trim(),
  transmission: String(body.transmission || "").trim(),
  color: String(body.color || "").trim(),
  images: Array.isArray(body.images) ? body.images : [],
  condition: String(body.condition || "Used").trim(),
  contact_number: String(body.contactNumber || "0733493804").trim(),
  is_available: body.isAvailable ?? true,
});

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
    const cars = await supabaseRequest(`${table}?select=*&order=created_at.desc`);
    res.status(200).json((cars || []).map(toClientCar));
  } catch (error) {
    sendError(res, error);
  }
}

export async function postCar(req, res) {
  try {
    const car = toSupabaseCar(req.body || {});
    validateCar(car);

    const savedCars = await supabaseRequest(table, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(car),
    });

    const returnedCar = (savedCars && savedCars.length) ? savedCars[0] : car;
    res.status(201).json(toClientCar(returnedCar));
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

    const car = toSupabaseCar(req.body || {});
    validateCar(car);

    const updatedCars = await supabaseRequest(`${table}?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(car),
    });

    if (updatedCars !== null && !updatedCars.length) {
      return res.status(404).json({ error: "Car not found" });
    }

    const returnedCar = (updatedCars && updatedCars.length) ? updatedCars[0] : { ...car, id };
    res.status(200).json(toClientCar(returnedCar));
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

    const deletedCars = await supabaseRequest(`${table}?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: {
        Prefer: "return=representation",
      },
    });

    if (deletedCars !== null && !deletedCars.length) {
      return res.status(404).json({ error: "Car not found" });
    }

    res.status(200).json({ message: "Car deleted successfully" });
  } catch (error) {
    console.error("deleteCar error:", error);
    sendError(res, error);
  }
}
