import { updateCar, deleteCar } from '../../BACKEND/src/Controllers/CarControlers.js';
import { requireAdmin } from '../../BACKEND/src/auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Support both req.query.id and req.params.id
  if (!req.params) req.params = {};
  if (req.query && req.query.id) req.params.id = req.query.id;

  if (req.method === 'PUT' || req.method === 'PATCH') {
    return requireAdmin(req, res, () => updateCar(req, res));
  }

  if (req.method === 'DELETE') {
    return requireAdmin(req, res, () => deleteCar(req, res));
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
