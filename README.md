# JP Store — Full Stack E-commerce Starter

A responsive online shopping platform with separate customer and admin areas.

## Stack
- Frontend: React + Vite + React Router + Axios
- Backend: Node.js + Express
- Database: SQLite via better-sqlite3
- Auth: JWT + bcryptjs
- Uploads: Multer

## Run
```bash
npm install
npm run install:all
npm run dev
```
Open http://localhost:5173

Admin: `admin@jpstore.com` / `admin123`

The app is intentionally configured for local/demo use. Payment endpoints are demo flows; connect a real provider such as Razorpay/Stripe before production.
