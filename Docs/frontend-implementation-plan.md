# ProjectHub – Angular Frontend Implementation Plan

## Goal
Implement an Angular (TypeScript) frontend for the already-finished .NET Web API (Swagger-verified). The client must support:
- Authentication (Login + Register)
- An authenticated projects info screen at `/info`

Backend endpoints used:
- `POST /api/auth/login` → `{ token, personalDetails }`
- `POST /api/auth/register` → `{ token, personalDetails }`
- `GET /api/projects` → authenticated user’s projects

Token header requirement:
- `Authorization: Bearer <token>`

## Scope / Screens
- `/login`: Email + Password login, validation, loading + error states, register option
- `/register`: Create account (Name, Email, Password, Team, Avatar) with validation + backend integration
- `/info`: User Card + Projects Table + Stats above the table (computed from currently visible filtered rows)

---

## Assumptions (confirm if needed)
- `personalDetails` response contains: `name`, `team`, `joinedDate` (datetime), `avatar`.
- Project objects returned from `GET /api/projects` map to UI fields:
  - `name`, `score`, `durationInDays`, `bugsCount`, `madeDeadline` (boolean)
- The projects endpoint requires the `Authorization` header and returns only the logged-in user’s projects.

If your backend uses different property casing (e.g., `duration_in_days`), map it in the frontend model layer.

---

## 1) Angular Project Folder Structure
Recommended structure (feature-based):

```text
src/
  app/
    core/
      services/
        auth.service.ts
        project.service.ts
        storage.service.ts (optional)
      interceptors/ (optional)
        auth.interceptor.ts
      guards/ (optional)
        auth.guard.ts
    shared/
      models/
        auth.models.ts
        project.models.ts
    features/
      auth/
        components/
          login/
            login.component.ts
            login.component.html
            login.component.scss
          register/
            register.component.ts
            register.component.html
            register.component.scss
      info/
        components/
          info/
            info.component.ts
            info.component.html
            info.component.scss
    app.routes.ts
    app.component.ts
```

If you prefer a flat structure, keep the “feature folders” but reduce subfolders (the important part is separating `core/` services from `features/` components).

---

## 2) Components to Create
### LoginComponent (`/login`)
UI elements:
- `Email` input
- `Password` input
- `Login` button
- Loading indicator
- Error message area
- “Create Account / Register” option → navigates to `/register`

Behavior:
- Disable Login button when the form is invalid
- On submit:
  - show loading indicator
  - call `AuthService.login(email, password)`
  - on success:
    - store token + personalDetails
    - navigate to `/info`
  - on failure:
    - show error message (invalid credentials, network error, etc.)

Validation:
- Email must be valid format
- Password rules:
  - at least 8 characters
  - at least one digit
  - at least one uppercase letter

### RegisterComponent (`/register`)
UI elements:
- `Name` input
- `Email` input
- `Password` input
- `Team` input
- `Avatar` input
- `Create Account` button (or `Register` submit button)
- Loading indicator
- Error message area

Behavior:
- Validate fields on change/submit
- On submit:
  - call `AuthService.register({ name, email, password, team, avatar })`
  - on success:
    - if backend returns `token` and `personalDetails`:
      - store token + personalDetails
      - navigate to `/info` (preferred)
    - if backend does NOT return them:
      - redirect to `/login` after successful registration

Backend validation errors:
- If backend rejects (e.g., email must be unique), show returned error text in the error message area.

### InfoComponent (`/info`)
Structure:
1. User Card
   - Name
   - Team
   - Joined Date
   - Avatar
2. Projects Table
   - Columns:
     - Project Name
     - Score
     - Duration In Days
     - Bugs Count
     - Made Deadline
   - Sorting + Filtering
3. Stats Above Table (must use only currently visible filtered rows)
   - Average project score
   - Percentage of projects that met the deadline

---

## 3) Angular Services to Implement
### AuthService (`src/app/core/services/auth.service.ts`)
Responsibilities:
- `login(email, password)`:
  - `POST /api/auth/login`
  - store `{ token, personalDetails }` on success
- `register(payload)`:
  - `POST /api/auth/register`
  - store `{ token, personalDetails }` on success
- Provide accessors:
  - `getToken()`
  - `getPersonalDetails()`
  - `isAuthenticated()`
  - `logout()` (optional)

### ProjectService (`src/app/core/services/project.service.ts`)
Responsibilities:
- `getProjects()`:
  - `GET /api/projects`
  - attach `Authorization: Bearer <token>`
  - return projects array

Optional:
- Expose `loading` and `error` as Observables/Signals for consistent UI state handling.

---

## 4) Routing Structure
Routes:
- `/login` → `LoginComponent`
- `/register` → `RegisterComponent`
- `/info` → `InfoComponent`
- Default redirect:
  - `''` → `/login`
  - (optional) if already authenticated, redirect to `/info`

Optional improvement:
### AuthGuard (protect `/info`)
- If `!authService.isAuthenticated()`, redirect to `/login`.

---

## 5) Token Storage Strategy
Recommended:
- Store token in `localStorage` (so `/info` survives browser refresh).
- Store `personalDetails` as well (so the user card renders instantly).

Keys (examples):
- `projecthub_token`
- `projecthub_personalDetails`

Optional:
- Use `sessionStorage` if persistence across browser restarts is not desired.

---

## 6) API Communication Strategy
Use Angular `HttpClient` with a configured base URL.

Default approach (fastest):
- Attach the `Authorization` header inside:
  - `AuthService` (optional; mainly not needed)
  - `ProjectService.getProjects()` (required)

Optional cleaner approach:
### AuthInterceptor
- Automatically attach `Authorization: Bearer <token>` to requests to `/api/*`
- Centralize 401 handling (optional).

Error handling expectations:
- Components show user-friendly messages for:
  - invalid email/password format (client-side)
  - backend validation errors (server-side)
  - network errors

---

## Required Angular Imports / Dependencies
Main (non-standalone Angular) modules/components:
- `HttpClient` / `HttpClientModule` (or `provideHttpClient` for standalone setups)
- `ReactiveFormsModule`
- `RouterModule` (and `RouterOutlet` in templates)
- `CommonModule`

If Angular Material is used:
- `MatTableModule`
- `MatSortModule`
- `MatInputModule`
- `MatButtonModule`
- `MatProgressSpinnerModule`
- `MatCardModule`
- (often needed) `BrowserAnimationsModule`

---

## 7) Table Implementation Approach (Sorting + Filtering)
Recommended implementation:
- Use Angular Material if allowed:
  - `MatTable`, `MatSort`, and optionally `MatPaginator`
- Otherwise:
  - implement a simple table driven by component state:
    - `projects` (raw list from API)
    - `filteredProjects` (after filter)
    - sorting applied to `filteredProjects`

Keep a clear data pipeline:
1. Load raw projects
2. Apply filtering → `filteredProjects`
3. Apply sorting → `sortedFilteredProjects` (display array)
4. Render table from that display array

---

## 8) Filtering and Sorting Logic
Filtering (minimum viable UX):
- Filter by Project Name (text input)
- Optional: Filter by Made Deadline (dropdown All/Yes/No)

Sorting:
- Sort by each column using UI controls:
  - Project Name
  - Score
  - Duration In Days
  - Bugs Count
  - Made Deadline

---

## 9) Score Color Rules
For each row’s Score cell background:
- If `score < 70` → red background
- If `score > 90` → green background
- Else → neutral/default background

Implementation idea:
- `ngClass` (or conditional style) based on `project.score`.

---

## 10) Statistics Above Table (Filtered Rows Only)
Define:
- `visibleFilteredRows` = the rows used by the table *after filtering*.

If you do NOT add pagination:
- `visibleFilteredRows` = `filteredProjects` (after filtering, before slicing)

If you DO add pagination later:
- `visibleFilteredRows` = rows currently on the active page (filtered + paginated slice)

Compute using only `visibleFilteredRows`:
- `averageScore`:
  - if empty → `0`
  - else → sum(score) / count
- `percentageMetDeadline`:
  - if empty → `0`
  - else → (count(madeDeadline === true) / count) * 100

Recompute stats whenever:
- projects list changes
- filter inputs change
- pagination changes (if added)

---

## 11) TypeScript Models (interfaces)
Use interfaces to keep request/response shapes consistent with backend:

```ts
// src/app/shared/models/auth.models.ts
export interface PersonalDetails {
  name: string;
  team: string;
  joinedDate: string; // datetime from backend; parse/format in UI
  avatar: string;
}

export interface AuthResponse {
  token: string;
  personalDetails: PersonalDetails;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  team: string;
  avatar: string;
}
```

```ts
// src/app/shared/models/project.models.ts
export interface Project {
  name: string;
  score: number;
  durationInDays: number;
  bugsCount: number;
  madeDeadline: boolean;
}
```

---

## 12) Validation Rules (Recommended Angular Validators)
Email:
- Use Angular’s built-in `Validators.email`.

Password:
- Use a regex validator:
  - Minimum 8 characters
  - At least one digit
  - At least one uppercase letter

Regex:
```txt
^(?=.*\d)(?=.*[A-Z]).{8,}$
```

Apply the same password validator to both Login and Register forms.

---

## Recommended Development Order (End-to-End Fast)
1. Create Angular app + add routing skeleton for `/login`, `/register`, `/info`
2. Add shared models (`auth.models.ts`, `project.models.ts`)
3. Implement `AuthService.login()`:
   - POST `/api/auth/login`
   - store token + personalDetails
4. Implement `LoginComponent`:
   - reactive form + validation
   - login loading + error
   - on success navigate to `/info`
5. Implement `AuthService.register()`:
   - POST `/api/auth/register`
   - store token + personalDetails
6. Implement `RegisterComponent`:
   - reactive form + validation
   - loading + error
   - on success navigate to `/info` (or redirect to `/login`)
7. Implement `ProjectService.getProjects()`:
   - attach `Authorization: Bearer <token>`
8. Implement `InfoComponent`:
   - load and render User Card from stored `personalDetails`
   - load and render projects
9. Implement Projects table UI:
   - sorting + filtering
   - score color rules
10. Implement stats above table:
   - compute from `visibleFilteredRows` only
11. Optional improvements:
   - add `AuthInterceptor`
   - add `AuthGuard` for `/info`
   - refactor loading/error handling into a shared pattern (signals/observables)

