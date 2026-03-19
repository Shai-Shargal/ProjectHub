import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';

import { AuthService } from '../../../../core/services/auth.service';
import { ProjectService } from '../../../../core/services/project.service';
import { PersonalDetails } from '../../../../shared/models/auth.models';
import { Project, ProjectCreateRequest, ProjectUpdateRequest } from '../../../../shared/models/project.models';
import { computeProjectsStatsFromFiltered, filterProjects, sortProjects, DeadlineFilter, SortColumn, SortDirection } from '../../utils/projects-table.utils';
import { ProjectsTableComponent } from '../projects-table/projects-table.component';
import { UserCardComponent } from '../user-card/user-card.component';

@Component({
  standalone: true,
  selector: 'app-info',
  imports: [CommonModule, UserCardComponent, ProjectsTableComponent],
  templateUrl: './info.component.html',
  styleUrls: ['./info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InfoComponent implements OnInit {
  loading = true;
  errorMessage: string | null = null;
  projectsBusy = false;
  projectsError: string | null = null;

  personalDetails: PersonalDetails | null = null;
  projects: Project[] = [];
  filteredProjects: Project[] = [];
  visibleProjects: Project[] = [];

  nameFilter = '';
  deadlineFilter: DeadlineFilter = 'all';

  sortColumn: SortColumn = 'name';
  sortDirection: SortDirection = 'asc';

  averageScore = 0;
  percentageMetDeadline = 0;

  newProject: ProjectCreateRequest = {
    name: '',
    score: 0,
    durationInDays: 0,
    bugsCount: 0,
    madeDeadline: false
  };

  editProjectId: number | null = null;
  editDraft: ProjectUpdateRequest = {
    name: '',
    score: 0,
    durationInDays: 0,
    bugsCount: 0,
    madeDeadline: false
  };

  private loadingTimeoutHandle: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly authService: AuthService,
    private readonly projectService: ProjectService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  public logout(): void {
    this.authService.logout();
  }

  ngOnInit(): void {
    // Prevent an indefinite "Loading info..." screen if the request hangs.
    this.loadingTimeoutHandle = setTimeout(() => {
      if (this.loading) {
        this.loading = false;
        this.errorMessage = 'Request timed out while loading projects.';
        this.cdr.markForCheck();
      }
    }, 10000);

    this.personalDetails = this.authService.getPersonalDetails();

    const token = this.authService.getToken();
    if (!token) {
      // No token means we can't call protected endpoints.
      this.loading = false;
      this.errorMessage = 'Session expired. Please log in again.';
      return;
    }

    if (!this.personalDetails) {
      // PersonalDetails missing, but token exists. Still try to load projects.
      this.loading = false;
      // We'll keep the card empty and let projects rendering proceed.
    }

    this.loading = true;
    this.errorMessage = null;

    this.reloadProjects(true);
  }

  private reloadProjects(initialLoad: boolean): void {
    if (initialLoad) {
      this.projectsBusy = false;
      this.projectsError = null;
    } else {
      this.projectsBusy = true;
      this.projectsError = null;
    }

    this.projectService
      .getProjects()
      .pipe(
        finalize(() => {
          if (initialLoad) {
            this.loading = false;
            if (this.loadingTimeoutHandle) {
              clearTimeout(this.loadingTimeoutHandle);
              this.loadingTimeoutHandle = null;
            }
          }
          this.projectsBusy = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (projects) => {
          try {
            this.projects = projects ?? [];
            this.applyTablePipeline();
          } catch {
            this.errorMessage = 'Failed to render projects table';
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          const msg = this.extractErrorMessage(err, 'Failed to load projects');
          if (initialLoad) {
            this.errorMessage = msg;
          } else {
            this.projectsError = msg;
          }
          this.cdr.markForCheck();
        }
      });
  }

  onNewText(value: string, field: 'name'): void {
    this.newProject.name = value;
  }

  onNewNumber(value: string, field: 'score' | 'durationInDays' | 'bugsCount'): void {
    const num = Number(value);
    if (field === 'score') this.newProject.score = Number.isFinite(num) ? num : 0;
    if (field === 'durationInDays') this.newProject.durationInDays = Number.isFinite(num) ? num : 0;
    if (field === 'bugsCount') this.newProject.bugsCount = Number.isFinite(num) ? num : 0;
  }

  onNewMadeDeadlineChange(checked: boolean): void {
    this.newProject.madeDeadline = checked;
  }

  onCreateProject(): void {
    if (this.projectsBusy || !this.newProject.name.trim()) return;

    this.projectService.createProject(this.newProject).subscribe({
      next: () => {
        this.newProject = { name: '', score: 0, durationInDays: 0, bugsCount: 0, madeDeadline: false };
        this.reloadProjects(false);
      },
      error: (err) => {
        this.projectsError = this.extractErrorMessage(err, 'Failed to create project');
        this.cdr.markForCheck();
      }
    });
  }

  startEdit(p: Project): void {
    this.editProjectId = p.id;
    this.editDraft = {
      name: p.name,
      score: p.score,
      durationInDays: p.durationInDays,
      bugsCount: p.bugsCount,
      madeDeadline: p.madeDeadline
    };
    this.projectsError = null;
    this.cdr.markForCheck();
  }

  cancelEdit(): void {
    this.editProjectId = null;
    this.projectsError = null;
    this.cdr.markForCheck();
  }

  onEditText(value: string, field: 'name'): void {
    this.editDraft.name = value;
  }

  onEditNumber(value: string, field: 'score' | 'durationInDays' | 'bugsCount'): void {
    const num = Number(value);
    if (field === 'score') this.editDraft.score = Number.isFinite(num) ? num : 0;
    if (field === 'durationInDays') this.editDraft.durationInDays = Number.isFinite(num) ? num : 0;
    if (field === 'bugsCount') this.editDraft.bugsCount = Number.isFinite(num) ? num : 0;
  }

  onEditMadeDeadlineChange(checked: boolean): void {
    this.editDraft.madeDeadline = checked;
  }

  onSaveEdit(): void {
    if (this.projectsBusy || this.editProjectId === null || !this.editDraft.name.trim()) return;

    this.projectService.updateProject(this.editProjectId, this.editDraft).subscribe({
      next: () => {
        this.editProjectId = null;
        this.reloadProjects(false);
      },
      error: (err) => {
        this.projectsError = this.extractErrorMessage(err, 'Failed to update project');
        this.cdr.markForCheck();
      }
    });
  }

  onDeleteProject(id: number): void {
    if (this.projectsBusy) return;

    this.projectService.deleteProject(id).subscribe({
      next: () => {
        // Optimistically remove from current table (helps if reload is slow/glitchy).
        this.projects = this.projects.filter((p) => p.id !== id);
        this.applyTablePipeline();
        if (this.editProjectId === id) this.editProjectId = null;
        this.cdr.markForCheck();

        // Then reload from API to confirm final state.
        this.reloadProjects(false);
      },
      error: (err) => {
        this.projectsError = this.extractErrorMessage(err, 'Failed to delete project');
        this.cdr.markForCheck();
      }
    });
  }

  onNameFilterInput(value: string): void {
    this.nameFilter = value;
    this.applyTablePipeline();
  }

  onDeadlineFilterInput(value: string): void {
    const next = value as DeadlineFilter;
    if (next === 'all' || next === 'yes' || next === 'no') {
      this.deadlineFilter = next;
      this.applyTablePipeline();
    }
  }

  onSort(column: SortColumn): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applyTablePipeline();
  }

  private applyTablePipeline(): void {
    this.filteredProjects = filterProjects(this.projects, this.nameFilter, this.deadlineFilter);
    this.visibleProjects = sortProjects(this.filteredProjects, this.sortColumn, this.sortDirection);

    // Stats must be computed ONLY from currently visible filtered rows.
    // At the moment, we don't paginate, so "visible filtered rows" == filteredProjects.
    const stats = computeProjectsStatsFromFiltered(this.filteredProjects);
    this.averageScore = stats.averageScore;
    this.percentageMetDeadline = stats.percentageMetDeadline;
  }

  private extractErrorMessage(err: unknown, fallback: string): string {
    const anyErr = err as any;
    return (
      anyErr?.error?.message ??
      anyErr?.error ??
      anyErr?.message ??
      fallback
    );
  }
}

