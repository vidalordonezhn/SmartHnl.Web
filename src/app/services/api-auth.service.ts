import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserSession {
  id: string;
  username: string;
  name: string;
  role: string;
  permissions: any;
  token?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiAuthService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/auth`;

  currentUser = signal<UserSession | null>(this.loadStoredUser());

  login(credentials: { username: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => {
        if (res?.token && res?.user) {
          localStorage.setItem('smarthnl_token', res.token);
          localStorage.setItem('smarthnl_user', JSON.stringify(res.user));
          this.currentUser.set(res.user);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('smarthnl_token');
    localStorage.removeItem('smarthnl_user');
    this.currentUser.set(null);
  }

  private loadStoredUser(): UserSession | null {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem('smarthnl_user');
    return stored ? JSON.parse(stored) : null;
  }
}
