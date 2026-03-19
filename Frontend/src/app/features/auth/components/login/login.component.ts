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
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
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

