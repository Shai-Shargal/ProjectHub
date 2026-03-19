import { Project } from '../../../shared/models/project.models';

export type DeadlineFilter = 'all' | 'yes' | 'no';
export type SortColumn = 'name' | 'score' | 'durationInDays' | 'bugsCount' | 'madeDeadline';
export type SortDirection = 'asc' | 'desc';

export function filterProjects(projects: Project[], nameFilter: string, deadlineFilter: DeadlineFilter): Project[] {
  const trimmedName = nameFilter.trim().toLowerCase();

  return projects.filter((p) => {
    const matchesName = trimmedName.length === 0 || p.name.toLowerCase().includes(trimmedName);

    const matchesDeadline =
      deadlineFilter === 'all' || (deadlineFilter === 'yes' && p.madeDeadline === true) || (deadlineFilter === 'no' && p.madeDeadline === false);

    return matchesName && matchesDeadline;
  });
}

export function sortProjects(projects: Project[], sortColumn: SortColumn, sortDirection: SortDirection): Project[] {
  const directionMultiplier = sortDirection === 'asc' ? 1 : -1;

  const compareBySort = (a: Project, b: Project): number => {
    let result = 0;

    switch (sortColumn) {
      case 'name': {
        result = a.name.localeCompare(b.name);
        break;
      }
      case 'score': {
        result = a.score - b.score;
        break;
      }
      case 'durationInDays': {
        result = a.durationInDays - b.durationInDays;
        break;
      }
      case 'bugsCount': {
        result = a.bugsCount - b.bugsCount;
        break;
      }
      case 'madeDeadline': {
        result = (+a.madeDeadline - +b.madeDeadline);
        break;
      }
    }

    return result * directionMultiplier;
  };

  return [...projects].sort((a, b) => compareBySort(a, b));
}

export function computeProjectsStatsFromFiltered(filteredProjects: Project[]): { averageScore: number; percentageMetDeadline: number } {
  if (filteredProjects.length === 0) {
    return { averageScore: 0, percentageMetDeadline: 0 };
  }

  const sum = filteredProjects.reduce((acc, p) => acc + p.score, 0);
  const averageScore = sum / filteredProjects.length;

  const deadlineMet = filteredProjects.filter((p) => p.madeDeadline === true).length;
  const percentageMetDeadline = (deadlineMet / filteredProjects.length) * 100;

  return { averageScore, percentageMetDeadline };
}

