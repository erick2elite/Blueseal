import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from './server.js';
import connectDB from './config/db.js';

// Mock the database connection to avoid actual Supabase calls during basic route tests
vi.mock('./config/db.js', () => ({
  default: vi.fn().mockResolvedValue(true)
}));

describe('Blue Seal Backend API', () => {
  it('should return API status on GET /', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Blue Seal Motor Managers API is running!');
    expect(res.body.endpoints).toContain('/api/cars');
  });

  it('should return connected status on GET /test-db', async () => {
    const res = await request(app).get('/test-db');
    expect(res.status).toBe(200);
    expect(res.body.database).toBe('Connected');
    expect(connectDB).toHaveBeenCalled();
  });
});
