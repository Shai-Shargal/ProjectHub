using ProjectHub.Api.DTOs;

namespace ProjectHub.Api.Services;

public class AuthService : IAuthService
{
    public LoginResponse? Login(LoginRequest request)
    {
        const string validEmail = "user@test.com";
        const string validPassword = "Password123";

        if (!string.Equals(request.Email, validEmail, StringComparison.OrdinalIgnoreCase) ||
            request.Password != validPassword)
        {
            return null;
        }

        var token = Guid.NewGuid().ToString();

        return new LoginResponse
        {
            Token = token,
            PersonalDetails = new PersonalDetailsDto
            {
                Name = "Test User",
                Team = "Engineering",
                JoinedDate = new DateTime(2020, 1, 15),
                Avatar = "https://example.com/avatars/test-user.png"
            }
        };
    }
}

