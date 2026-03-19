import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-projects-stats',
  imports: [CommonModule],
  templateUrl: './projects-stats.component.html',
  styleUrls: ['./projects-stats.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectsStatsComponent {
  @Input({ required: true }) averageScore!: number;
  @Input({ required: true }) percentageMetDeadline!: number;
}

