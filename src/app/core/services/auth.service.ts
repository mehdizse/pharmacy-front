import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { User, AuthResponse, LoginRequest, RegisterRequest, UserRole } from '../../shared/models/auth.model';
import { ApiResponse } from '../../shared/models/api.model';
import { ConfirmationService } from './confirmation.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  
  public currentUser$ = this.currentUserSubject.asObservable();
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private router: Router,
    private confirmationService: ConfirmationService
  ) {
    this.checkAuthStatus();
  }

  private checkAuthStatus(): void {
    const token = localStorage.getItem('auth_token');
    const userInfo = localStorage.getItem('user_info');
    
    if (token && userInfo) {
      try {
        const user = JSON.parse(userInfo);
        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(true);
      } catch (error) {
        this.logout();
      }
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>('/api/auth/login/', credentials).pipe(
      map(response => response.data || response) // Gère les deux formats de réponse
    );
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>('/api/auth/register/', userData).pipe(
      map(response => response.data)
    );
  }

  logout(): void {
    this.confirmationService.confirmLogout().subscribe(confirmed => {
      if (confirmed) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_info');
        this.currentUserSubject.next(null);
        this.isAuthenticatedSubject.next(false);
        this.router.navigate(['/auth']);
      }
    });
  }

  refreshToken(): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>('/api/auth/refresh/', {}).pipe(
      map(response => response.data)
    );
  }

  getCurrentUser(): Observable<User> {
    return this.apiService.get<User>('/api/auth/user/').pipe(
      map(response => response.data)
    );
  }

  setCurrentUser(authResponse: AuthResponse): void {
    if (!authResponse || !authResponse.token) {
      throw new Error('Réponse d\'authentification invalide');
    }
    
    localStorage.setItem('auth_token', authResponse.token);
    localStorage.setItem('user_info', JSON.stringify(authResponse.user));
    this.currentUserSubject.next(authResponse.user);
    this.isAuthenticatedSubject.next(true);
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  getUser(): User | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    const value = this.isAuthenticatedSubject.value;
    
    // Solution de secours : si le BehaviorSubject n'est pas à jour mais le token existe
    const token = localStorage.getItem('auth_token');
    if (token && !value) {
      this.isAuthenticatedSubject.next(true);
      return true;
    }
    
    return value;
  }

  hasRole(role: UserRole): boolean {
    const user = this.getUser();
    return user ? user.role === role : false;
  }

  hasAnyRole(roles: UserRole[]): boolean {
    const user = this.getUser();
    return user ? roles.includes(user.role) : false;
  }

  isAdmin(): boolean {
    return this.hasRole(UserRole.ADMIN);
  }

  isPharmacien(): boolean {
    return this.hasRole(UserRole.PHARMACIEN);
  }

  isComptable(): boolean {
    return this.hasRole(UserRole.COMPTABLE);
  }

  canAccessAdminFeatures(): boolean {
    return this.hasAnyRole([UserRole.ADMIN, UserRole.PHARMACIEN]);
  }

  canAccessFinancialFeatures(): boolean {
    return this.hasAnyRole([UserRole.ADMIN, UserRole.PHARMACIEN, UserRole.COMPTABLE]);
  }

  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) {
      return true;
    }

    try {
      if (token.split('.').length < 2) {
        return false; // Si le token n'a pas de payload, on considère qu'il n'expire pas
      }
      
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now() / 1000;
      
      return payload.exp < now;
    } catch (error) {
      return false;
    }
  }

  updateProfile(userData: Partial<User>): Observable<User> {
    return this.apiService.patch<User>(`/api/auth/user/${userData.id}/`, userData).pipe(
      map(response => response.data)
    );
  }

  changePassword(oldPassword: string, newPassword: string): Observable<any> {
    return this.apiService.post('/api/auth/change-password/', {
      old_password: oldPassword,
      new_password: newPassword
    });
  }
}
