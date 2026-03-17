using ProjectHub.Api.DTOs;

namespace ProjectHub.Api.Services;

public interface IAuthService
{
    LoginResponse? Login(LoginRequest request);
}

