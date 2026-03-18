import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';

const PASSWORD_REGEX = /^(?=.*\d)(?=.*[A-Z]).{8,}$/;

@Component({
  standalone: true,
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="auth-shell">
      <h2>Create Account</h2>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
        <label>
          Name
          <input type="text" formControlName="name" autocomplete="name" />
        </label>
        <div class="error" *ngIf="nameInvalid">
          Name is required.
        </div>

        <label>
          Email
          <input type="email" formControlName="email" autocomplete="email" />
        </label>
        <div class="error" *ngIf="emailInvalid">
          Please enter a valid email address.
        </div>

        <label>
          Password
          <input type="password" formControlName="password" autocomplete="new-password" />
        </label>
        <div class="error" *ngIf="passwordInvalid">
          Password must be at least 8 characters and include at least one digit and one uppercase letter.
        </div>

        <label>
          Team
          <input type="text" formControlName="team" autocomplete="organization" />
        </label>
        <div class="error" *ngIf="teamInvalid">
          Team is required.
        </div>

        <label>
          Avatar
          <input type="text" formControlName="avatar" placeholder="e.g. https://..." />
        </label>
        <div class="error" *ngIf="avatarInvalid">
          Avatar is required.
        </div>

        <button type="submit" [disabled]="form.invalid || loading">
          Create Account
        </button>

        <div class="loading" *ngIf="loading" role="status">
          Creating account...
        </div>

        <div class="error" *ngIf="errorMessage">
          {{ errorMessage }}
        </div>

        <p class="register-link">
          <a routerLink="/login">Back to Login</a>
        </p>
      </form>
    </div>
  `,
  styles: [
    `
      .auth-shell {
        max-width: 520px;
        margin: 24px auto;
        padding: 16px;
      }
      label {
        display: block;
        margin-bottom: 10px;
      }
      input {
        width: 100%;
        box-sizing: border-box;
        padding: 8px;
        margin-top: 6px;
      }
      button {
        width: 100%;
        padding: 10px;
        margin-top: 10px;
      }
      .error {
        color: #b00020;
        margin-top: 6px;
      }
      .loading {
        margin-top: 10px;
      }
      .register-link {
        margin-top: 14px;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegisterComponent {
  loading = false;
  errorMessage: string | null = null;

  readonly form: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService
  ) {
    // Initialize the form after `fb` exists to satisfy strict Angular compiler checks.
    this.form = this.fb.group({
      name: this.fb.control('', {
        nonNullable: true,
        validators: [Validators.required]
      }),
      email: this.fb.control('', {
        nonNullable: true,
        validators: [Validators.required, Validators.email]
      }),
      password: this.fb.control('', {
        nonNullable: true,
        validators: [Validators.required, Validators.pattern(PASSWORD_REGEX)]
      }),
      team: this.fb.control('', {
        nonNullable: true,
        validators: [Validators.required]
      }),
      avatar: this.fb.control('', {
        nonNullable: true,
        validators: [Validators.required]
      })
    });
  }

  get nameInvalid(): boolean {
    const c = this.form.get('name');
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  get emailInvalid(): boolean {
    const c = this.form.get('email');
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  get passwordInvalid(): boolean {
    const c = this.form.get('password');
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  get teamInvalid(): boolean {
    const c = this.form.get('team');
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  get avatarInvalid(): boolean {
    const c = this.form.get('avatar');
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading) return;

    const { name, email, password, team, avatar } = this.form.getRawValue() as {
      name: string;
      email: string;
      password: string;
      team: string;
      avatar: string;
    };
    this.loading = true;
    this.errorMessage = null;

    this.authService.register({ name, email, password, team, avatar }).subscribe({
      next: () => {
        this.loading = false;
        // Requirement: do NOT auto-login after registering.
        // Clear any existing session artifacts and send the user to login.
        this.authService.logout();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = this.extractErrorMessage(err, 'Registration failed');
      }
    });
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

