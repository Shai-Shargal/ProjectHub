using ProjectHub.Api.DTOs;

namespace ProjectHub.Api.Services;

public interface IProjectService
{
    IEnumerable<ProjectResponseDto> GetAll();
    IEnumerable<ProjectResponseDto> GetAllByUserId(int userId);
    ProjectResponseDto? GetById(int id);
    ProjectResponseDto? GetByIdForUser(int id, int userId);

    bool UserExists(int userId);
    ProjectResponseDto? Create(ProjectCreateRequestDto request);
    ProjectResponseDto? UpdateForUser(int id, int userId, ProjectUpdateRequestDto request);
    ProjectResponseDto? Update(int id, ProjectUpdateRequestDto request);
    bool DeleteForUser(int id, int userId);
    bool Delete(int id);
}

