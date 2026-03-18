namespace ProjectHub.Api.DTOs;

public class ProjectCreateRequestDto
{
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Score { get; set; }
    public int DurationInDays { get; set; }
    public int BugsCount { get; set; }
    public bool MadeDeadline { get; set; }
}

