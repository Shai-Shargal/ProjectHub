import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { Project, ProjectCreateRequest, ProjectUpdateRequest } from '../../../../shared/models/project.models';
import { DeadlineFilter, SortColumn } from '../../utils/projects-table.utils';

import { ProjectsStatsComponent } from '../projects-stats/projects-stats.component';

@Component({
  standalone: true,
  selector: 'app-projects-table',
  imports: [CommonModule, ProjectsStatsComponent],
  template: `
    <section class="card projects-card">
      <div class="mutator-card">
        <h3>Create Project</h3>

        <div class="mutator-grid">
          <label>
            Project Name
            <input
              type="text"
              [value]="newProject.name"
              (input)="onNewTextInput($any($event.target).value)"
            />
          </label>

          <label>
            Score
            <input
              type="number"
              [value]="newProject.score"
              (input)="onNewNumberInput($any($event.target).value, 'score')"
            />
          </label>

          <label>
            Duration In Days
            <input
              type="number"
              [value]="newProject.durationInDays"
              (input)="onNewNumberInput($any($event.target).value, 'durationInDays')"
            />
          </label>

          <label>
            Bugs Count
            <input
              type="number"
              [value]="newProject.bugsCount"
              (input)="onNewNumberInput($any($event.target).value, 'bugsCount')"
            />
          </label>

          <label class="checkbox">
            <input
              type="checkbox"
              [checked]="newProject.madeDeadline"
              (change)="onNewMadeDeadlineChange($any($event.target).checked)"
            />
            Made Deadline
          </label>
        </div>

        <button type="button" [disabled]="projectsBusy || !newProject.name.trim()" (click)="createProject.emit()">
          Create
        </button>

        <div class="error" *ngIf="projectsError">{{ projectsError }}</div>
      </div>

      <app-projects-stats
        [averageScore]="averageScore"
        [percentageMetDeadline]="percentageMetDeadline"
      ></app-projects-stats>

      <div class="filters">
        <label class="filter">
          Filter by project name
          <input
            type="text"
            placeholder="e.g. Apollo"
            (input)="nameFilterInput.emit($any($event.target).value)"
          />
        </label>

        <label class="filter">
          Made deadline
          <select (change)="deadlineFilterInput.emit($any($event.target).value)">
            <option value="all">All</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </label>
      </div>

      <table class="projects-table" *ngIf="visibleProjects.length > 0; else noProjectsTpl">
        <thead>
          <tr>
            <th class="sortable" (click)="sortChange.emit('name')">
              Project Name
              <span class="sort-indicator" *ngIf="sortColumn === 'name'">
                {{ sortDirection === 'asc' ? '^' : 'v' }}
              </span>
            </th>

            <th class="sortable" (click)="sortChange.emit('score')">
              Score
              <span class="sort-indicator" *ngIf="sortColumn === 'score'">
                {{ sortDirection === 'asc' ? '^' : 'v' }}
              </span>
            </th>

            <th class="sortable" (click)="sortChange.emit('durationInDays')">
              Duration In Days
              <span class="sort-indicator" *ngIf="sortColumn === 'durationInDays'">
                {{ sortDirection === 'asc' ? '^' : 'v' }}
              </span>
            </th>

            <th class="sortable" (click)="sortChange.emit('bugsCount')">
              Bugs Count
              <span class="sort-indicator" *ngIf="sortColumn === 'bugsCount'">
                {{ sortDirection === 'asc' ? '^' : 'v' }}
              </span>
            </th>

            <th class="sortable" (click)="sortChange.emit('madeDeadline')">
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
              <button type="button" [disabled]="projectsBusy" (click)="startEdit.emit(p)">Edit</button>
              <button type="button" class="danger" [disabled]="projectsBusy" (click)="deleteProject.emit(p.id)">Delete</button>
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
            <input
              type="text"
              [value]="editDraft.name"
              (input)="onEditTextInput($any($event.target).value)"
            />
          </label>

          <label>
            Score
            <input
              type="number"
              [value]="editDraft.score"
              (input)="onEditNumberInput($any($event.target).value, 'score')"
            />
          </label>

          <label>
            Duration In Days
            <input
              type="number"
              [value]="editDraft.durationInDays"
              (input)="onEditNumberInput($any($event.target).value, 'durationInDays')"
            />
          </label>

          <label>
            Bugs Count
            <input
              type="number"
              [value]="editDraft.bugsCount"
              (input)="onEditNumberInput($any($event.target).value, 'bugsCount')"
            />
          </label>

          <label class="checkbox">
            <input
              type="checkbox"
              [checked]="editDraft.madeDeadline"
              (change)="editMadeDeadlineChange.emit($any($event.target).checked)"
            />
            Made Deadline
          </label>
        </div>

        <div class="edit-actions">
          <button type="button" [disabled]="projectsBusy || !editDraft.name.trim()" (click)="saveEdit.emit()">
            Save
          </button>
          <button type="button" class="secondary" [disabled]="projectsBusy" (click)="cancelEdit.emit()">
            Cancel
          </button>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .card {
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        padding: 14px;
        background: white;
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
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectsTableComponent {
  @Input({ required: true }) projectsBusy!: boolean;
  @Input() projectsError: string | null = null;

  @Input({ required: true }) newProject!: ProjectCreateRequest;
  @Input({ required: true }) averageScore!: number;
  @Input({ required: true }) percentageMetDeadline!: number;

  @Input({ required: true }) nameFilter!: string;
  @Input({ required: true }) deadlineFilter!: DeadlineFilter;

  @Input({ required: true }) sortColumn!: SortColumn;
  @Input({ required: true }) sortDirection!: 'asc' | 'desc';

  @Input({ required: true }) visibleProjects!: Project[];

  @Input({ required: true }) editProjectId!: number | null;
  @Input({ required: true }) editDraft!: ProjectUpdateRequest;

  @Output() nameFilterInput = new EventEmitter<string>();
  @Output() deadlineFilterInput = new EventEmitter<string>();
  @Output() sortChange = new EventEmitter<SortColumn>();

  @Output() createProject = new EventEmitter<void>();
  @Output() deleteProject = new EventEmitter<number>();
  @Output() startEdit = new EventEmitter<Project>();
  @Output() cancelEdit = new EventEmitter<void>();
  @Output() saveEdit = new EventEmitter<void>();

  @Output() newTextInput = new EventEmitter<{ value: string; field: 'name' }>();
  @Output() newNumberInput = new EventEmitter<{ value: string; field: 'score' | 'durationInDays' | 'bugsCount' }>();
  @Output() newMadeDeadlineChange = new EventEmitter<boolean>();

  @Output() editTextInput = new EventEmitter<{ value: string; field: 'name' }>();
  @Output() editNumberInput = new EventEmitter<{ value: string; field: 'score' | 'durationInDays' | 'bugsCount' }>();
  @Output() editMadeDeadlineChange = new EventEmitter<boolean>();

  onNewTextInput(value: string): void {
    this.newTextInput.emit({ value, field: 'name' });
  }

  onNewNumberInput(value: string, field: 'score' | 'durationInDays' | 'bugsCount'): void {
    this.newNumberInput.emit({ value, field });
  }

  onNewMadeDeadlineChange(checked: boolean): void {
    this.newMadeDeadlineChange.emit(checked);
  }

  onEditTextInput(value: string): void {
    this.editTextInput.emit({ value, field: 'name' });
  }

  onEditNumberInput(value: string, field: 'score' | 'durationInDays' | 'bugsCount'): void {
    this.editNumberInput.emit({ value, field });
  }
}

