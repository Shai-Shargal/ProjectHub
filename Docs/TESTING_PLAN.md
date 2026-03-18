# Testing Plan (Backend / .NET)

This document is a roadmap for the unit tests we will implement for the ASP.NET Core Web API in `Backend/ProjectHub.Api`.

## Goals

- Keep tests **component-focused** (PasswordHelper, AuthService/AuthController, ProjectService/ProjectsController).
- Cover both **happy paths** and **edge cases**.
- Ensure all tests can be executed with a **single command** (one `dotnet test` invocation).

## Test Project Strategy (single command)

- We will create **one test project** inside the repository (example path: `Backend/ProjectHub.Api.Tests`).
- We will split tests across **multiple test files** within that project (as requested), not into multiple test projects.
- Therefore, running:
  - `dotnet test`
  
  from the solution/repo root (or from the test project directory) will execute **all** unit tests.

## Running All Tests

To execute the entire unit test suite with a single command, we will rely on the single-test-project strategy described above.

Common ways to run all tests:

- `dotnet test`
- `dotnet test Backend/ProjectHub.Api.Tests`

Both commands should run **all** test files (PasswordHelperTests, AuthServiceTests, AuthControllerTests, ProjectServiceTests, ProjectsControllerTests) together.

These commands are also suitable for running in CI pipelines (e.g., GitHub Actions or Azure DevOps) where a single test run validates the backend unit test suite.

Example command (e.g., in CI to reduce work):

dotnet test --no-build --verbosity normal

## Test Naming Convention

All unit tests follow a consistent naming pattern to make failures easy to interpret:

`MethodName_ExpectedBehavior_WhenCondition`

Examples:
- `Login_returnsNull_whenPasswordIsIncorrect`
- `Create_returnsNull_whenUserDoesNotExist`
- `GetProjects_returnsUnauthorized_whenTokenMissing`

## Suggested Test Project Structure

The repository should keep backend production code and unit tests cleanly separated. The following structure is suggested (paths are examples):

```text
Backend/
  ProjectHub.Api/
  ProjectHub.Api.Tests/
    Helpers/
      PasswordHelperTests.cs
    Services/
      AuthServiceTests.cs
      ProjectServiceTests.cs
    Controllers/
      AuthControllerTests.cs
      ProjectsControllerTests.cs
```

If you prefer additional organizational folders (e.g., `Fixtures/`), they are allowed as long as all tests remain inside the same test project so `dotnet test` runs everything.

## Test Project Configuration

The test project (`ProjectHub.Api.Tests`) must reference the main API project so that services, controllers, helpers, DTOs, and entities can be imported and tested directly.

Example command:

dotnet add Backend/ProjectHub.Api.Tests reference Backend/ProjectHub.Api

## Test Files We Will Create

### `PasswordHelperTests`
**Responsibility**
- Pure unit tests for password hashing/verification logic.

**Test cases**
- [ ] `HashPassword_returnsSaltHashFormat`
  - **Scenario**: call `HashPassword("AnyPassword123")`.
  - **Checks**
    - returned string contains exactly one `:` separating salt and hash
    - both salt and hash segments are valid Base64
  - **Expected result**
    - returns a string in `base64Salt:base64Hash` format

- [ ] `VerifyPassword_returnsTrue_forCorrectPassword`
  - **Scenario**: generate hash with `HashPassword(password)` then call `VerifyPassword(password, storedHash)`.
  - **Expected result**
    - returns `true`

- [ ] `VerifyPassword_returnsFalse_forWrongPassword`
  - **Scenario**: generate hash with `HashPassword(correctPassword)` then call `VerifyPassword(wrongPassword, storedHash)`.
  - **Expected result**
    - returns `false`

- [ ] `VerifyPassword_returnsFalse_forMalformedStoredHash` (edge-case)
  - **Scenario**: call `VerifyPassword("AnyPassword123", "not-a-valid-format")`.
  - **Expected result**
    - returns `false`

### `AuthServiceTests`
**Responsibility**
- Unit tests for DB-backed authentication + registration flows in `AuthService`.
- Uses an EF Core test context (see “Test Data / EF strategy” below).

**Test cases**
- [ ] `Register_succeeds_forValidNewUser`
  - **Scenario**: DB has no user with the email; call `AuthService.Register` with a valid email/password.
  - **Expected result**
    - returns a non-null `RegisterResponse`
    - user row is created
    - stored `PasswordHash` is not plaintext (it should be in `base64Salt:base64Hash` format)
- [ ] `Register_storesNormalizedEmail` (edge-case)
  - **Scenario**: register with email containing mixed case and surrounding spaces (e.g. `"  A@Test.com  "`).
  - **Expected result**
    - user `Email` in DB is normalized (trimmed + lowercase), and matches the normalized comparison used by `Login`

- [ ] `Register_fails_ifEmailAlreadyExists` (edge-case)
  - **Scenario**: seed DB with user `a@test.com`, attempt register with `A@test.com` (or same email).
  - **Expected result**
    - returns `null`

- [ ] `Login_succeeds_withValidCredentials`
  - **Scenario**: seed DB user with a known hashed password; call `Login` with correct email/password.
  - **Expected result**
    - returns non-null `LoginResponse`
    - `LoginResponse.Token` equals `user.Id.ToString()`
    - `PersonalDetails` matches the user row

- [ ] `Login_fails_incorrectPassword`
  - **Scenario**: seed DB user; call `Login` with correct email but wrong password.
  - **Expected result**
    - returns `null`

- [ ] `Login_fails_emailDoesNotExist`
  - **Scenario**: call `Login` for an email not present in DB.
  - **Expected result**
    - returns `null`

- [ ] `Login_isCaseInsensitiveByEmail` (edge-case that follows our requirements)
  - **Scenario**: seed `email` in normalized form; call `Login` using different casing.
  - **Expected result**
    - behaves like success for correct password

### `AuthControllerTests`
**Responsibility**
- Unit tests for controller behavior and HTTP responses (status codes + response bodies).
- Controller tests should mock service dependencies (`IAuthService`) rather than using a real database.

**Test cases**
- [ ] `Register_returnsBadRequest_ifEmailOrPasswordMissing`
  - **Scenario**: call controller register with missing/blank request fields.
  - **Expected result**
    - `400 BadRequest` with a clear message

- [ ] `Register_returnsBadRequest_ifPasswordComplexityFails`
  - **Scenario**: call register with password that violates at least one rule.
    - less than 8 chars
    - missing uppercase
    - missing lowercase
    - missing digit
  - **Expected result**
    - `400 BadRequest` with the specific complexity error message

- [ ] `Register_returnsConflict_ifEmailAlreadyExists`
  - **Scenario**: mock `IAuthService.Register` to return `null`.
  - **Expected result**
    - `409 Conflict` with message like “Email already exists”

- [ ] `Register_returnsOk_onHappyPath`
  - **Scenario**: mock `IAuthService.Register` to return a valid response.
  - **Expected result**
    - `200 OK` and response body is `RegisterResponse`

- [ ] `Login_returnsUnauthorized_ifCredentialsInvalid`
  - **Scenario**: mock `IAuthService.Login` to return `null` (wrong password or unknown email).
  - **Expected result**
    - `401 Unauthorized`

- [ ] `Login_returnsOk_onHappyPath`
  - **Scenario**: mock `IAuthService.Login` to return a valid `LoginResponse`.
  - **Expected result**
    - `200 OK` with token and personal details

### `ProjectServiceTests`
**Responsibility**
- Unit tests for project persistence + ownership filtering inside `ProjectService`.

**Test cases**
- [ ] `Create_succeeds_whenUserExists`
  - **Scenario**: seed DB with an existing user; call `Create`.
  - **Expected result**
    - returned `ProjectResponseDto` is non-null
    - project is created in DB with correct `UserId` and fields

- [ ] `Create_returnsNull_whenUserDoesNotExist` (covers “invalid data should fail”)
  - **Scenario**: call `Create` with `UserId` that does not exist.
  - **Expected result**
    - returns `null`

- [ ] `GetAllByUserId_returnsOnlyThatUsersProjects`
  - **Scenario**: seed DB with multiple users and projects; call `GetAllByUserId(userId)`.
  - **Expected result**
    - only projects where `Project.UserId == userId` are returned

- [ ] `GetByIdForUser_returnsNull_ifProjectDoesNotBelongToUser`
  - **Scenario**: project exists but for a different user.
  - **Expected result**
    - returns `null`

- [ ] `UpdateForUser_updatesOnlyWithinOwnership`
  - **Scenario**
    - update a project belonging to the user
  - **Expected result**
    - returns updated DTO
  - **And (edge-case)**
    - update a project that belongs to another user
  - **Expected result**
    - returns `null`

- [ ] `DeleteForUser_deletesOnlyWithinOwnership`
  - **Scenario**
    - delete a project belonging to the user
  - **Expected result**
    - returns `true`
  - **And (edge-case)**
    - delete a project belonging to another user
  - **Expected result**
    - returns `false`

### `ProjectsControllerTests`
**Responsibility**
- Unit tests for HTTP endpoints and authorization behavior in `ProjectsController`.
- Uses mocked `IProjectService` to control token validation outcomes and ownership behavior (without a real database).

**Authorization-related test cases**
- [ ] `GetProjects_returnsUnauthorized_whenTokenMissing`
  - **Scenario**: call `GET /api/projects` without `Authorization` header.
  - **Expected result**
    - `401 Unauthorized`

- [ ] `GetProjects_returnsUnauthorized_whenTokenInvalid`
  - **Scenario**: call with `Authorization: Bearer not-a-number` (token must parse as an `int`).
  - **Expected result**
    - `401 Unauthorized`

- [ ] `GetProjects_returnsUnauthorized_whenUserDoesNotExist`
  - **Scenario**: token parses to an integer, but `IProjectService.UserExists(userId)` returns `false`.
  - **Expected result**
    - `401 Unauthorized`

- [ ] `GetProjects_returnsUnauthorized_whenAuthorizationHeaderDoesNotUseBearerPrefix`
  - **Scenario**: call with `Authorization: <token>` (missing `Bearer ` prefix), or `Authorization: Bearer` with no token.
  - **Expected result**
    - `401 Unauthorized`

**Projects access test cases**
- [ ] `UserCanSeeOnlyTheirProjects`
  - **Scenario**: token corresponds to user A; mocked service returns projects for A only.
  - **Expected result**
    - `200 OK` with only A’s projects

- [ ] `UserCannotAccessAnotherUsersProject` (GET by id)
  - **Scenario**: `GET /api/projects/{id}` where project belongs to B; mocked service returns `null`.
  - **Expected result**
    - `404 NotFound`

**Projects creation/update/deletion test cases**
- [ ] `CreateProject_requiresAuth`
  - **Scenario**: missing/invalid token.
  - **Expected result**
    - `401 Unauthorized`

- [ ] `CreateProject_succeeds_whenAuthenticated`
  - **Scenario**: token is valid; mocked service returns created project.
  - **Expected result**
    - `201 Created` and response body is `ProjectResponseDto`

- [ ] `CreateProject_withInvalidData_fails` (edge-case)
  - **Scenario**: token valid, but mocked service returns `null` (e.g., userId invalid / data invalid).
  - **Expected result**
    - `400 BadRequest`

- [ ] `UpdateProject_returnsUnauthorized_whenMissingToken`
  - **Scenario**: missing token.
  - **Expected result**
    - `401 Unauthorized`

- [ ] `UpdateProject_userCannotUpdateAnotherUsersProject`
  - **Scenario**: token for user A; mocked service returns `null` when updating a project owned by B.
  - **Expected result**
    - `404 NotFound`

- [ ] `UpdateProject_returnsNotFound_whenProjectDoesNotExist`
  - **Scenario**: token valid; mocked service returns `null` for unknown id.
  - **Expected result**
    - `404 NotFound`

- [ ] `DeleteProject_returnsUnauthorized_whenMissingToken`
  - **Scenario**: missing token.
  - **Expected result**
    - `401 Unauthorized`

- [ ] `DeleteProject_userCannotDeleteAnotherUsersProject`
  - **Scenario**: token for user A; mocked service returns `false` when project owned by B is targeted.
  - **Expected result**
    - `404 NotFound`

- [ ] `DeleteProject_returnsNotFound_whenProjectDoesNotExist`
  - **Scenario**: token valid; mocked service returns `false` for unknown id.
  - **Expected result**
    - `404 NotFound`

## Test Data / EF Core Strategy

To keep unit tests fast and deterministic, we will avoid hitting the real SQL Server instance.

- For `AuthServiceTests` and `ProjectServiceTests`, we will use an EF Core test provider (e.g. InMemory or SQLite in-memory).
- Tests should **not** connect to the real SQL Server used by the application.
- An in-memory provider (EF Core InMemory) or SQLite in-memory can be used depending on how much query fidelity we want:
  - EF Core InMemory is fast and sufficient for most unit-level ownership/filtering checks.
  - SQLite in-memory can be used when we want closer behavior to relational providers.
- We will seed:
  - Users with normalized emails (trimmed + lowercase)
  - Password hashes produced by the same `PasswordHelper.HashPassword` to ensure VerifyPassword works correctly
  - Projects across multiple users to test ownership filtering

- Test data should be seeded per test (or per isolated test fixture) to prevent cross-test interference and to keep test outcomes deterministic.

## Expected Dependencies (high-level)

We will likely use:
- xUnit (test framework)
- Moq (mocking services in controller tests)
- FluentAssertions (assertion readability)
- Microsoft.EntityFrameworkCore.InMemory (or SQLite in-memory)

(Exact packages will be decided when we create the test project.)

## Test Utilities (Optional)

To keep individual tests concise and reduce duplicated setup code, we may add small helper classes to the test project.

Potential utilities include:
- `TestDbContextFactory` (creates an isolated EF test database per test)
- `TestUserFactory` (generates users with consistent default values)
- `TestProjectFactory` (generates projects with consistent default values)

## Traceability to Required Scenarios Checklist

### Authentication
- [ ] Password hashing returns correct salt:hash format
- [ ] VerifyPassword true for correct password
- [ ] VerifyPassword false for wrong password

- [ ] Register succeeds for a valid new user
- [ ] Register fails if email already exists
- [ ] Register fails if password does not meet complexity rules

- [ ] Login succeeds with valid credentials
- [ ] Login fails with incorrect password
- [ ] Login fails when email does not exist

### Email normalization (polish)
- [ ] Register stores normalized (trimmed + lowercase) email
- [ ] Login is case-insensitive by email

### Authorization (token)
- [ ] Requests without a token return Unauthorized
- [ ] Invalid tokens return Unauthorized
- [ ] Protected endpoints require `Authorization: Bearer <token>`

### Projects (ownership + CRUD rules)
- [ ] Cannot access projects without authentication
- [ ] Cannot create a project before authenticating a user
- [ ] A user can only see their own projects
- [ ] A user cannot access another user's project
- [ ] A user cannot update another user's project
- [ ] A user cannot delete another user's project

### Project validation
- [ ] Creating a project with invalid data should fail
- [ ] Updating a non-existing project should return NotFound
- [ ] Deleting a non-existing project should return NotFound

## Out of Scope for This Phase

This document focuses strictly on **unit tests** for core backend components (helpers, services, and controllers).

Future test phases may include:
- integration tests (e.g., verifying EF Core + SQL Server behavior end-to-end)
- end-to-end API tests (e.g., running the API and validating full request/response flows)
- database migration validation (ensuring migrations apply cleanly and produce the expected schema)

