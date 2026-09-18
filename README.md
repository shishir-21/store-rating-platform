# StoreScore

A full-stack store rating platform built for the FullStack Intern Coding Challenge.

Users can register, log in, browse stores, and submit ratings from 1 to 5. The application uses role-based access for Administrators, Normal Users, and Store Owners.

## Live Demo

**Frontend:** https://store-rating-platform-client-nnw18tvez-shishir-21s-projects.vercel.app/

**Backend API:** https://store-score-api.onrender.com

**Health Check:** https://store-score-api.onrender.com/api/health


## Demo Accounts

All demo accounts use this Password:
```bash
Welcome!1
```

Administrator
```bash
admin@storescore.test
```

Normal User
```bash
user@storescore.test
```

Store Owner
```bash
owner@storescore.test
```

## Tech Stack

- **Frontend:** React.js, Vite, CSS
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL
- **Authentication:** JWT + bcryptjs

## Features

### System Administrator
- Dashboard with total users, stores, and ratings
- Add users and stores
- Create Admin, Normal User, and Store Owner accounts
- Search, filter, and sort users
- Search and sort stores
- View user details and Store Owner ratings

### Normal User
- Sign up and log in
- View and search stores
- Submit ratings from 1–5
- Update submitted ratings
- Update password
- Log out

### Store Owner
- Log in
- View store average rating
- View users who submitted ratings
- View submitted ratings
- Sort rating records
- Update password
- Log out

## Validation

- Name: 20–60 characters
- Address: Maximum 400 characters
- Password: 8–16 characters
- Password must contain an uppercase letter and special character
- Standard email validation
- Rating: 1–5

## Project Structure

```text
store-rating-platform/
├── client/        # React + Vite frontend
├── server/        # Express backend
├── README.md
└── .gitignore
```

## Getting Started

1. Clone Repository
```bash
git clone https://github.com/shishir-21/store-rating-platform.git
cd store-rating-platform
```

2. Install Dependencies
Frontend:
```bash
cd client
npm install
```

Backend:
```bash
cd ../server
npm install
```

3. Environment Variables

Create server/.env:
```bash
PORT=4000
NODE_ENV=development
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_secure_random_secret
FRONTEND_URL=http://localhost:5173
```

4. Setup Database

Run migrations:
```bash
npm --prefix server run migrate
```

Seed demo data:
```bash
npm --prefix server run seed
```

5. Run Application

Backend:
```bash
cd server
npm start
```

Frontend:
```bash
cd client
npm run dev
```

Frontend: http://localhost:5173
Backend: http://localhost:4000

## API

Main API routes:
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
PATCH  /api/auth/password

GET    /api/stores
PUT    /api/stores/:storeId/rating

GET    /api/admin/stats
GET    /api/admin/users
POST   /api/admin/users
GET    /api/admin/users/:id
POST   /api/admin/stores

GET    /api/owner/dashboard
```

## Database

The database contains three main tables:
```
users
stores
ratings
```

The database uses:

UUID primary keys
Foreign keys
Unique constraints
Rating constraints
Indexes
Parameterized SQL queries

## Production

The application is prepared for deployment using:
```
Frontend  → Vercel
Backend   → Render
Database  → Neon PostgreSQL
```

Production configuration supports JWT authentication, CORS protection, PostgreSQL SSL, and environment-based secrets.

## Author

Shishir Mahato
Full Stack Developer
