# Fenmo

A monorepo for the Fenmo expense tracker app.

## Structure

- `backend/` - Fastify + TypeScript API server
- `frontend/` - Vite + React + TypeScript frontend app

## Run locally

### Backend

```bash
cd backend
npm install
npm run dev
```

The backend runs on `http://localhost:4000` by default.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:3000` by default.

## API

- `GET /expenses` - list expenses
- `POST /expenses` - add a new expense
- `GET /health` - health check

## Notes

- The backend currently persists data using `lowdb` and a local JSON file.
- For deployment, the frontend and backend should be hosted separately, with `VITE_API_BASE_URL` pointing to the backend URL.
