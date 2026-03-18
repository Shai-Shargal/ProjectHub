# ProjectHub (Full Stack Assignment)

Small full-stack app built with **Angular** + **.NET Web API** + **SQL Server**.

## Features
- Login (`/login`)
- Register (`/register`) including `name`, `team`, `avatar`
- Authenticated user dashboard (`/info`)
  - User card (name/team/joined date/avatar)
  - Projects table (sortable + filterable)
  - Stats computed from the currently visible filtered rows
- Backend `token` auth via `Authorization: Bearer <token>` header

## Backend (ASP.NET Core)

### Prerequisites
- .NET 8 SDK
- SQL Server running locally (or accessible from your machine)

### Configure SQL Server connection
Edit `Backend/ProjectHub.Api/appsettings.json`:
- `ConnectionStrings:DefaultConnection`
  - Replace `User Id` / `Password` with your real SQL credentials.

### Run backend
From repo root:
```bash
dotnet run --project Backend/ProjectHub.Api
```

On startup the API will:
- Apply EF migrations (`db.Database.Migrate()`)
- Seed data (2 users + seeded projects per user)

### Seeded users (for testing)
- `user@test.com` / `Password123`
- `admin@test.com` / `Password123`

## Frontend (Angular)

### Prerequisites
- Node.js + npm
- Angular CLI (installed with the project)

### Run frontend
```bash
cd Frontend
npm install
npm start
```

Open:
- `http://localhost:4200/`

## Notes on auth after register
- After a successful registration, the frontend automatically logs in and redirects to `/info`.

