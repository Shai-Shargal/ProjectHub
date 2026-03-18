import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';

const PASSWORD_REGEX = /^(?=.*\d)(?=.*[A-Z]).{8,}$/;

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="auth-shell">
      <h2>Login</h2>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
        <label>
          Email
          <input type="email" formControlName="email" autocomplete="email" />
        </label>
        <div class="error" *ngIf="emailInvalid">
          Please enter a valid email address.
        </div>

        <label>
          Password
          <input type="password" formControlName="password" autocomplete="current-password" />
        </label>

        <button type="submit" [disabled]="form.invalid || loading">
          Login
        </button>

        <div class="loading" *ngIf="loading" role="status">
          Logging in...
        </div>

        <div class="error" *ngIf="errorMessage">
          {{ errorMessage }}
        </div>

        <p class="register-link">
          <a routerLink="/register">Create Account / Register</a>
        </p>
      </form>
    </div>
  `,
  styles: [
    `
      .auth-shell {
        max-width: 420px;
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
export class LoginComponent {
  loading = false;
  errorMessage: string | null = null;

  readonly form: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {
    // Initialize the form after `fb` exists to satisfy strict Angular compiler checks.
    this.form = this.fb.group({
      email: this.fb.control('', {
        nonNullable: true,
        validators: [Validators.required, Validators.email]
      }),
      password: this.fb.control('', {
        nonNullable: true,
        validators: [Validators.required, Validators.pattern(PASSWORD_REGEX)]
      })
    });
  }

  get emailInvalid(): boolean {
    const control = this.form.get('email');
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading) return;

    const { email, password } = this.form.getRawValue() as { email: string; password: string };
    this.loading = true;
    this.errorMessage = null;

    this.authService.login(email, password).subscribe({
      next: (res) => {
        this.loading = false;
        // login is expected to return token/personalDetails, but we keep it defensive
        if (res?.token && res?.personalDetails) {
          this.router.navigateByUrl('/info');
        } else {
          this.router.navigateByUrl('/login');
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = this.extractErrorMessage(err, 'Login failed');
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

