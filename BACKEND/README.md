# Blue Seal Motor Managers (BMM) Backend

Express and Supabase API for Blue Seal Motor Managers Ltd.

## Deploy to Vercel

1. Import the project in Vercel.
2. Set Root Directory to `BACKEND`.
3. Add the required environment variables.
4. Deploy.

## Environment Variables

- `SUPABASE_URL`: Supabase project URL.
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key. Keep this server-side only.
- `SUPABASE_CARS_TABLE`: Optional. Defaults to `cars`.
- `ADMIN_PASSWORD`: Admin panel password.
- `ADMIN_TOKEN_SECRET`: Long random string for signing admin sessions.
- `ADMIN_USERNAME`: Optional. Defaults to `admin`.
- `CORS_ORIGIN`: Frontend URL, for example `https://your-site.netlify.app`.

Use `.env.example` as a template for local development. Do not commit real `.env` files.

## Local Development

```bash
npm install
npm run dev
```

## API

- `GET /`: API status.
- `GET /test-db`: Database configuration and connection status.
- `GET /api/cars`: List cars.
- `POST /api/auth/login`: Admin login.
- `POST /api/cars`: Create car. Requires admin token.
- `PUT /api/cars/:id`: Update car. Requires admin token.
- `DELETE /api/cars/:id`: Delete car. Requires admin token.
