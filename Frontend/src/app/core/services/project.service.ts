import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map } from 'rxjs/operators';

import { AuthService } from './auth.service';
import { Project, ProjectCreateRequest, ProjectUpdateRequest } from '../../shared/models/project.models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService
  ) {}

  getProjects(): Observable<Project[]> {
    const token = this.authService.getToken();
    if (!token) {
      return throwError(() => new Error('Not authenticated'));
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.get<any[]>(`${environment.apiBaseUrl}/api/projects`, { headers }).pipe(map((items) => (items ?? []).map((p) => this.normalizeProject(p))));
  }

  getProjectById(id: number): Observable<Project> {
    const token = this.authService.getToken();
    if (!token) {
      return throwError(() => new Error('Not authenticated'));
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.get<any>(`${environment.apiBaseUrl}/api/projects/${id}`, { headers }).pipe(map((p) => this.normalizeProject(p)));
  }

  createProject(payload: ProjectCreateRequest): Observable<Project> {
    const token = this.authService.getToken();
    if (!token) {
      return throwError(() => new Error('Not authenticated'));
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.post<any>(`${environment.apiBaseUrl}/api/projects`, payload, { headers }).pipe(map((p) => this.normalizeProject(p)));
  }

  updateProject(id: number, payload: ProjectUpdateRequest): Observable<Project> {
    const token = this.authService.getToken();
    if (!token) {
      return throwError(() => new Error('Not authenticated'));
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.put<any>(`${environment.apiBaseUrl}/api/projects/${id}`, payload, { headers }).pipe(map((p) => this.normalizeProject(p)));
  }

  deleteProject(id: number): Observable<void> {
    const token = this.authService.getToken();
    if (!token) {
      return throwError(() => new Error('Not authenticated'));
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.delete<any>(`${environment.apiBaseUrl}/api/projects/${id}`, { headers }).pipe(map(() => undefined));
  }

  private normalizeProject(p: any): Project {
    return {
      id: p.id ?? p.Id ?? 0,
      name: p.name ?? p.Name ?? '',
      score: p.score ?? p.Score ?? 0,
      durationInDays: p.durationInDays ?? p.DurationInDays ?? 0,
      bugsCount: p.bugsCount ?? p.BugsCount ?? 0,
      madeDeadline: p.madeDeadline ?? p.MadeDeadline ?? false
    };
  }
}

