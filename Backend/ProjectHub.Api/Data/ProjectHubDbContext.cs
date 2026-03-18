using Microsoft.EntityFrameworkCore;
using ProjectHub.Api.Models;

namespace ProjectHub.Api.Data;

public class ProjectHubDbContext : DbContext
{
    public ProjectHubDbContext(DbContextOptions<ProjectHubDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users { get; set; }

    public DbSet<Project> Projects { get; set; }
}
