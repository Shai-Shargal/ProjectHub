namespace ProjectHub.Api.Models;

public class User
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Team { get; set; } = string.Empty;
    public DateTime JoinedDate { get; set; }
    public string Avatar { get; set; } = string.Empty;
    public ICollection<Project> Projects { get; set; } = new List<Project>();
}
