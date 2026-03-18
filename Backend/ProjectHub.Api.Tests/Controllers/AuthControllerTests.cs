using System;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using ProjectHub.Api.Controllers;
using ProjectHub.Api.DTOs;
using ProjectHub.Api.Services;
using Xunit;

namespace ProjectHub.Api.Tests.Controllers;

public class AuthControllerTests
{
    private static string? GetAnonymousMessage(object value)
    {
        return value.GetType().GetProperty("message")?.GetValue(value) as string;
    }

    [Fact]
    public void Register_returnsBadRequest_ifEmailOrPasswordMissing()
    {
        var authService = new Mock<IAuthService>();
        var sut = new AuthController(authService.Object);
        sut.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };

        var request = new RegisterRequest { Email = "", Password = "Password123" };
        var result = sut.Register(request);

        result.Result.Should().BeOfType<BadRequestObjectResult>();
        var badRequest = (BadRequestObjectResult)result.Result!;

        GetAnonymousMessage(badRequest.Value!).Should().Be("Email and password are required");
    }

    [Fact]
    public void Register_returnsBadRequest_ifPasswordComplexityFails()
    {
        var authService = new Mock<IAuthService>();
        var sut = new AuthController(authService.Object);
        sut.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };

        // Fails length check (must be at least 8).
        var request = new RegisterRequest { Email = "a@test.com", Password = "Aa1aaaa" };
        var result = sut.Register(request);

        result.Result.Should().BeOfType<BadRequestObjectResult>();
        var badRequest = (BadRequestObjectResult)result.Result!;

        GetAnonymousMessage(badRequest.Value!).Should().Be("Password must be at least 8 characters long.");

        authService.Verify(s => s.Register(It.IsAny<RegisterRequest>()), Times.Never);
    }

    [Fact]
    public void Register_returnsConflict_ifEmailAlreadyExists()
    {
        var authService = new Mock<IAuthService>();
        authService
            .Setup(s => s.Register(It.IsAny<RegisterRequest>()))
            .Returns((RegisterResponse?)null);

        var sut = new AuthController(authService.Object);
        sut.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };

        var request = new RegisterRequest
        {
            Email = "a@test.com",
            Password = "Password123",
            Name = "Existing User",
            Team = "General",
            Avatar = "https://example.com/avatar.png"
        };
        var result = sut.Register(request);

        result.Result.Should().BeOfType<ConflictObjectResult>();
        var conflict = (ConflictObjectResult)result.Result!;

        GetAnonymousMessage(conflict.Value!).Should().Be("Email already exists");
    }

    [Fact]
    public void Register_returnsOk_onHappyPath()
    {
        var authService = new Mock<IAuthService>();
        var response = new RegisterResponse
        {
            Token = "1",
            UserId = 1,
            Email = "a@test.com",
            PersonalDetails = new PersonalDetailsDto
            {
                Name = "New User",
                Team = "General",
                JoinedDate = new DateTime(2020, 1, 1),
                Avatar = string.Empty
            }
        };

        authService
            .Setup(s => s.Register(It.IsAny<RegisterRequest>()))
            .Returns(response);

        var sut = new AuthController(authService.Object);
        sut.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };

        var request = new RegisterRequest
        {
            Email = "a@test.com",
            Password = "Password123",
            Name = "New User",
            Team = "General",
            Avatar = string.Empty
        };
        var result = sut.Register(request);

        result.Result.Should().BeOfType<OkObjectResult>();
        var ok = (OkObjectResult)result.Result!;

        ok.Value.Should().BeEquivalentTo(response);
    }

    [Fact]
    public void Login_returnsUnauthorized_ifCredentialsInvalid()
    {
        var authService = new Mock<IAuthService>();
        authService
            .Setup(s => s.Login(It.IsAny<LoginRequest>()))
            .Returns((LoginResponse?)null);

        var sut = new AuthController(authService.Object);
        sut.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };

        var request = new LoginRequest { Email = "a@test.com", Password = "WrongPassword123" };
        var result = sut.Login(request);

        result.Result.Should().BeOfType<UnauthorizedObjectResult>();
        var unauthorized = (UnauthorizedObjectResult)result.Result!;

        GetAnonymousMessage(unauthorized.Value!).Should().Be("Invalid email or password");
    }

    [Fact]
    public void Login_returnsOk_onHappyPath()
    {
        var authService = new Mock<IAuthService>();
        var response = new LoginResponse
        {
            Token = "1",
            PersonalDetails = new PersonalDetailsDto
            {
                Name = "Test User",
                Team = "Engineering",
                JoinedDate = new DateTime(2020, 1, 15),
                Avatar = string.Empty
            }
        };

        authService
            .Setup(s => s.Login(It.IsAny<LoginRequest>()))
            .Returns(response);

        var sut = new AuthController(authService.Object);
        sut.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };

        var request = new LoginRequest { Email = "user@test.com", Password = "Password123" };
        var result = sut.Login(request);

        result.Result.Should().BeOfType<OkObjectResult>();
        var ok = (OkObjectResult)result.Result!;

        ok.Value.Should().BeEquivalentTo(response);
    }
}

