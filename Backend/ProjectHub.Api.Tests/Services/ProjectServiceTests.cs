using System;
using System.Collections.Generic;
using System.Linq;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using ProjectHub.Api.Data;
using ProjectHub.Api.DTOs;
using ProjectHub.Api.Models;
using ProjectHub.Api.Services;
using Xunit;

namespace ProjectHub.Api.Tests.Services;

public class ProjectServiceTests
{
    private ProjectHubDbContext CreateDbContext()
    {
        var dbName = $"projects-db-{Guid.NewGuid():N}";
        var options = new DbContextOptionsBuilder<ProjectHubDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;

        return new ProjectHubDbContext(options);
    }

    private static User SeedUser(ProjectHubDbContext db, string email)
    {
        var user = new User
        {
            Email = email,
            PasswordHash = PasswordHelper.HashPassword("Password123"),
            Name = email,
            Team = "Team",
            JoinedDate = new DateTime(2020, 1, 1),
            Avatar = string.Empty
        };

        db.Users.Add(user);
        db.SaveChanges();
        return user;
    }

    [Fact]
    public void Create_succeeds_whenUserExists()
    {
        using var db = CreateDbContext();
        var sut = new ProjectService(db);

        var user = SeedUser(db, "userA@test.com");

        var request = new ProjectCreateRequestDto
        {
            UserId = user.Id,
            Name = "Test Project",
            Score = 80,
            DurationInDays = 10,
            BugsCount = 2,
            MadeDeadline = true
        };

        var created = sut.Create(request);

        created.Should().NotBeNull();
        created!.UserId.Should().Be(user.Id);
        created.Name.Should().Be(request.Name);
        created.Score.Should().Be(request.Score);
        created.DurationInDays.Should().Be(request.DurationInDays);
        created.BugsCount.Should().Be(request.BugsCount);
        created.MadeDeadline.Should().Be(request.MadeDeadline);

        db.Projects.Single(p => p.Id == created.Id).UserId.Should().Be(user.Id);
    }

    [Fact]
    public void Create_returnsNull_whenUserDoesNotExist()
    {
        using var db = CreateDbContext();
        var sut = new ProjectService(db);

        var request = new ProjectCreateRequestDto
        {
            UserId = 999,
            Name = "Should Not Exist",
            Score = 10,
            DurationInDays = 1,
            BugsCount = 0,
            MadeDeadline = false
        };

        var created = sut.Create(request);

        created.Should().BeNull();
    }

    [Fact]
    public void GetAllByUserId_returnsOnlyThatUsersProjects()
    {
        using var db = CreateDbContext();
        var sut = new ProjectService(db);

        var userA = SeedUser(db, "userA@test.com");
        var userB = SeedUser(db, "userB@test.com");

        db.Projects.AddRange(
            new Project
            {
                UserId = userA.Id,
                Name = "A1",
                Score = 50,
                DurationInDays = 5,
                BugsCount = 1,
                MadeDeadline = false
            },
            new Project
            {
                UserId = userA.Id,
                Name = "A2",
                Score = 90,
                DurationInDays = 7,
                BugsCount = 3,
                MadeDeadline = true
            },
            new Project
            {
                UserId = userB.Id,
                Name = "B1",
                Score = 60,
                DurationInDays = 4,
                BugsCount = 2,
                MadeDeadline = false
            }
        );
        db.SaveChanges();

        var projects = sut.GetAllByUserId(userA.Id).ToList();

        projects.Should().NotBeEmpty();
        projects.All(p => p.UserId == userA.Id).Should().BeTrue();
        projects.Select(p => p.Name).Should().BeEquivalentTo(new[] { "A1", "A2" });
    }

    [Fact]
    public void GetByIdForUser_returnsNull_ifProjectDoesNotBelongToUser()
    {
        using var db = CreateDbContext();
        var sut = new ProjectService(db);

        var userA = SeedUser(db, "userA@test.com");
        var userB = SeedUser(db, "userB@test.com");

        var projectB = new Project
        {
            UserId = userB.Id,
            Name = "B1",
            Score = 60,
            DurationInDays = 4,
            BugsCount = 2,
            MadeDeadline = false
        };
        db.Projects.Add(projectB);
        db.SaveChanges();

        var result = sut.GetByIdForUser(projectB.Id, userA.Id);

        result.Should().BeNull();
    }

    [Fact]
    public void UpdateForUser_updatesOnlyWithinOwnership()
    {
        using var db = CreateDbContext();
        var sut = new ProjectService(db);

        var userA = SeedUser(db, "userA@test.com");
        var userB = SeedUser(db, "userB@test.com");

        var projectA = new Project
        {
            UserId = userA.Id,
            Name = "Old",
            Score = 10,
            DurationInDays = 3,
            BugsCount = 1,
            MadeDeadline = false
        };
        db.Projects.Add(projectA);

        var projectB = new Project
        {
            UserId = userB.Id,
            Name = "OtherOld",
            Score = 20,
            DurationInDays = 4,
            BugsCount = 2,
            MadeDeadline = true
        };
        db.Projects.Add(projectB);
        db.SaveChanges();

        var updateRequestForA = new ProjectUpdateRequestDto
        {
            UserId = userA.Id,
            Name = "New",
            Score = 99,
            DurationInDays = 10,
            BugsCount = 0,
            MadeDeadline = true
        };

        var updated = sut.UpdateForUser(projectA.Id, userA.Id, updateRequestForA);

        updated.Should().NotBeNull();
        updated!.Id.Should().Be(projectA.Id);
        updated.Name.Should().Be(updateRequestForA.Name);
        updated.Score.Should().Be(updateRequestForA.Score);
        updated.DurationInDays.Should().Be(updateRequestForA.DurationInDays);
        updated.BugsCount.Should().Be(updateRequestForA.BugsCount);
        updated.MadeDeadline.Should().Be(updateRequestForA.MadeDeadline);

        var updateRequestWrongOwnership = new ProjectUpdateRequestDto
        {
            UserId = userA.Id,
            Name = "ShouldNotApply",
            Score = 1,
            DurationInDays = 1,
            BugsCount = 1,
            MadeDeadline = false
        };

        var updatedWrong = sut.UpdateForUser(projectB.Id, userA.Id, updateRequestWrongOwnership);
        updatedWrong.Should().BeNull();
    }

    [Fact]
    public void DeleteForUser_deletesOnlyWithinOwnership()
    {
        using var db = CreateDbContext();
        var sut = new ProjectService(db);

        var userA = SeedUser(db, "userA@test.com");
        var userB = SeedUser(db, "userB@test.com");

        var projectA = new Project
        {
            UserId = userA.Id,
            Name = "A",
            Score = 40,
            DurationInDays = 5,
            BugsCount = 1,
            MadeDeadline = false
        };
        db.Projects.Add(projectA);

        var projectB = new Project
        {
            UserId = userB.Id,
            Name = "B",
            Score = 50,
            DurationInDays = 6,
            BugsCount = 2,
            MadeDeadline = true
        };
        db.Projects.Add(projectB);
        db.SaveChanges();

        var deletedOwn = sut.DeleteForUser(projectA.Id, userA.Id);
        deletedOwn.Should().BeTrue();
        db.Projects.Any(p => p.Id == projectA.Id).Should().BeFalse();

        var deletedWrong = sut.DeleteForUser(projectB.Id, userA.Id);
        deletedWrong.Should().BeFalse();
        db.Projects.Any(p => p.Id == projectB.Id).Should().BeTrue();
    }
}

