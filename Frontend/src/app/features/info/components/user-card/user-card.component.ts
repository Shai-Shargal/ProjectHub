import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { PersonalDetails } from '../../../../shared/models/auth.models';

@Component({
  standalone: true,
  selector: 'app-user-card',
  imports: [CommonModule],
  template: `
    <section class="card user-card">
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
  `,
  styles: [
    `
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
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserCardComponent {
  @Input() personalDetails!: PersonalDetails;
}

