using Microsoft.AspNetCore.Mvc;
using ProjectHub.Api.DTOs;
using ProjectHub.Api.Services;

namespace ProjectHub.Api.Controllers;

[ApiController] 
[Route("api/[controller]")] 
public class AuthController : ControllerBase 
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
}

