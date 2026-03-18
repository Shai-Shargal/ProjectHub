using Microsoft.AspNetCore.Mvc;
using ProjectHub.Api.DTOs;
using ProjectHub.Api.Services;

namespace ProjectHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProjectsController : ControllerBase
{
    private readonly IProjectService _projectService;

    public ProjectsController(IProjectService projectService)
    {
        _projectService = projectService;
    }

    [HttpGet]
    public ActionResult<IEnumerable<ProjectResponseDto>> GetAll()
    {
        if (!TryGetAuthenticatedUserId(out var userId))
        {
            return Unauthorized(new { message = "Invalid or missing token" });
        }

        return Ok(_projectService.GetAllByUserId(userId));
    }

    [HttpGet("{id:int}")]
    public ActionResult<ProjectResponseDto> GetById([FromRoute] int id)
    {
        if (!TryGetAuthenticatedUserId(out var userId))
        {
            return Unauthorized(new { message = "Invalid or missing token" });
        }

        var project = _projectService.GetByIdForUser(id, userId);
        if (project is null)
        {
            return NotFound();
        }

        return Ok(project);
    }

    [HttpPost]
    public ActionResult<ProjectResponseDto> Create([FromBody] ProjectCreateRequestDto request)
    {
        if (request is null)
        {
            return BadRequest(new { message = "Request body is required" });
        }

        if (!TryGetAuthenticatedUserId(out var userId))
        {
            return Unauthorized(new { message = "Invalid or missing token" });
        }

        // Token is the source of truth for the connected user.
        request.UserId = userId;

        var created = _projectService.Create(request);
        if (created is null)
        {
            return BadRequest(new { message = "Unable to create project" });
        }

        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public ActionResult<ProjectResponseDto> Update([FromRoute] int id, [FromBody] ProjectUpdateRequestDto request)
    {
        if (request is null)
        {
            return BadRequest(new { message = "Request body is required" });
        }

        if (!TryGetAuthenticatedUserId(out var userId))
        {
            return Unauthorized(new { message = "Invalid or missing token" });
        }

        // Token is the source of truth for the connected user.
        request.UserId = userId;

        var updated = _projectService.UpdateForUser(id, userId, request);
        if (updated is null)
        {
            return NotFound();
        }

        return Ok(updated);
    }

    [HttpDelete("{id:int}")]
    public IActionResult Delete([FromRoute] int id)
    {
        if (!TryGetAuthenticatedUserId(out var userId))
        {
            return Unauthorized(new { message = "Invalid or missing token" });
        }

        var deleted = _projectService.DeleteForUser(id, userId);
        if (!deleted)
        {
            return NotFound();
        }

        return NoContent();
    }

    private bool TryGetAuthenticatedUserId(out int userId)
    {
        userId = default;

        // Assignment token = user.Id.ToString()
        // Expected header:
        // Authorization: Bearer <token>
        var authorizationHeader = Request.Headers["Authorization"].FirstOrDefault();
        if (string.IsNullOrWhiteSpace(authorizationHeader))
        {
            return false;
        }

        const string bearerPrefix = "Bearer ";
        var trimmed = authorizationHeader.Trim();
        if (!trimmed.StartsWith(bearerPrefix, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        var token = trimmed.Substring(bearerPrefix.Length).Trim();

        if (string.IsNullOrWhiteSpace(token))
        {
            return false;
        }

        if (!int.TryParse(token, out userId))
        {
            return false;
        }

        return _projectService.UserExists(userId);
    }
}

