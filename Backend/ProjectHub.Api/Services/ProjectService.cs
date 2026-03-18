using Microsoft.EntityFrameworkCore;
using ProjectHub.Api.Data;
using ProjectHub.Api.DTOs;
using ProjectHub.Api.Models;

namespace ProjectHub.Api.Services;

public class ProjectService : IProjectService
{
    private readonly ProjectHubDbContext _db;

    public ProjectService(ProjectHubDbContext db)
    {
        _db = db;
    }

    public IEnumerable<ProjectResponseDto> GetAll()
    {
        return _db.Projects
            .AsNoTracking()
            .Select(p => new ProjectResponseDto
            {
                Id = p.Id,
                UserId = p.UserId,
                Name = p.Name,
                Score = p.Score,
                DurationInDays = p.DurationInDays,
                BugsCount = p.BugsCount,
                MadeDeadline = p.MadeDeadline
            })
            .ToList();
    }

    public IEnumerable<ProjectResponseDto> GetAllByUserId(int userId)
    {
        return _db.Projects
            .AsNoTracking()
            .Where(p => p.UserId == userId)
            .Select(p => new ProjectResponseDto
            {
                Id = p.Id,
                UserId = p.UserId,
                Name = p.Name,
                Score = p.Score,
                DurationInDays = p.DurationInDays,
                BugsCount = p.BugsCount,
                MadeDeadline = p.MadeDeadline
            })
            .ToList();
    }

    public ProjectResponseDto? GetById(int id)
    {
        var project = _db.Projects.AsNoTracking().FirstOrDefault(p => p.Id == id);
        return project is null ? null : Map(project);
    }

    public ProjectResponseDto? GetByIdForUser(int id, int userId)
    {
        var project = _db.Projects.AsNoTracking()
            .FirstOrDefault(p => p.Id == id && p.UserId == userId);
        return project is null ? null : Map(project);
    }

    public bool UserExists(int userId)
    {
        return _db.Users.AsNoTracking().Any(u => u.Id == userId);
    }

    public ProjectResponseDto? Create(ProjectCreateRequestDto request)
    {
        if (!UserExists(request.UserId))
        {
            return null;
        }

        var project = new Project
        {
            UserId = request.UserId,
            Name = request.Name,
            Score = request.Score,
            DurationInDays = request.DurationInDays,
            BugsCount = request.BugsCount,
            MadeDeadline = request.MadeDeadline
        };

        _db.Projects.Add(project);
        _db.SaveChanges();

        return Map(project);
    }

    public ProjectResponseDto? Update(int id, ProjectUpdateRequestDto request)
    {
        var existing = _db.Projects.FirstOrDefault(p => p.Id == id);
        if (existing is null)
        {
            return null;
        }

        if (!UserExists(request.UserId))
        {
            return null;
        }

        existing.UserId = request.UserId;
        existing.Name = request.Name;
        existing.Score = request.Score;
        existing.DurationInDays = request.DurationInDays;
        existing.BugsCount = request.BugsCount;
        existing.MadeDeadline = request.MadeDeadline;

        _db.SaveChanges();

        return Map(existing);
    }

    public ProjectResponseDto? UpdateForUser(int id, int userId, ProjectUpdateRequestDto request)
    {
        var existing = _db.Projects.FirstOrDefault(p => p.Id == id && p.UserId == userId);
        if (existing is null)
        {
            return null;
        }

        existing.Name = request.Name;
        existing.Score = request.Score;
        existing.DurationInDays = request.DurationInDays;
        existing.BugsCount = request.BugsCount;
        existing.MadeDeadline = request.MadeDeadline;

        _db.SaveChanges();

        return Map(existing);
    }

    public bool Delete(int id)
    {
        var existing = _db.Projects.FirstOrDefault(p => p.Id == id);
        if (existing is null)
        {
            return false;
        }

        _db.Projects.Remove(existing);
        _db.SaveChanges();
        return true;
    }

    public bool DeleteForUser(int id, int userId)
    {
        var existing = _db.Projects.FirstOrDefault(p => p.Id == id && p.UserId == userId);
        if (existing is null)
        {
            return false;
        }

        _db.Projects.Remove(existing);
        _db.SaveChanges();
        return true;
    }

    private static ProjectResponseDto Map(Project project)
    {
        return new ProjectResponseDto
        {
            Id = project.Id,
            UserId = project.UserId,
            Name = project.Name,
            Score = project.Score,
            DurationInDays = project.DurationInDays,
            BugsCount = project.BugsCount,
            MadeDeadline = project.MadeDeadline
        };
    }
}

