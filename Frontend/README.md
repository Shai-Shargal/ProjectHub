# ProjectHub Frontend (Angular)

This frontend is a small Angular application for:
- `login` / `register`
- a protected dashboard at `/info`
- authenticated CRUD of "projects" (create/edit/delete) plus filtering/sorting/stats in the UI

## How authentication works

1. `AuthService` calls the backend:
   - `POST /api/auth/login`
   - `POST /api/auth/register`
2. The backend returns:
   - `token` (this repo uses an assignment token)
   - `personalDetails`
3. The frontend stores session state in `localStorage`:
   - token in `projecthub_token`
   - personal details in `projecthub_personalDetails`
4. The `/info` route is protected by `authGuard`, which checks whether the token exists.

## App structure (what each part is responsible for)

### Routing
- `src/app/app.routes.ts`: defines routes:
  - `/login` -> `LoginComponent`
  - `/register` -> `RegisterComponent`
  - `/info` -> `InfoComponent` (guarded)

### Route guard
- `src/app/core/guards/auth.guard.ts`: `CanActivateFn` that returns `true` when `AuthService.isAuthenticated()` is true; otherwise it redirects to `/login`.

### Core services
- `src/app/core/services/auth.service.ts`
  - implements `login()`, `register()`, `logout()`
  - manages session persistence (token + personalDetails in `localStorage`)
  - exposes `isAuthenticated()`, `getToken()`, `getPersonalDetails()`
- `src/app/core/services/project.service.ts`
  - calls protected endpoints under `/api/projects`
  - attaches the token using `Authorization: Bearer <token>`
  - normalizes backend responses into the frontend `Project` model

### Features (UI)
- `src/app/features/auth/components/login/login.component.ts`
  - login form + client-side validation
  - calls `AuthService.login()`
  - navigates to `/info` on success
- `src/app/features/auth/components/register/register.component.ts`
  - registration form with `name`, `team`, `avatar`
  - calls `AuthService.register()`
  - redirects to `/info` after successful registration
- `src/app/features/info/components/info/info.component.ts`
  - reads `personalDetails` and renders the user card
  - loads projects via `ProjectService.getProjects()`
  - supports:
    - create project
    - edit existing project
    - delete project
    - table filtering (by name, made deadline)
    - sorting (clickable headers)
    - stats computed from the currently visible filtered rows

### Shared models
- `src/app/shared/models/auth.models.ts`: `LoginRequest`, `AuthResponse`, `PersonalDetails`, `RegisterRequest`
- `src/app/shared/models/project.models.ts`: `Project` + create/update request shapes

## Local development

### Prerequisites
- Node.js + npm

### Run
```bash
cd Frontend
npm install
npm start
```

Open:
- `http://localhost:4200/`

### Backend proxy
During development, the Angular dev server proxies `/api` to the backend:
- `proxy.conf.json` -> `http://localhost:5050`
- `src/environments/environment.ts` keeps `apiBaseUrl` empty so the app uses relative `/api/...` calls.

## Notes

- Password complexity rules are enforced by the backend too (backend is the source of truth).
- Logout clears both `projecthub_token` and `projecthub_personalDetails` and redirects to `/login`.
