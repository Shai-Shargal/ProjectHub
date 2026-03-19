import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';

const PASSWORD_REGEX = /^(?=.*\d)(?=.*[A-Z]).{8,}$/;

@Component({
  standalone: true,
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegisterComponent {
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
        // Auto-login after successful registration and redirect to /info.
        this.router.navigateByUrl('/info');
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

