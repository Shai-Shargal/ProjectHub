## ProjectHub – Project Model Plan

### Goal
Add a `Project` domain model so Entity Framework can create a `Projects` table in SQL Server and so the backend can later return **only the logged-in user’s projects** (as required by the assignment).

### Why this is the next step
- The assignment requires **two DB tables**: `Users` and `Projects`.
- The Info screen depends on a **projects list** with fields like score, duration, bugs, and deadline.
- The backend must expose a **Projects endpoint** that returns projects for the authenticated user.

---

### Data requirements (from the assignment)
The projects table must support displaying:
- **Project Name**
- **Score**
- **Duration In Days**
- **Bugs Count**
- **Made Deadline** (boolean)

The DB requirements mention example fields:
- `Id`
- `UserId`
- `Name`
- `Score`
- `DurationInDays`
- `BugsCount`
- `MadeDeadline`

---

### Proposed model (EF Core entity)
Create `ProjectHub.Api.Models.Project` with:
- `int Id`
- `int UserId`
- `string Name`
- `int Score`
- `int DurationInDays`
- `int BugsCount`
- `bool MadeDeadline`

### One-to-many relationship (User -> Projects)
Model the relationship as:
- A **User can have many Projects**
- Each **Project belongs to one User**

Add navigation properties in both entities:
- In `User`: `ICollection<Project> Projects`
- In `Project`: `User User`

Entity Framework will automatically create a **foreign key relationship** using `Project.UserId` → `User.Id`.
This forms a **one-to-many** relationship: one `User` row is referenced by many `Project` rows.

#### Short code examples (navigation properties)
```csharp
// User entity
public class User
{
    public int Id { get; set; }
    // ... other fields ...
    public ICollection<Project> Projects { get; set; } = new List<Project>();
}
```

```csharp
// Project entity
public class Project
{
    public int Id { get; set; }
    public int UserId { get; set; }
    // ... other fields ...
    public User User { get; set; } = null!;
}
```

---

### DbContext updates
Update `ProjectHubDbContext`:
- Add `DbSet<Project> Projects`
- Ensure the correct `using` exists for the `Project` model namespace.

---

### Migration plan
After adding the model and DbSet:
- Create a new migration (e.g. `AddProjectsTable`)
- Apply it to SQL Server to create the `Projects` table in `ProjectHubDb`

Expected outcome:
- A new `Projects` table exists with the required columns.
- `UserId` links each project row to a user.

---

### Seeding plan (required by assignment)
On server startup, seed:
- At least **2 users**
- **Several projects per user**

Notes:
- Seeding should be idempotent: don’t duplicate rows each time the server starts.
- Seed data should include a mix of:
  - scores below 70 (to test red UI)
  - scores above 90 (to test green UI)
  - a mix of `MadeDeadline = true/false`

---

### API plan (later step, depends on this model)
Implement a Projects endpoint that:
- Reads the **token from request headers**
- Resolves the current user
- Returns **only** that user’s projects

This requires the `Projects` table and `UserId` linkage to exist first.

