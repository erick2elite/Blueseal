# Blue Seal Motor Managers Ltd (BMM) - Deployment Guide

This repo contains the React frontend and Express/Supabase backend for Blue Seal Motor Managers Ltd (BMM).

## Backend

Deploy the `BACKEND` folder as the backend service.

Required environment variables:

- `SUPABASE_URL`: Supabase project URL.
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key. Keep this server-side only.
- `SUPABASE_CARS_TABLE`: Optional. Defaults to `cars`.
- `ADMIN_PASSWORD`: Password for the admin panel.
- `ADMIN_TOKEN_SECRET`: Long random string used to sign admin sessions.
- `ADMIN_USERNAME`: Optional. Defaults to `admin`.
- `CORS_ORIGIN`: Frontend URL. Use a comma-separated list for multiple origins.

Create this table in Supabase before starting the backend. The SQL is tracked in:

- `supabase/migrations/20260706090000_create_cars_table.sql`

You can apply it from the Supabase SQL editor, or with the Supabase CLI after linking the project:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

The migration creates the `public.cars` table, enables RLS, adds useful indexes, and keeps `updated_at` current with a trigger.

Recommended Vercel settings:

- Root Directory: `BACKEND`
- Install Command: `npm install`
- Build Command: `npm run build`

For Render or another Node server host, use:

- Build Command: `npm install`
- Start Command: `npm start`

## Frontend

Deploy the `FRONTEND` folder as the frontend app. The existing `netlify.toml` is already configured for this.

Required environment variable:

- `REACT_APP_API_URL`: The deployed backend URL, for example `https://your-backend.vercel.app`.

If this variable is missing, the frontend falls back to `http://localhost:3000` for local development.
Always set `REACT_APP_API_URL` in production so the deployed frontend talks to the deployed backend.

Recommended Netlify settings:

- Base directory: `FRONTEND`
- Build command: `npm run build`
- Publish directory: `FRONTEND/build`

## Local Development

Backend:

```bash
cd BACKEND
npm install
npm run dev
```

Frontend:

```bash
cd FRONTEND
npm install
npm start
```

Use `.env.example` files as templates. Do not commit real `.env` files.
