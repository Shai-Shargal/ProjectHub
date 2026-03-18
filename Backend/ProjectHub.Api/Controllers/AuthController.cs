using Microsoft.AspNetCore.Mvc;
using ProjectHub.Api.DTOs;
using ProjectHub.Api.Services;

namespace ProjectHub.Api.Controllers;

[ApiController] 
[Route("api/[controller]")] 
public class AuthController : ControllerBase //i need to understand it more 
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public ActionResult<LoginResponse> Login([FromBody] LoginRequest request)
    {
        var result = _authService.Login(request);

        if (result is null)
        {
            return Unauthorized(new {message = "Invalid email or password"});

        }

        return Ok(result);
    }

    [HttpPost("register")]
    public ActionResult<RegisterResponse> Register([FromBody] RegisterRequest request)
    {
        if (request is null ||
            string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Email and password are required" });
        }

        if (!PasswordHelper.TryValidatePasswordComplexity(request.Password, out var passwordError))
        {
            return BadRequest(new { message = passwordError });
        }

        var result = _authService.Register(request);
        if (result is null)
        {
            return Conflict(new { message = "Email already exists" });
        }

        return Ok(result);
    }
}

