using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using ProjectHub.Api.Data;
using ProjectHub.Api.Models;
using ProjectHub.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<ProjectHubDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IAuthService, AuthService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthorization();

app.MapControllers();

// Root endpoint so GET / returns something instead of 404
app.MapGet("/", () => Results.Ok(new { message = "ProjectHub API", docs = "/swagger" }))
    .AllowAnonymous();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ProjectHubDbContext>();
    db.Database.Migrate();
    SeedDatabase(db);
}

app.Run();

static void SeedDatabase(ProjectHubDbContext db)
{
    // Seed users idempotently (by Email).
    var seedUsers = new[]
    {
        new User
        {
            Email = "user@test.com",
            PasswordHash = AuthService.HashPassword("Password123"),
            Name = "Test User",
            Team = "Engineering",
            JoinedDate = new DateTime(2020, 1, 15),
            Avatar = "https://example.com/avatars/test-user.png"
        },
        new User
        {
            Email = "admin@test.com",
            PasswordHash = AuthService.HashPassword("Password123"),
            Name = "Admin User",
            Team = "Operations",
            JoinedDate = new DateTime(2021, 3, 12),
            Avatar = "https://example.com/avatars/admin-user.png"
        }
    };

    foreach (var user in seedUsers)
    {
        if (!db.Users.Any(u => u.Email == user.Email))
        {
            db.Users.Add(user);
        }
    }

    db.SaveChanges();

    var user1 = db.Users.Single(u => u.Email == seedUsers[0].Email);
    var user2 = db.Users.Single(u => u.Email == seedUsers[1].Email);

    // Seed projects idempotently (by UserId + Name).
    var user1Projects = new[]
    {
        new Project { Name = "Fix auth bug", Score = 65, DurationInDays = 20, BugsCount = 7, MadeDeadline = false },
        new Project { Name = "Improve UI polish", Score = 92, DurationInDays = 14, BugsCount = 2, MadeDeadline = true },
        new Project { Name = "API performance pass", Score = 76, DurationInDays = 30, BugsCount = 5, MadeDeadline = false },
        new Project { Name = "Refactor backlog", Score = 98, DurationInDays = 10, BugsCount = 1, MadeDeadline = true },
    };

    foreach (var project in user1Projects)
    {
        if (!db.Projects.Any(p => p.UserId == user1.Id && p.Name == project.Name))
        {
            db.Projects.Add(new Project
            {
                UserId = user1.Id,
                Name = project.Name,
                Score = project.Score,
                DurationInDays = project.DurationInDays,
                BugsCount = project.BugsCount,
                MadeDeadline = project.MadeDeadline
            });
        }
    }

    var user2Projects = new[]
    {
        new Project { Name = "Write docs", Score = 60, DurationInDays = 5, BugsCount = 0, MadeDeadline = true },
        new Project { Name = "Resolve issue #42", Score = 91, DurationInDays = 25, BugsCount = 9, MadeDeadline = false },
        new Project { Name = "QA regression suite", Score = 72, DurationInDays = 18, BugsCount = 4, MadeDeadline = true },
        new Project { Name = "Ship patch", Score = 95, DurationInDays = 12, BugsCount = 3, MadeDeadline = false },
    };

    foreach (var project in user2Projects)
    {
        if (!db.Projects.Any(p => p.UserId == user2.Id && p.Name == project.Name))
        {
            db.Projects.Add(new Project
            {
                UserId = user2.Id,
                Name = project.Name,
                Score = project.Score,
                DurationInDays = project.DurationInDays,
                BugsCount = project.BugsCount,
                MadeDeadline = project.MadeDeadline
            });
        }
    }

    db.SaveChanges();
}

