## ProjectHub – Home Assignment Plan

### 1. Overview

This document describes the plan for implementing a small full‑stack web application with:

- **Frontend**: Angular + TypeScript  
- **Backend**: .NET Web API  
- **Database**: SQL Server  

The application contains a **Login** screen and an **Info** screen that displays a user card and a projects table with basic analytics.

---

### 2. Functional Requirements

#### 2.1 Login Screen (`/login`)

- **Inputs**
  - **Email**
  - **Password**
- **Actions**
  - **Login button**
- **Validation Rules**
  - **Email**
    - Must be in a valid email format.
  - **Password**
    - Must contain **at least 8 characters**.
    - Must contain **at least one number**.
    - Must contain **at least one uppercase letter**.
- **Form behavior**
  - Login button is **disabled** while the form is invalid.
  - On submit:
    - Send credentials to backend login endpoint.
    - On success:
      - Receive token from API.
      - Persist token on client (e.g. local storage or in‑memory + interceptor).
      - Redirect user to `/info`.
    - On failure:
      - Display a generic error message (e.g. “Invalid email or password”).

#### 2.2 Info Screen (`/info`)

The Info screen is accessible only for authenticated users (token required).

- **Sections**
  - **User Card**
    - Display:
      - **Name**
      - **Team**
      - **Joined date**
      - **Avatar**
  - **Projects Table**
    - Columns:
      - **Project Name**
      - **Score**
      - **Duration In Days**
      - **Bugs Count**
      - **Made Deadline** (boolean / Yes–No)

---

### 3. Projects Table Behavior

- **Sorting**
  - Allow sorting by at least:
    - Project Name
    - Score
    - Duration In Days
    - Bugs Count
    - Made Deadline
  - Clicking a column header toggles ascending/descending.

- **Filtering**
  - Provide simple filtering such as:
    - Text filter on Project Name.
    - Optional filter on “Made Deadline” (e.g. All / Met / Not Met).

- **Visual Rules**
  - **Score < 70** → row or cell has **red background**.
  - **Score > 90** → row or cell has **green background**.
  - Scores between 70 and 90 use default styling.

- **Summary Calculations (Above Table)**
  - **Average score** across all listed projects.
  - **Percentage of projects that met the deadline**:
    - \( \text{percentage} = \frac{\text{# projects with Made Deadline = true}}{\text{total # projects}} \times 100 \)

---

### 4. Non‑Functional Requirements

- **Security**
  - Token‑based authentication (e.g. JWT) returned from login endpoint.
  - Protect `/info` endpoint and page via authorization.
- **Performance**
  - Efficient queries for projects (pagination not strictly required for small dataset but can be considered).
- **Code Quality**
  - Clear separation of layers on backend (controllers, services, data access).
  - Strong typing and interfaces in Angular.

---

### 5. Data Model (High‑Level)

- **Users Table (SQL Server)**
  - `Id` (PK)
  - `Email`
  - `PasswordHash` (and optional `PasswordSalt`)
  - `Name`
  - `Team`
  - `JoinedDate`
  - `AvatarUrl` (optional)

- **Projects Table (SQL Server)**
  - `Id` (PK)
  - `UserId` (FK → Users.Id)
  - `ProjectName`
  - `Score` (numeric, e.g. int)
  - `DurationInDays` (int)
  - `BugsCount` (int)
  - `MadeDeadline` (bit / boolean)

---

### 6. API Endpoints (High‑Level)

- **Authentication**
  - `POST /api/auth/login`
    - Request: `{ email, password }`
    - Response (on success): `{ token, user: { name, team, joinedDate, avatarUrl } }`

- **User Info**
  - `GET /api/users/me`
    - Returns authenticated user details for User Card (if not already included in login response).

- **Projects**
  - `GET /api/projects`
    - Returns list of projects for the current user.
    - May support query parameters for sorting and filtering (or this can be handled client‑side).

All protected endpoints require a valid token (e.g. Authorization header).

---

### 7. Frontend Behavior (Angular)

- **Routing**
  - `/login` → Login component.
  - `/info` → Info component (guarded by AuthGuard using token).

- **State & Services**
  - `AuthService` to handle login, token storage, and user data.
  - `ProjectsService` to fetch projects.
  - HTTP interceptor to attach token to outgoing requests.

- **Components**
  - `LoginComponent`
    - Reactive form with validation rules for email and password.
    - Disable login button while form invalid or while request in progress.
  - `InfoComponent`
    - Uses `UserCardComponent` and `ProjectsTableComponent`.
  - `UserCardComponent`
    - Displays user name, team, joined date, avatar.
  - `ProjectsTableComponent`
    - Displays table with sorting, filtering, and summary calculations above the table.

---

### 8. Development Plan

#### Phase 1 – Backend Setup (.NET Web API)

- Create a new .NET Web API project.
- Set up project structure (controllers, services, repository/data access layer).
- Configure basic middleware (logging, error handling, CORS for Angular app).
- Add configuration for SQL Server connection (connection string, EF Core or Dapper).

#### Phase 2 – Database Setup (Users + Projects Tables)

- Design and create **Users** and **Projects** tables in SQL Server.
- Add EF Core entities and DbContext (or equivalent data access).
- Seed sample data for:
  - At least one user account for testing login.
  - Several projects associated with that user to populate the Info screen.

#### Phase 3 – Authentication (Login Endpoint + Token)

- Implement `POST /api/auth/login`:
  - Validate incoming email and password.
  - Verify password against stored hash.
  - On success, generate authentication token (e.g. JWT) containing user id and basic claims, and return the user details required for the Info screen.
- Configure authentication/authorization middleware in .NET.

#### Phase 4 – Projects Endpoint

- Implement `GET /api/projects` to return projects for the authenticated user.
- Optionally support query parameters for sorting/filtering on backend.
- Ensure endpoint is protected by authorization and returns only the calling user’s projects.

#### Phase 5 – Angular Client

- Scaffold Angular application with routing.
- Implement:
  - `LoginComponent` with reactive form, validation and integration with `AuthService`.
  - `AuthService` + HTTP interceptor for token handling.
  - `InfoComponent`, `UserCardComponent`, and `ProjectsTableComponent`.
- Add sorting, filtering, and visual rules to projects table.
- Implement calculation and display of:
  - Average project score.
  - Percentage of projects that met the deadline.
- Add basic styling for a clean, user‑friendly UI.

---

### 9. Testing & Validation

- **Backend**
  - Unit tests for authentication and projects services (if in scope).
  - Manual tests of login and projects endpoints via Postman/cURL.
- **Frontend**
  - Verify form validation rules for login.
  - Confirm navigation from `/login` to `/info` only on successful login.
  - Check sorting and filtering behavior of table.
  - Verify score‑based coloring and correctness of aggregate calculations.

