import { loginAdmin } from '../../BACKEND/src/auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    return await loginAdmin(req, res);
  } catch (err) {
    console.error("Error in /api/auth/login handler:", err);
    return res.status(500).json({ message: err.message || "Internal server error" });
  }
}
