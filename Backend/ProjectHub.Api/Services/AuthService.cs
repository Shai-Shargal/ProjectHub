using ProjectHub.Api.Data;
using ProjectHub.Api.DTOs;

namespace ProjectHub.Api.Services;

public class AuthService : IAuthService
{
    private readonly ProjectHubDbContext _db;

    public AuthService(ProjectHubDbContext db)
    {
        _db = db;
    }

    public LoginResponse? Login(LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return null;
        }

        var user = _db.Users.FirstOrDefault(u => u.Email == request.Email);
        if (user is null)
        {
            return null;
        }

        if (!VerifyPassword(request.Password, user.PasswordHash))
        {
            return null;
        }

        var token = user.Id.ToString();

        return new LoginResponse
        {
            Token = token,
            PersonalDetails = new PersonalDetailsDto
            {
                Name = user.Name,
                Team = user.Team,
                JoinedDate = user.JoinedDate,
                Avatar = user.Avatar
            }
        };
    }

    // Helper methods (required by assignment).
    public static string HashPassword(string password)
        => PasswordHelper.HashPassword(password);

    public static bool VerifyPassword(string password, string storedPasswordHash)
        => PasswordHelper.VerifyPassword(password, storedPasswordHash);
}

