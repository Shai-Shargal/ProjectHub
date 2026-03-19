# ProjectHub Backend (ASP.NET Core Web API)

This backend provides the API for the ProjectHub full-stack app:
- user login/register
- token-protected project CRUD (scoped to the authenticated user)
- persistence using SQL Server + Entity Framework Core

## Run locally

### Prerequisites
- .NET 8 SDK
- SQL Server accessible from your machine

### Configure SQL Server
Edit `Backend/ProjectHub.Api/appsettings.json` and set:
- `ConnectionStrings:DefaultConnection` (update `User Id` / `Password`)

### Start the API
From repo root:
```bash
dotnet run --project Backend/ProjectHub.Api
```

Development URL:
- `http://localhost:5050`

On startup the app will:
- apply EF migrations (`db.Database.Migrate()`)
- seed initial data (users + projects) idempotently

Swagger:
- `http://localhost:5050/swagger`

## Authentication (token header)

This repo uses a simple assignment token (not JWT):
- The token value is `User.Id` as a string.
- Send it as:
  - `Authorization: Bearer <token>`

### Endpoints
- `POST /api/auth/login`
  - Body: `LoginRequest { email, password }`
  - Response: `LoginResponse { token, personalDetails }`
- `POST /api/auth/register`
  - Body: `RegisterRequest { name, email, password, team, avatar }`
  - Response: `RegisterResponse { token, userId, email, personalDetails }`

### Password hashing and rules
- Passwords are hashed with PBKDF2 using PBKDF2-HMAC-SHA256.
- Stored format: `base64Salt:base64Hash`.

Backend password complexity rules:
- at least 8 characters
- at least one uppercase English letter (A-Z)
- at least one lowercase English letter (a-z)
- at least one digit (0-9)

### Seeded users (for testing)
- `user@test.com` / `Password123`
- `admin@test.com` / `Password123`

## Projects API (protected)

All `ProjectsController` actions require a valid bearer token. The controller:
- reads `Authorization` header
- extracts the value after `Bearer `
- parses it as an `int userId`
- verifies the user exists

### Endpoints
- `GET /api/projects`
  - returns all projects for the authenticated user
- `GET /api/projects/{id}`
  - returns a single project if it belongs to the authenticated user
- `POST /api/projects`
  - Body: `ProjectCreateRequestDto`
  - The controller sets `request.UserId` from the token before saving
- `PUT /api/projects/{id}`
  - Body: `ProjectUpdateRequestDto`
  - The controller sets `request.UserId` from the token before updating
- `DELETE /api/projects/{id}`
  - deletes only if the project belongs to the authenticated user

## Code structure

- `ProjectHub.Api/Program.cs`
  - DI wiring: controllers + EF Core `ProjectHubDbContext`
  - registers `AuthService` and `ProjectService`
  - runs migrations and seeds data at startup
  - enables Swagger in development
- `ProjectHub.Api/Controllers/`
  - `AuthController`: login/register request validation and response handling
  - `ProjectsController`: projects CRUD + bearer token parsing/validation
- `ProjectHub.Api/Services/`
  - `AuthService`: login/register logic and returns token/personal details DTOs
  - `ProjectService`: CRUD operations scoped to a userId
  - `PasswordHelper`: PBKDF2 hashing/verification and password complexity validation
- `ProjectHub.Api/Data/`
  - `ProjectHubDbContext`: EF Core `DbSet<User>` and `DbSet<Project>`
- `ProjectHub.Api/Models/`
  - `User`: email/passwordHash/name/team/joinedDate/avatar
  - `Project`: belongs to `UserId` and contains score/duration/bugs/madeDeadline
- `ProjectHub.Api/DTOs/`
  - request and response shapes used by controllers
- `ProjectHub.Api/Migrations/`
  - EF Core migrations used by `Database.Migrate()`

## Running tests
From repo root:
```bash
dotnet test Backend/ProjectHub.Api.Tests
```

