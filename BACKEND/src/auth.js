import crypto from "crypto";

const TOKEN_TTL_SECONDS = 60 * 60 * 8;

const base64UrlEncode = (value) =>
  Buffer.from(JSON.stringify(value)).toString("base64url");

const sign = (value) =>
  crypto
    .createHmac("sha256", getAuthSecret())
    .update(value)
    .digest("base64url");

const getAuthSecret = () => {
  const secret =
    process.env.ADMIN_TOKEN_SECRET ||
    process.env.JWT_SECRET ||
    process.env.ADMIN_PASSWORD;

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Missing ADMIN_TOKEN_SECRET.");
  }

  return "local-development-token-secret";
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

export function loginAdmin(req, res) {
  const { username = "", password = "" } = req.body || {};
  const adminPassword = getAdminPassword();

  if (!adminPassword) {
    return res.status(503).json({ message: "Admin login is not configured" });
  }

  if (
    safeCompare(username, getAdminUsername()) &&
    safeCompare(password, adminPassword)
  ) {
    return res.status(200).json({ token: createToken(username) });
  }

  return res.status(401).json({ message: "Invalid username or password" });
}

export function requireAdmin(req, res, next) {
  const authHeader = req.get("Authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({ message: "Admin authentication required" });
  }

  req.admin = payload;
  next();
}
