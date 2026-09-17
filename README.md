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
