# ProjectHub

## 1. Project Overview

**ProjectHub** is a small full-stack web application for managing personal projects. It consists of:

| Layer | Technology |
|-------|------------|
| **Frontend** | Angular (SPA) |
| **Backend** | ASP.NET Core Web API (.NET 8) |
| **Database** | Microsoft SQL Server (via Entity Framework Core) |

The API expects a running SQL Server instance. If the database is not reachable at startup, the application will fail—so **start SQL Server before running the backend** (see below for a Docker-based setup that matches the default configuration).

---

## 2. Features

- **Authentication**: Login and register (name, email, password, team, avatar)
- **Protected dashboard** (`/info`): user card with profile details
- **Projects**: Create, read, update, and delete projects
- **Table UX**: Sorting, filtering (by name and deadline), and summary statistics derived from the filtered rows
- **Auth model**: Session token stored client-side; API calls use `Authorization: Bearer <token>`

---

## 3. Quick Start

Run these **in order** from the **repository root** (three terminals, or run SQL Server once and keep it running).

**1. Start SQL Server (Docker)**

```bash
docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=YourStrong!Passw0rd" -p 1433:1433 -d --name projecthub-sql mcr.microsoft.com/mssql/server:2022-latest
```

Wait ~10–20 seconds for the container to be ready before starting the API.

**2. Start the backend**

```bash
dotnet run --project Backend/ProjectHub.Api
```

**3. Start the frontend**

```bash
cd Frontend
npm install
npm start
```

**4. Open the app**

- App: [http://localhost:4200](http://localhost:4200)

---

## 4. Backend Setup

### Prerequisites

- **.NET 8 SDK** — [Download](https://dotnet.microsoft.com/download/dotnet/8.0)
- **Docker** — for running SQL Server as above (recommended). You may use an existing SQL Server instead if you adjust the connection string (see [Connection String](#connection-string)).

### Database Setup (REQUIRED)

The API does **not** bundle SQL Server. You must have a server listening where the connection string points.

**Recommended: SQL Server in Docker** (matches the default `appsettings.json`):

```bash
docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=YourStrong!Passw0rd" -p 1433:1433 -d --name projecthub-sql mcr.microsoft.com/mssql/server:2022-latest
```

| Setting | Value |
|---------|--------|
| **Server** | `localhost,1433` |
| **User** | `sa` |
| **Password** | `YourStrong!Passw0rd` |

- If port `1433` is already in use, map a different host port (e.g. `-p 14333:1433`) and update `Server=localhost,14333` in `Backend/ProjectHub.Api/appsettings.json`.
- To stop/remove the container later: `docker stop projecthub-sql` / `docker rm projecthub-sql`.

### Connection String

The backend reads `ConnectionStrings:DefaultConnection` from `Backend/ProjectHub.Api/appsettings.json`. With the Docker command above, **no change is required**:

```text
Server=localhost,1433;Database=ProjectHubDb;User Id=sa;Password=YourStrong!Passw0rd;TrustServerCertificate=True
```

If you use your own SQL Server instance, edit that value to match your server, database name, and credentials.

### Run Backend

From the **repository root**:

```bash
dotnet run --project Backend/ProjectHub.Api
```

**On startup, the API:**

- Applies EF Core **migrations** automatically (`Database.Migrate()`).
- **Seeds** test users and sample projects (idempotent).

**URLs:**

- API base (default): `http://localhost:5050`
- Swagger (development): `http://localhost:5050/swagger`

### Test Users

| Email | Password |
|-------|----------|
| `user@test.com` | `Password123` |
| `admin@test.com` | `Password123` |

---

## 5. Frontend Setup

### Prerequisites

- **Node.js** (LTS recommended) — includes `npm`

### Run Frontend

From the **repository root**:

```bash
cd Frontend
npm install
npm start
```

The dev server serves the app at **[http://localhost:4200](http://localhost:4200)**.

During development, API requests are proxied to the backend (see `Frontend/proxy.conf.json`; default backend URL `http://localhost:5050`).

---

## 6. Notes

- **After registration**, the app signs you in and redirects to **`/info`** (dashboard).
- **Authorization**: Protected endpoints expect a **Bearer token** in the `Authorization` header (`Authorization: Bearer <token>`). The frontend stores the token after login/register and attaches it to API calls.
