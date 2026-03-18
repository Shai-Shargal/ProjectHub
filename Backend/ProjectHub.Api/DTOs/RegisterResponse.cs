namespace ProjectHub.Api.DTOs;

public class RegisterResponse
{
    public string Token { get; set; } = string.Empty;
    public int UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public PersonalDetailsDto PersonalDetails { get; set; } = new();
}

