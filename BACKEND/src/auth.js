import crypto from "crypto";

const TOKEN_TTL_SECONDS = 60 * 60 * 8; // 8 hours
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// In-memory sliding window lockout tracker: ip -> { attempts, lockUntil }
const loginAttempts = new Map();

const getClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  return forwarded ? forwarded.split(",")[0].trim() : req.socket?.remoteAddress || "unknown";
};

const checkRateLimit = (ip) => {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record) return { allowed: true };

  if (record.lockUntil && record.lockUntil > now) {
    const remainingSeconds = Math.ceil((record.lockUntil - now) / 1000);
    return { allowed: false, remainingSeconds };
  }

  if (record.lockUntil && record.lockUntil <= now) {
    loginAttempts.delete(ip);
    return { allowed: true };
  }

  return { allowed: true, attempts: record.attempts };
};

const recordFailedAttempt = (ip) => {
  const now = Date.now();
  const record = loginAttempts.get(ip) || { attempts: 0, lockUntil: 0 };
  record.attempts += 1;

  if (record.attempts >= MAX_FAILED_ATTEMPTS) {
    record.lockUntil = now + LOCKOUT_DURATION_MS;
  }

  loginAttempts.set(ip, record);
  return record;
};

const recordSuccessfulLogin = (ip) => {
  loginAttempts.delete(ip);
};

const base64UrlEncode = (value) =>
  Buffer.from(JSON.stringify(value)).toString("base64url");

const sign = (value) =>
  crypto
    .createHmac("sha256", getAuthSecret())
    .update(value)
    .digest("base64url");

const getAuthSecret = () => {
  return (
    process.env.ADMIN_TOKEN_SECRET ||
    process.env.JWT_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "blueseal-default-token-secret-key-2026"
  );
};

const getAdminUsername = () => process.env.ADMIN_USERNAME || "admin";

const getAdminPassword = () => process.env.ADMIN_PASSWORD || "admin123bmm";

const safeCompare = (left, right) => {
  if (typeof left !== "string" || typeof right !== "string") {
    return false;
  }

  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

export function createToken(username) {
  const payload = {
    sub: username,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  };
  const encodedPayload = base64UrlEncode(payload);

  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifyToken(token) {
  if (!token || !token.includes(".")) {
    return null;
  }

  const parts = token.split(".");

  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return null;
  }

  const [encodedPayload, signature] = parts;
  const expectedSignature = sign(encodedPayload);

  if (!safeCompare(signature, expectedSignature)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));

    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch (error) {
    return null;
  }
}

export async function loginAdmin(req, res) {
  const ip = getClientIp(req);
  const rateLimitStatus = checkRateLimit(ip);

  if (!rateLimitStatus.allowed) {
    res.setHeader("Retry-After", rateLimitStatus.remainingSeconds);
    return res.status(429).json({
      message: `Too many failed login attempts. Account locked for security. Please try again in ${Math.ceil(rateLimitStatus.remainingSeconds / 60)} minutes.`,
      lockout: true,
      retryAfterSeconds: rateLimitStatus.remainingSeconds,
    });
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (e) {
      body = {};
    }
  }

  const { username = "", password = "" } = body || {};
  const adminPassword = getAdminPassword();

  if (!adminPassword) {
    return res.status(503).json({ message: "Admin login is not configured" });
  }

  const cleanUser = String(username).trim();
  const cleanPass = String(password);

  const isValidUser = safeCompare(cleanUser.toLowerCase(), getAdminUsername().toLowerCase()) || safeCompare(cleanUser.toLowerCase(), "blueseal");
  const isValidPass = safeCompare(cleanPass, adminPassword);

  if (isValidUser && isValidPass) {
    recordSuccessfulLogin(ip);
    return res.status(200).json({ 
      token: createToken(cleanUser),
      expiresIn: TOKEN_TTL_SECONDS,
      message: "Authentication successful"
    });
  }

  // Record failed attempt
  const failure = recordFailedAttempt(ip);
  const remaining = Math.max(0, MAX_FAILED_ATTEMPTS - failure.attempts);

  // Artificial mitigation delay against timing attacks
  await new Promise((r) => setTimeout(r, 450));

  if (failure.lockUntil > Date.now()) {
    const retrySecs = Math.ceil((failure.lockUntil - Date.now()) / 1000);
    res.setHeader("Retry-After", retrySecs);
    return res.status(429).json({
      message: `Too many failed login attempts. Account temporarily locked for 15 minutes.`,
      lockout: true,
      retryAfterSeconds: retrySecs,
    });
  }

  return res.status(401).json({ 
    message: "Invalid username or password",
    remainingAttempts: remaining,
  });
}

export function requireAdmin(req, res, next) {
  const authHeader = (req.get ? req.get("Authorization") : (req.headers?.authorization || req.headers?.Authorization)) || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({ message: "Admin authentication required" });
  }

  req.admin = payload;
  next();
}

export function verifyAdminAuth(req, res) {
  res.status(200).json({
    valid: true,
    user: req.admin.sub,
    expiresAt: req.admin.exp,
  });
}
