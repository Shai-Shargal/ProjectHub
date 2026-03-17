namespace ProjectHub.Api.DTOs;

public class LoginResponse
{
    public string Token { get; set; } = string.Empty;

    public PersonalDetailsDto PersonalDetails { get; set; } = new();
}

public class PersonalDetailsDto
{
    public string Name { get; set; } = string.Empty;

    public string Team { get; set; } = string.Empty;

    public DateTime JoinedDate { get; set; }

    public string Avatar { get; set; } = string.Empty;
}

