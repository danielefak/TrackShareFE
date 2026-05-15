import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ENVIRONMENT } from '../environment';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { NotificationService } from './notification.service';

export interface Profile {
  id: number;
  email: string;
  first_name: string;
  is_active: boolean;
  notify: boolean;
  friend_key?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private env = inject(ENVIRONMENT);
  private apiUrl = this.env.apiUrl;

  private notif = inject(NotificationService);

  constructor(private http: HttpClient, private router: Router) {}

  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/v1/token`, { username, password }).pipe(
      map(response => {
        localStorage.setItem('access_token', response.access_token);
        return response;
      }),
      tap(() => { this.notif.subscribe(); this.notif.refreshCount(); })
    );
  }

  register(email: string, password: string, first_name: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/v1/register`, { email, password, first_name }).pipe(
      map(response => {
        localStorage.setItem('access_token', response.access_token);
        return response;
      }),
      tap(() => { this.notif.subscribe(); this.notif.refreshCount(); })
    );
  }

  logout(): void {
    this.notif.unsubscribe();
    localStorage.removeItem('access_token');
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }

  verifyToken(token: string): Observable<boolean> {
    return this.http.post<{ valid: boolean }>(`${this.apiUrl}/verify-token`, { token }).pipe(
      map(response => response.valid),
      catchError(() => of(false))
    );
  }

  getProfile(): Observable<Profile> {
    return this.http.get<Profile>(`${this.apiUrl}/v1/profile`);
  }

  updateProfile(data: { first_name?: string; email?: string; notify?: boolean }): Observable<Profile> {
    return this.http.put<Profile>(`${this.apiUrl}/v1/profile`, data);
  }

  changePassword(old_password: string, new_password: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/v1/profile/password`, { old_password, new_password });
  }

  refreshFriendKey(): Observable<Profile> {
    return this.http.post<Profile>(`${this.apiUrl}/v1/profile/refresh-key`, {});
  }

  checkAuthStatus(): void {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    this.verifyToken(token).subscribe(valid => {
      if (!valid) this.logout();
    });
  }
}
