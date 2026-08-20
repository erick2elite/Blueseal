import { getCar, postCar } from '../BACKEND/src/Controllers/CarControlers.js';
import { requireAdmin } from '../BACKEND/src/auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return getCar(req, res);
  }

  if (req.method === 'POST') {
    return requireAdmin(req, res, () => postCar(req, res));
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
