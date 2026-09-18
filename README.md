# Store Ratings Platform

Role-based store-rating platform built with React, Express, and PostgreSQL.

## Setup

1. Install Node.js 20+ and PostgreSQL 14+.
2. Copy `.env.example` to `.env` and set `DATABASE_URL` and `JWT_SECRET`.
3. Create the `store_ratings` database, then run `npm install`, `npm run db:migrate`, and `npm run db:seed`.
4. Run `npm run dev`.

The client runs at `http://localhost:5173` and the API at `http://localhost:4000`.

After seeding, use `admin@storescore.test` / `Welcome!1` for the administrator dashboard.

Also available after seeding: `user@storescore.test` and `owner@storescore.test`, both with password `Welcome!1`.

## Roles

- **Administrator** — dashboard totals, sortable/filterable users and store directory, and creation forms.
- **Normal user** — registration, password changes, searchable stores, and one editable 1–5 rating per store.
- **Store owner** — password changes, average store rating, and the users who rated their store.

## Production Deployment

### Backend Environment Variables
Set the following environment variables on your backend hosting provider (e.g., Render):
- \PORT\: Port for the API to listen on (e.g., \4000\).
- \NODE_ENV\: Set to \production\.
- \DATABASE_URL\: Your PostgreSQL connection string. Ensure your database is configured using this.
- \JWT_SECRET\: A secure random string for signing JWTs.
- \FRONTEND_URL\: The deployed Vercel frontend URL (e.g., \https://YOUR-VERCEL-DOMAIN.vercel.app\). This is used for secure CORS configuration.

### Frontend Environment Variable
Set the following environment variable on your frontend hosting provider (e.g., Vercel):
- \VITE_API_URL\: Points to the deployed backend \/api\ URL (e.g., \https://YOUR-RENDER-BACKEND.onrender.com/api\).
