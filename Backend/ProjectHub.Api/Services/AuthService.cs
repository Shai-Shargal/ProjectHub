using ProjectHub.Api.Data;
using ProjectHub.Api.DTOs;
using ProjectHub.Api.Models;

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

        var normalizedEmail = NormalizeEmail(request.Email);
        var user = _db.Users.FirstOrDefault(u => u.Email.ToLower() == normalizedEmail);
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

    public RegisterResponse? Register(RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return null;
        }

        var normalizedEmail = NormalizeEmail(request.Email);
        if (string.IsNullOrWhiteSpace(normalizedEmail))
        {
            return null;
        }

        // Keep email checks simple and idempotent for this assignment.
        if (_db.Users.Any(u => u.Email.ToLower() == normalizedEmail))
        {
            return null;
        }

        var user = new User
        {
            Email = normalizedEmail,
            PasswordHash = HashPassword(request.Password),
            Name = (request.Name ?? string.Empty).Trim(),
            Team = (request.Team ?? string.Empty).Trim(),
            JoinedDate = DateTime.UtcNow,
            Avatar = (request.Avatar ?? string.Empty).Trim()
        };

        _db.Users.Add(user);
        _db.SaveChanges();

        return new RegisterResponse
        {
            Token = user.Id.ToString(),
            UserId = user.Id,
            Email = user.Email,
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

    private static string NormalizeEmail(string email)
    {
        return email.Trim().ToLowerInvariant();
    }
}

