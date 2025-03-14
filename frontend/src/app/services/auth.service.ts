import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { environment } from '../../environments/environment';

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/user`;
  private userSubject = new BehaviorSubject<User | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  
  // Public observables
  public user$ = this.userSubject.asObservable();
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  
  constructor(
    private http: HttpClient,
    private router: Router,
    private cookieService: CookieService
  ) { }
  
  // Check if user is already authenticated
  checkAuthStatus(): void {
    const token = this.cookieService.get('auth_token');
    if (token) {
      this.http.get<{success: boolean, user: User}>(`${this.apiUrl}/profile`)
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.userSubject.next(response.user);
              this.isAuthenticatedSubject.next(true);
              localStorage.setItem('user_id', response.user.id);
            } else {
              this.logout();
            }
          },
          error: () => {
            this.logout();
          }
        });
    }
  }
  
  // Register a new user
  register(username: string, email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, {
      username,
      email,
      password
    }).pipe(
      tap(response => {
        if (response.success) {
          this.handleAuthentication(response.token, response.user);
        }
      })
    );
  }
  
  // Login user
  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, {
      email,
      password
    }).pipe(
      tap(response => {
        if (response.success) {
          this.handleAuthentication(response.token, response.user);
        }
      })
    );
  }
  
  // Handle successful authentication
  private handleAuthentication(token: string, user: User): void {
    // Store token in cookie (expires in 24 hours)
    this.cookieService.set('auth_token', token, 1);
    
    // Store user ID in localStorage for chat
    localStorage.setItem('user_id', user.id);
    
    // Update subjects
    this.userSubject.next(user);
    this.isAuthenticatedSubject.next(true);
  }
  
  // Logout user
  logout(): void {
    const token = this.cookieService.get('auth_token');
    if (token) {
      this.http.post<{success: boolean}>(`${this.apiUrl}/logout`, {})
        .subscribe();
    }
    
    // Clear stored data
    this.cookieService.delete('auth_token');
    localStorage.removeItem('user_id');
    
    // Update subjects
    this.userSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    
    // Redirect to home
    this.router.navigate(['/']);
  }
  
  // Get current authentication state
  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.getValue();
  }
  
  // Get current user
  getCurrentUser(): User | null {
    return this.userSubject.getValue();
  }
}
