import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';

import { AuthService } from '../../../../core/services/auth.service';
import { ProjectService } from '../../../../core/services/project.service';
import { PersonalDetails } from '../../../../shared/models/auth.models';
import { Project, ProjectCreateRequest, ProjectUpdateRequest } from '../../../../shared/models/project.models';

@Component({
  standalone: true,
  selector: 'app-info',
  imports: [CommonModule],
  template: `
    <div class="page" *ngIf="!loading; else loadingTpl">
      <div class="header-row">
        <h2>Projects Info</h2>
        <button type="button" class="logout-btn" (click)="logout()">Logout</button>
      </div>

      <div class="layout">
        <section class="card user-card" *ngIf="personalDetails">
          <div class="avatar-wrap">
            <img class="avatar" [src]="personalDetails.avatar" alt="Avatar" />
          </div>

          <div class="user-fields">
            <div><strong>Name:</strong> {{ personalDetails.name }}</div>
            <div><strong>Team:</strong> {{ personalDetails.team }}</div>
            <div>
              <strong>Joined Date:</strong>
              {{ personalDetails.joinedDate | date : 'mediumDate' }}
            </div>
          </div>
        </section>

        <section class="card projects-card">
          <div class="mutator-card">
            <h3>Create Project</h3>

            <div class="mutator-grid">
              <label>
                Project Name
                <input type="text" [value]="newProject.name" (input)="onNewText($any($event.target).value, 'name')" />
              </label>

              <label>
                Score
                <input type="number" [value]="newProject.score" (input)="onNewNumber($any($event.target).value, 'score')" />
              </label>

              <label>
                Duration In Days
                <input type="number" [value]="newProject.durationInDays" (input)="onNewNumber($any($event.target).value, 'durationInDays')" />
              </label>

              <label>
                Bugs Count
                <input type="number" [value]="newProject.bugsCount" (input)="onNewNumber($any($event.target).value, 'bugsCount')" />
              </label>

              <label class="checkbox">
                <input type="checkbox" [checked]="newProject.madeDeadline" (change)="newProject.madeDeadline = $any($event.target).checked" />
                Made Deadline
              </label>
            </div>

            <button type="button" [disabled]="projectsBusy || !newProject.name.trim()" (click)="onCreateProject()">
              Create
            </button>

            <div class="error" *ngIf="projectsError">{{ projectsError }}</div>
          </div>

          <div class="stats">
            <div class="stat">
              <div class="label">Average Project Score</div>
              <div class="value">{{ averageScore | number : '1.0-2' }}</div>
            </div>
            <div class="stat">
              <div class="label">Deadline Met Percentage</div>
              <div class="value">{{ percentageMetDeadline | number : '1.0-2' }}%</div>
            </div>
          </div>

          <div class="filters">
            <label class="filter">
              Filter by project name
              <input
                type="text"
                placeholder="e.g. Apollo"
                (input)="onNameFilterInput($any($event.target).value)"
              />
            </label>

            <label class="filter">
              Made deadline
              <select (change)="onDeadlineFilterInput($any($event.target).value)">
                <option value="all">All</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </label>
          </div>

          <table class="projects-table" *ngIf="visibleProjects.length > 0; else noProjectsTpl">
            <thead>
              <tr>
                <th class="sortable" (click)="onSort('name')">
                  Project Name
                  <span class="sort-indicator" *ngIf="sortColumn === 'name'">
                    {{ sortDirection === 'asc' ? '^' : 'v' }}
                  </span>
                </th>
                <th class="sortable" (click)="onSort('score')">
                  Score
                  <span class="sort-indicator" *ngIf="sortColumn === 'score'">
                    {{ sortDirection === 'asc' ? '^' : 'v' }}
                  </span>
                </th>
                <th class="sortable" (click)="onSort('durationInDays')">
                  Duration In Days
                  <span class="sort-indicator" *ngIf="sortColumn === 'durationInDays'">
                    {{ sortDirection === 'asc' ? '^' : 'v' }}
                  </span>
                </th>
                <th class="sortable" (click)="onSort('bugsCount')">
                  Bugs Count
                  <span class="sort-indicator" *ngIf="sortColumn === 'bugsCount'">
                    {{ sortDirection === 'asc' ? '^' : 'v' }}
                  </span>
                </th>
                <th class="sortable" (click)="onSort('madeDeadline')">
                  Made Deadline
                  <span class="sort-indicator" *ngIf="sortColumn === 'madeDeadline'">
                    {{ sortDirection === 'asc' ? '^' : 'v' }}
                  </span>
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of visibleProjects">
                <td>{{ p.name }}</td>
                <td
                  class="score-cell"
                  [ngClass]="{
                    'score-low': p.score < 70,
                    'score-high': p.score > 90
                  }"
                >
                  {{ p.score }}
                </td>
                <td>{{ p.durationInDays }}</td>
                <td>{{ p.bugsCount }}</td>
                <td>{{ p.madeDeadline ? 'Yes' : 'No' }}</td>
                <td class="actions-cell">
                  <button type="button" [disabled]="projectsBusy" (click)="startEdit(p)">Edit</button>
                  <button type="button" class="danger" [disabled]="projectsBusy" (click)="onDeleteProject(p.id)">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>

          <ng-template #noProjectsTpl>
            <p class="muted">No projects to display.</p>
          </ng-template>

          <div class="edit-card" *ngIf="editProjectId !== null">
            <h3>Edit Project</h3>

            <div class="mutator-grid">
              <label>
                Project Name
                <input type="text" [value]="editDraft.name" (input)="onEditText($any($event.target).value, 'name')" />
              </label>

              <label>
                Score
                <input type="number" [value]="editDraft.score" (input)="onEditNumber($any($event.target).value, 'score')" />
              </label>

              <label>
                Duration In Days
                <input type="number" [value]="editDraft.durationInDays" (input)="onEditNumber($any($event.target).value, 'durationInDays')" />
              </label>

              <label>
                Bugs Count
                <input type="number" [value]="editDraft.bugsCount" (input)="onEditNumber($any($event.target).value, 'bugsCount')" />
              </label>

              <label class="checkbox">
                <input type="checkbox" [checked]="editDraft.madeDeadline" (change)="editDraft.madeDeadline = $any($event.target).checked" />
                Made Deadline
              </label>
            </div>

            <div class="edit-actions">
              <button type="button" [disabled]="projectsBusy || !editDraft.name.trim()" (click)="onSaveEdit()">Save</button>
              <button type="button" class="secondary" [disabled]="projectsBusy" (click)="cancelEdit()">Cancel</button>
            </div>
          </div>
        </section>
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
  deadlineFilter: 'all' | 'yes' | 'no' = 'all';

  sortColumn: 'name' | 'score' | 'durationInDays' | 'bugsCount' | 'madeDeadline' = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';

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
    const next = value as 'all' | 'yes' | 'no';
    if (next === 'all' || next === 'yes' || next === 'no') {
      this.deadlineFilter = next;
      this.applyTablePipeline();
    }
  }

  onSort(column: 'name' | 'score' | 'durationInDays' | 'bugsCount' | 'madeDeadline'): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applyTablePipeline();
  }

  private applyTablePipeline(): void {
    this.filteredProjects = this.projects.filter((p) => {
      const matchesName =
        this.nameFilter.trim().length === 0 ||
        p.name.toLowerCase().includes(this.nameFilter.trim().toLowerCase());

      const matchesDeadline =
        this.deadlineFilter === 'all' ||
        (this.deadlineFilter === 'yes' && p.madeDeadline === true) ||
        (this.deadlineFilter === 'no' && p.madeDeadline === false);

      return matchesName && matchesDeadline;
    });

    this.visibleProjects = [...this.filteredProjects].sort((a, b) => this.compareBySort(a, b));
    this.recomputeStatsFromFiltered();
  }

  private compareBySort(a: Project, b: Project): number {
    const directionMultiplier = this.sortDirection === 'asc' ? 1 : -1;

    let result = 0;
    switch (this.sortColumn) {
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
  }

  private recomputeStatsFromFiltered(): void {
    // Stats must be computed ONLY from currently visible filtered rows.
    // At the moment, we don't paginate, so "visible filtered rows" == filteredProjects.
    const visibleFilteredRows = this.filteredProjects;

    if (visibleFilteredRows.length === 0) {
      this.averageScore = 0;
      this.percentageMetDeadline = 0;
      return;
    }

    const sum = visibleFilteredRows.reduce((acc, p) => acc + p.score, 0);
    this.averageScore = sum / visibleFilteredRows.length;

    const deadlineMet = visibleFilteredRows.filter((p) => p.madeDeadline === true).length;
    this.percentageMetDeadline = (deadlineMet / visibleFilteredRows.length) * 100;
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

