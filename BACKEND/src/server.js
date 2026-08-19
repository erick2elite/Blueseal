import express from "express"
import connectDB from "./config/db.js";
import CarRoutes from "./Routes/CarRoutes.js";
import { loginAdmin, requireAdmin, verifyAdminAuth } from "./auth.js";
import dotenv from "dotenv"

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === "production";

const allowedOrigins = (process.env.CORS_ORIGIN || "*")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// Security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  if (isProd) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
});

// CORS middleware
app.use((req, res, next) => {
  const requestOrigin = req.get("Origin");
  const allowAnyOrigin = allowedOrigins.includes("*");
  const isLocalhost = requestOrigin && (requestOrigin.startsWith("http://localhost:") || requestOrigin.startsWith("http://127.0.0.1:"));
  const isAllowed = allowAnyOrigin || !requestOrigin || allowedOrigins.includes(requestOrigin) || (!isProd && isLocalhost);

  if (isAllowed) {
    res.header("Access-Control-Allow-Origin", requestOrigin || "*");
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Vary", "Origin");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.post("/api/auth/login", loginAdmin);
app.get("/api/auth/verify", requireAdmin, verifyAdminAuth);

const requireDatabase = async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    res.status(503).json({
      error: "Database unavailable",
      message: isProd ? "Service temporarily unavailable" : error.message,
    });
  }
};

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "Blue Seal Motor Managers API is running!",
    version: "1.0.0",
    endpoints: ["/api/cars", "/api/auth/login"],
    database: "Supabase",
  });
});

// Health / DB check route (hidden from public in production)
app.get("/test-db", async (req, res) => {
  try {
    await connectDB();
    res.json({
      database: "Connected",
      provider: "Supabase",
      supabaseUrl: process.env.SUPABASE_URL ? "Set" : "Missing",
      supabaseKey: (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY) ? "Set" : "Missing",
    });
  } catch (error) {
    res.status(503).json({ error: isProd ? "Service unavailable" : error.message });
  }
});

app.use("/api/cars", requireDatabase, CarRoutes);

// 404 handler — must come after all routes
app.use((req, res) => {
  res.status(404).json({ error: "Not found", path: req.originalUrl });
});

// Global error handler — must be last middleware (4 args)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({
    error: isProd ? "Internal server error" : err.message,
  });
});

const startServer = () => {
  app.listen(PORT, () => {
    console.log(`Server started on PORT: ${PORT} [${process.env.NODE_ENV || "development"}]`);
  });
};

if (process.env.VERCEL !== "1" && process.env.NODE_ENV !== "test") {
  startServer();
}

export default app;
