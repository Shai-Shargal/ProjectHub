import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { Project, ProjectCreateRequest, ProjectUpdateRequest } from '../../../../shared/models/project.models';
import { DeadlineFilter, SortColumn } from '../../utils/projects-table.utils';

import { ProjectsStatsComponent } from '../projects-stats/projects-stats.component';

@Component({
  standalone: true,
  selector: 'app-projects-table',
  imports: [CommonModule, ProjectsStatsComponent],
  templateUrl: './projects-table.component.html',
  styleUrls: ['./projects-table.component.scss'],
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

