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
  template: `
    <div class="page" *ngIf="!loading; else loadingTpl">
      <div class="header-row">
        <h2>Projects Info</h2>
        <button type="button" class="logout-btn" (click)="logout()">Logout</button>
      </div>

      <div class="layout">
        <app-user-card *ngIf="personalDetails" [personalDetails]="personalDetails"></app-user-card>

        <app-projects-table
          [projectsBusy]="projectsBusy"
          [projectsError]="projectsError"
          [newProject]="newProject"
          [averageScore]="averageScore"
          [percentageMetDeadline]="percentageMetDeadline"
          [nameFilter]="nameFilter"
          [deadlineFilter]="deadlineFilter"
          [sortColumn]="sortColumn"
          [sortDirection]="sortDirection"
          [visibleProjects]="visibleProjects"
          [editProjectId]="editProjectId"
          [editDraft]="editDraft"
          (createProject)="onCreateProject()"
          (deleteProject)="onDeleteProject($event)"
          (startEdit)="startEdit($event)"
          (cancelEdit)="cancelEdit()"
          (saveEdit)="onSaveEdit()"
          (newTextInput)="onNewText($event.value, $event.field)"
          (newNumberInput)="onNewNumber($event.value, $event.field)"
          (newMadeDeadlineChange)="onNewMadeDeadlineChange($event)"
          (editTextInput)="onEditText($event.value, $event.field)"
          (editNumberInput)="onEditNumber($event.value, $event.field)"
          (editMadeDeadlineChange)="onEditMadeDeadlineChange($event)"
          (nameFilterInput)="onNameFilterInput($event)"
          (deadlineFilterInput)="onDeadlineFilterInput($event)"
          (sortChange)="onSort($event)"
        ></app-projects-table>
      </div>

      <div class="error" *ngIf="errorMessage">
        {{ errorMessage }}
      </div>
    </div>

    <ng-template #loadingTpl>
      <div class="loading-page" role="status">
        Loading info...
      </div>
    </ng-template>
  `,
  styles: [
    `
      .page {
        max-width: 1100px;
        margin: 18px auto;
        padding: 0 12px;
      }
      .layout {
        display: grid;
        grid-template-columns: 320px 1fr;
        gap: 14px;
        align-items: start;
      }
      .card {
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        padding: 14px;
        background: white;
      }
      .user-card .avatar-wrap {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 12px;
      }
      .avatar {
        width: 96px;
        height: 96px;
        border-radius: 50%;
        object-fit: cover;
      }
      .user-fields div {
        margin: 6px 0;
      }

      .stats {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-bottom: 12px;
      }
      .stat .label {
        color: #6b7280;
        margin-bottom: 6px;
      }
      .stat .value {
        font-size: 18px;
        font-weight: 600;
      }

      .projects-table {
        width: 100%;
        border-collapse: collapse;
      }
      .projects-table th,
      .projects-table td {
        border-bottom: 1px solid #e5e7eb;
        padding: 10px 8px;
        text-align: left;
      }
      .header-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 12px;
      }
      .logout-btn {
        padding: 8px 12px;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
        background: #fff;
        cursor: pointer;
      }
      .mutator-card {
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        padding: 12px;
        margin-bottom: 14px;
        background: #fff;
      }
      .mutator-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin-bottom: 10px;
      }
      .mutator-grid label {
        display: flex;
        flex-direction: column;
        gap: 6px;
        font-size: 13px;
        color: #374151;
      }
      .mutator-grid input {
        padding: 8px;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
      }
      .checkbox {
        display: flex !important;
        flex-direction: row !important;
        align-items: center !important;
        gap: 8px !important;
      }
      .actions-cell {
        white-space: nowrap;
      }
      .actions-cell button {
        margin-right: 8px;
      }
      .danger {
        color: #b00020;
      }
      .edit-card {
        margin-top: 14px;
        border-top: 1px dashed #e5e7eb;
        padding-top: 14px;
      }
      .edit-actions {
        display: flex;
        gap: 10px;
        margin-top: 10px;
      }
      .secondary {
        background: #f3f4f6;
      }
      .filters {
        display: grid;
        grid-template-columns: 1.2fr 0.8fr;
        gap: 12px;
        margin: 12px 0;
      }
      .filter {
        display: flex;
        flex-direction: column;
        gap: 6px;
        font-size: 13px;
        color: #374151;
      }
      .filter input,
      .filter select {
        padding: 8px;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
      }
      .sortable {
        cursor: pointer;
        user-select: none;
      }
      .sort-indicator {
        margin-left: 6px;
        font-size: 12px;
        color: #6b7280;
      }
      .score-cell.score-low {
        background: #f8d7da;
      }
      .score-cell.score-high {
        background: #d4edda;
      }

      .muted {
        color: #6b7280;
      }
      .error {
        color: #b00020;
        margin-top: 10px;
      }
      .loading-page {
        max-width: 700px;
        margin: 18px auto;
        padding: 12px;
      }
    `
  ],
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

