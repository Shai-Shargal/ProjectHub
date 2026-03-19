import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-projects-stats',
  imports: [CommonModule],
  template: `
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
  `,
  styles: [
    `
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
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectsStatsComponent {
  @Input({ required: true }) averageScore!: number;
  @Input({ required: true }) percentageMetDeadline!: number;
}

