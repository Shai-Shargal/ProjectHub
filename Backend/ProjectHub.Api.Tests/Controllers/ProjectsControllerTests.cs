using System;
using System.Collections.Generic;
using System.Linq;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using ProjectHub.Api.Controllers;
using ProjectHub.Api.DTOs;
using ProjectHub.Api.Services;
using Xunit;

namespace ProjectHub.Api.Tests.Controllers;

public class ProjectsControllerTests
{
    private static string? GetAnonymousMessage(object value)
    {
        return value.GetType().GetProperty("message")?.GetValue(value) as string;
    }

    private static ProjectsController CreateController(
        Mock<IProjectService> projectService,
        string? authorizationHeader)
    {
        var sut = new ProjectsController(projectService.Object);

        var httpContext = new DefaultHttpContext();
        if (!string.IsNullOrWhiteSpace(authorizationHeader))
        {
            httpContext.Request.Headers["Authorization"] = authorizationHeader;
        }

        sut.ControllerContext = new ControllerContext
        {
            HttpContext = httpContext
        };

        return sut;
    }

    [Fact]
    public void GetProjects_returnsUnauthorized_whenTokenMissing()
    {
        var projectService = new Mock<IProjectService>();
        var sut = CreateController(projectService, authorizationHeader: null);

        var result = sut.GetAll();

        result.Result.Should().BeOfType<UnauthorizedObjectResult>();
        var unauthorized = (UnauthorizedObjectResult)result.Result!;
        GetAnonymousMessage(unauthorized.Value!).Should().Be("Invalid or missing token");
    }

    [Fact]
    public void GetProjects_returnsUnauthorized_whenTokenInvalid()
    {
        var projectService = new Mock<IProjectService>();
        var sut = CreateController(projectService, "Bearer not-a-number");

        var result = sut.GetAll();

        result.Result.Should().BeOfType<UnauthorizedObjectResult>();
        var unauthorized = (UnauthorizedObjectResult)result.Result!;
        GetAnonymousMessage(unauthorized.Value!).Should().Be("Invalid or missing token");
    }

    [Fact]
    public void GetProjects_returnsUnauthorized_whenUserDoesNotExist()
    {
        var projectService = new Mock<IProjectService>();
        projectService.Setup(s => s.UserExists(999)).Returns(false);

        var sut = CreateController(projectService, "Bearer 999");
        var result = sut.GetAll();

        result.Result.Should().BeOfType<UnauthorizedObjectResult>();
        var unauthorized = (UnauthorizedObjectResult)result.Result!;
        GetAnonymousMessage(unauthorized.Value!).Should().Be("Invalid or missing token");
    }

    [Fact]
    public void GetProjects_returnsUnauthorized_whenAuthorizationHeaderDoesNotUseBearerPrefix()
    {
        var projectService = new Mock<IProjectService>();
        var sut = CreateController(projectService, "1");

        var result = sut.GetAll();

        result.Result.Should().BeOfType<UnauthorizedObjectResult>();
        var unauthorized = (UnauthorizedObjectResult)result.Result!;
        GetAnonymousMessage(unauthorized.Value!).Should().Be("Invalid or missing token");
    }

    [Fact]
    public void UserCanSeeOnlyTheirProjects()
    {
        var projectService = new Mock<IProjectService>();
        projectService.Setup(s => s.UserExists(1)).Returns(true);

        var projects = new List<ProjectResponseDto>
        {
            new ProjectResponseDto { Id = 10, UserId = 1, Name = "A1", Score = 60, DurationInDays = 5, BugsCount = 1, MadeDeadline = true },
            new ProjectResponseDto { Id = 11, UserId = 1, Name = "A2", Score = 80, DurationInDays = 7, BugsCount = 2, MadeDeadline = false }
        };
        projectService.Setup(s => s.GetAllByUserId(1)).Returns(projects);

        var sut = CreateController(projectService, "Bearer 1");
        var result = sut.GetAll();

        result.Result.Should().BeOfType<OkObjectResult>();
        var ok = (OkObjectResult)result.Result!;

        ok.Value.Should().BeEquivalentTo(projects);
    }

    [Fact]
    public void UserCannotAccessAnotherUsersProject()
    {
        var projectService = new Mock<IProjectService>();
        projectService.Setup(s => s.UserExists(1)).Returns(true);
        projectService.Setup(s => s.GetByIdForUser(10, 1)).Returns((ProjectResponseDto?)null);

        var sut = CreateController(projectService, "Bearer 1");
        var result = sut.GetById(10);

        result.Result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public void CreateProject_requiresAuth()
    {
        var projectService = new Mock<IProjectService>();
        var sut = CreateController(projectService, authorizationHeader: null);

        var request = new ProjectCreateRequestDto
        {
            UserId = 123,
            Name = "P1",
            Score = 10,
            DurationInDays = 3,
            BugsCount = 0,
            MadeDeadline = false
        };

        var result = sut.Create(request);

        result.Result.Should().BeOfType<UnauthorizedObjectResult>();
        var unauthorized = (UnauthorizedObjectResult)result.Result!;
        GetAnonymousMessage(unauthorized.Value!).Should().Be("Invalid or missing token");
    }

    [Fact]
    public void CreateProject_succeeds_whenAuthenticated()
    {
        var projectService = new Mock<IProjectService>();
        projectService.Setup(s => s.UserExists(1)).Returns(true);

        var created = new ProjectResponseDto
        {
            Id = 55,
            UserId = 1,
            Name = "P1",
            Score = 10,
            DurationInDays = 3,
            BugsCount = 0,
            MadeDeadline = false
        };

        projectService
            .Setup(s => s.Create(It.Is<ProjectCreateRequestDto>(r =>
                r.UserId == 1 &&
                r.Name == "P1" &&
                r.Score == 10 &&
                r.DurationInDays == 3 &&
                r.BugsCount == 0 &&
                r.MadeDeadline == false)))
            .Returns(created);

        var sut = CreateController(projectService, "Bearer 1");

        var input = new ProjectCreateRequestDto
        {
            UserId = 999,
            Name = "P1",
            Score = 10,
            DurationInDays = 3,
            BugsCount = 0,
            MadeDeadline = false
        };

        var result = sut.Create(input);

        result.Result.Should().BeOfType<CreatedAtActionResult>();
        var createdResult = (CreatedAtActionResult)result.Result!;
        createdResult.StatusCode.Should().Be(StatusCodes.Status201Created);
        createdResult.Value.Should().BeEquivalentTo(created);
    }

    [Fact]
    public void CreateProject_withInvalidData_fails()
    {
        var projectService = new Mock<IProjectService>();
        projectService.Setup(s => s.UserExists(1)).Returns(true);

        projectService
            .Setup(s => s.Create(It.IsAny<ProjectCreateRequestDto>()))
            .Returns((ProjectResponseDto?)null);

        var sut = CreateController(projectService, "Bearer 1");

        var input = new ProjectCreateRequestDto
        {
            UserId = 123,
            Name = "P1",
            Score = 10,
            DurationInDays = 3,
            BugsCount = 0,
            MadeDeadline = false
        };

        var result = sut.Create(input);

        result.Result.Should().BeOfType<BadRequestObjectResult>();
        var badRequest = (BadRequestObjectResult)result.Result!;
        GetAnonymousMessage(badRequest.Value!).Should().Be("Unable to create project");
    }

    [Fact]
    public void UpdateProject_returnsUnauthorized_whenMissingToken()
    {
        var projectService = new Mock<IProjectService>();
        var sut = CreateController(projectService, authorizationHeader: null);

        var request = new ProjectUpdateRequestDto
        {
            UserId = 1,
            Name = "Updated",
            Score = 1,
            DurationInDays = 2,
            BugsCount = 0,
            MadeDeadline = true
        };

        var result = sut.Update(10, request);

        result.Result.Should().BeOfType<UnauthorizedObjectResult>();
        var unauthorized = (UnauthorizedObjectResult)result.Result!;
        GetAnonymousMessage(unauthorized.Value!).Should().Be("Invalid or missing token");
    }

    [Fact]
    public void UpdateProject_userCannotUpdateAnotherUsersProject()
    {
        var projectService = new Mock<IProjectService>();
        projectService.Setup(s => s.UserExists(1)).Returns(true);
        projectService.Setup(s => s.UpdateForUser(10, 1, It.IsAny<ProjectUpdateRequestDto>())).Returns((ProjectResponseDto?)null);

        var sut = CreateController(projectService, "Bearer 1");

        var request = new ProjectUpdateRequestDto
        {
            UserId = 999,
            Name = "Updated",
            Score = 1,
            DurationInDays = 2,
            BugsCount = 0,
            MadeDeadline = true
        };

        var result = sut.Update(10, request);

        result.Result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public void UpdateProject_returnsNotFound_whenProjectDoesNotExist()
    {
        var projectService = new Mock<IProjectService>();
        projectService.Setup(s => s.UserExists(1)).Returns(true);
        projectService.Setup(s => s.UpdateForUser(999, 1, It.IsAny<ProjectUpdateRequestDto>())).Returns((ProjectResponseDto?)null);

        var sut = CreateController(projectService, "Bearer 1");

        var request = new ProjectUpdateRequestDto
        {
            UserId = 999,
            Name = "Updated",
            Score = 1,
            DurationInDays = 2,
            BugsCount = 0,
            MadeDeadline = true
        };

        var result = sut.Update(999, request);

        result.Result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public void DeleteProject_returnsUnauthorized_whenMissingToken()
    {
        var projectService = new Mock<IProjectService>();
        var sut = CreateController(projectService, authorizationHeader: null);

        var result = sut.Delete(10);

        result.Should().BeOfType<UnauthorizedObjectResult>();
        var unauthorized = (UnauthorizedObjectResult)result;
        GetAnonymousMessage(unauthorized.Value!).Should().Be("Invalid or missing token");
    }

    [Fact]
    public void DeleteProject_userCannotDeleteAnotherUsersProject()
    {
        var projectService = new Mock<IProjectService>();
        projectService.Setup(s => s.UserExists(1)).Returns(true);
        projectService.Setup(s => s.DeleteForUser(10, 1)).Returns(false);

        var sut = CreateController(projectService, "Bearer 1");
        var result = sut.Delete(10);

        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public void DeleteProject_returnsNotFound_whenProjectDoesNotExist()
    {
        var projectService = new Mock<IProjectService>();
        projectService.Setup(s => s.UserExists(1)).Returns(true);
        projectService.Setup(s => s.DeleteForUser(999, 1)).Returns(false);

        var sut = CreateController(projectService, "Bearer 1");
        var result = sut.Delete(999);

        result.Should().BeOfType<NotFoundResult>();
    }
}

