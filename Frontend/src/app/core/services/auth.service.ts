import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';

import { AuthResponse, LoginRequest, PersonalDetails, RegisterRequest } from '../../shared/models/auth.models';
import { environment } from '../../../environments/environment';

const TOKEN_KEY = 'projecthub_token';
const PERSONAL_DETAILS_KEY = 'projecthub_personalDetails';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenSubject = new BehaviorSubject<string | null>(this.readTokenFromStorage());
  private readonly personalDetailsSubject = new BehaviorSubject<PersonalDetails | null>(this.readPersonalDetailsFromStorage());

  readonly token$ = this.tokenSubject.asObservable();
  readonly personalDetails$ = this.personalDetailsSubject.asObservable();

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router
  ) {}

  login(email: string, password: string): Observable<AuthResponse> {
    const body: LoginRequest = { email, password };

    return this.http
      .post<AuthResponse>(`${environment.apiBaseUrl}/api/auth/login`, body)
      .pipe(
        tap((res: AuthResponse) => {
          if (res?.token && res?.personalDetails) {
            // Backend in this repo may return empty avatar and hardcoded name/team.
            // If we already have personalDetails in storage (e.g. from a just-completed register),
            // prefer the locally stored values when the backend returned empty fields.
            const backendPd = res.personalDetails;
            const existingPd = this.personalDetailsSubject.value ?? this.readPersonalDetailsFromStorage();

            const shouldPreferExisting =
              !!existingPd &&
              (backendPd.avatar.trim().length === 0 || backendPd.avatar === '');

            const pdToStore = shouldPreferExisting
              ? {
                  ...backendPd,
                  name: existingPd!.name || backendPd.name,
                  team: existingPd!.team || backendPd.team,
                  avatar: existingPd!.avatar || backendPd.avatar,
                  joinedDate: backendPd.joinedDate || existingPd!.joinedDate
                }
              : backendPd;

            this.setSession(res.token, pdToStore);
          }
        })
      );
  }

  register(payload: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiBaseUrl}/api/auth/register`, payload);
  }

  getToken(): string | null {
    return this.tokenSubject.value;
  }

  getPersonalDetails(): PersonalDetails | null {
    return this.personalDetailsSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.tokenSubject.value;
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PERSONAL_DETAILS_KEY);
    this.tokenSubject.next(null);
    this.personalDetailsSubject.next(null);
    this.router.navigateByUrl('/login');
  }

  /**
   * Allows screens (e.g. Register) to override what the backend returned
   * and persist the correct UI details for the current session.
   */
  applySession(token: string, personalDetails: PersonalDetails): void {
    this.setSession(token, personalDetails);
  }

  private setSession(token: string, personalDetails: PersonalDetails): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(PERSONAL_DETAILS_KEY, JSON.stringify(personalDetails));
    this.tokenSubject.next(token);
    this.personalDetailsSubject.next(personalDetails);
  }

  private readTokenFromStorage(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private readPersonalDetailsFromStorage(): PersonalDetails | null {
    const raw = localStorage.getItem(PERSONAL_DETAILS_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as PersonalDetails;
    } catch {
      return null;
    }
  }
}

