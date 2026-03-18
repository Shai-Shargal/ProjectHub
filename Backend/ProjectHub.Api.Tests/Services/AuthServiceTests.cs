using System;
using System.Linq;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using ProjectHub.Api.Data;
using ProjectHub.Api.DTOs;
using ProjectHub.Api.Models;
using ProjectHub.Api.Services;
using Xunit;

namespace ProjectHub.Api.Tests.Services;

public class AuthServiceTests
{
    private ProjectHubDbContext CreateDbContext()
    {
        var dbName = $"auth-db-{Guid.NewGuid():N}";
        var options = new DbContextOptionsBuilder<ProjectHubDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;

        return new ProjectHubDbContext(options);
    }

    [Fact]
    public void Register_succeeds_forValidNewUser()
    {
        using var db = CreateDbContext();
        var sut = new AuthService(db);

        var request = new RegisterRequest { Email = "new@test.com", Password = "Password123" };
        var result = sut.Register(request);

        result.Should().NotBeNull();
        result!.UserId.Should().BeGreaterThan(0);

        var user = db.Users.Single(u => u.Id == result.UserId);
        user.Email.Should().Be("new@test.com");

        user.PasswordHash.Should().NotBeNullOrWhiteSpace();
        user.PasswordHash.Should().Contain(":");
        user.PasswordHash.Should().NotContain("Password123");
    }

    [Fact]
    public void Register_storesNormalizedEmail()
    {
        using var db = CreateDbContext();
        var sut = new AuthService(db);

        var request = new RegisterRequest { Email = "  A@Test.com  ", Password = "Password123" };
        var result = sut.Register(request);

        result.Should().NotBeNull();
        result!.Email.Should().Be("a@test.com");

        var user = db.Users.Single(u => u.Id == result.UserId);
        user.Email.Should().Be("a@test.com");
    }

    [Fact]
    public void Register_fails_ifEmailAlreadyExists()
    {
        using var db = CreateDbContext();
        var sut = new AuthService(db);

        db.Users.Add(new User
        {
            Email = "a@test.com",
            PasswordHash = PasswordHelper.HashPassword("Password123"),
            Name = "A",
            Team = "T",
            JoinedDate = new DateTime(2020, 1, 1),
            Avatar = string.Empty
        });
        db.SaveChanges();

        var request = new RegisterRequest { Email = "A@test.com", Password = "Password123" };
        var result = sut.Register(request);

        result.Should().BeNull();
    }

    [Fact]
    public void Login_succeeds_withValidCredentials()
    {
        using var db = CreateDbContext();
        var sut = new AuthService(db);

        var user = new User
        {
            Email = "user@test.com",
            PasswordHash = PasswordHelper.HashPassword("Password123"),
            Name = "Test User",
            Team = "Engineering",
            JoinedDate = new DateTime(2020, 1, 15),
            Avatar = "https://example.com/avatars/test-user.png"
        };
        db.Users.Add(user);
        db.SaveChanges();

        var request = new LoginRequest { Email = "user@test.com", Password = "Password123" };
        var result = sut.Login(request);

        result.Should().NotBeNull();
        result!.Token.Should().Be(user.Id.ToString());

        result.PersonalDetails.Should().NotBeNull();
        result.PersonalDetails.Name.Should().Be(user.Name);
        result.PersonalDetails.Team.Should().Be(user.Team);
        result.PersonalDetails.JoinedDate.Should().Be(user.JoinedDate);
        result.PersonalDetails.Avatar.Should().Be(user.Avatar);
    }

    [Fact]
    public void Login_fails_incorrectPassword()
    {
        using var db = CreateDbContext();
        var sut = new AuthService(db);

        db.Users.Add(new User
        {
            Email = "user@test.com",
            PasswordHash = PasswordHelper.HashPassword("Password123"),
            Name = "Test User",
            Team = "Engineering",
            JoinedDate = new DateTime(2020, 1, 15),
            Avatar = string.Empty
        });
        db.SaveChanges();

        var request = new LoginRequest { Email = "user@test.com", Password = "WrongPassword123" };
        var result = sut.Login(request);

        result.Should().BeNull();
    }

    [Fact]
    public void Login_fails_emailDoesNotExist()
    {
        using var db = CreateDbContext();
        var sut = new AuthService(db);

        var request = new LoginRequest { Email = "missing@test.com", Password = "Password123" };
        var result = sut.Login(request);

        result.Should().BeNull();
    }

    [Fact]
    public void Login_isCaseInsensitiveByEmail()
    {
        using var db = CreateDbContext();
        var sut = new AuthService(db);

        db.Users.Add(new User
        {
            Email = "user@test.com",
            PasswordHash = PasswordHelper.HashPassword("Password123"),
            Name = "Test User",
            Team = "Engineering",
            JoinedDate = new DateTime(2020, 1, 15),
            Avatar = string.Empty
        });
        db.SaveChanges();

        var request = new LoginRequest { Email = "USER@TEST.COM", Password = "Password123" };
        var result = sut.Login(request);

        result.Should().NotBeNull();
        result!.Token.Should().Be(db.Users.Single(u => u.Email == "user@test.com").Id.ToString());
    }
}

