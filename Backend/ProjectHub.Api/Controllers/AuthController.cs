using Microsoft.AspNetCore.Mvc;
using ProjectHub.Api.DTOs;
using ProjectHub.Api.Services;

namespace ProjectHub.Api.Controllers;

[ApiController] //mark the class as a controller
[Route("api/[controller]")] //define the route for the controller
public class AuthController : ControllerBase //inherit from ControllerBase - from the framework - this is a base class for all controllers
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
            return Unauthorized();
        }

        return Ok(result);
    }
}

