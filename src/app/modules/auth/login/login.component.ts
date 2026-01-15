import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CommonModule } from '@angular/common';

import { AuthService } from '../../../core/services/auth.service';
import { LoginRequest } from '../../../shared/models/auth.model';
import { AuthResponse } from '../../../shared/models/auth.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatCheckboxModule
  ],
  template: `
    <div class="login-container">
      <!-- Background avec dégradé -->
      <div class="background-gradient"></div>
      
      <!-- Carte de connexion -->
      <div class="login-card">
        <mat-card class="modern-card">
          <!-- Header avec logo et titre -->
          <div class="login-header">
            <div class="logo-container">
              <mat-icon class="logo-icon">medication</mat-icon>
            </div>
            <h1 class="login-title">Pharmacie Manager</h1>
            <p class="login-subtitle">Gestion professionnelle de votre pharmacie</p>
          </div>
          
          <!-- Formulaire -->
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
            <!-- Champ Nom d'utilisateur -->
            <div class="form-field">
              <mat-form-field appearance="outline" class="modern-field">
                <mat-label>
                  <mat-icon class="field-icon">person</mat-icon>
                  Nom d'utilisateur
                </mat-label>
                <input matInput 
                       formControlName="username" 
                       placeholder="Entrez votre nom d'utilisateur"
                       [required]="true">
                <mat-error *ngIf="loginForm.get('username')?.hasError('required')">
                  Le nom d'utilisateur est requis
                </mat-error>
              </mat-form-field>
            </div>

            <!-- Champ Mot de passe avec bouton oeil -->
            <div class="form-field">
              <mat-form-field appearance="outline" class="modern-field">
                <mat-label>
                  <mat-icon class="field-icon">lock</mat-icon>
                  Mot de passe
                </mat-label>
                <input matInput 
                       [type]="hidePassword ? 'password' : 'text'" 
                       formControlName="password" 
                       placeholder="Entrez votre mot de passe"
                       [required]="true">
                <button mat-icon-button 
                        matSuffix 
                        (click)="hidePassword = !hidePassword"
                        class="password-toggle"
                        type="button">
                  <mat-icon>{{ hidePassword ? 'visibility' : 'visibility_off' }}</mat-icon>
                </button>
                <mat-error *ngIf="loginForm.get('password')?.hasError('required')">
                  Le mot de passe est requis
                </mat-error>
              </mat-form-field>
            </div>

            <!-- Options supplémentaires -->
            <div class="form-options">
              <mat-checkbox class="remember-me">
                Se souvenir de moi
              </mat-checkbox>
              <a href="#" class="forgot-password">Mot de passe oublié?</a>
            </div>

            <!-- Bouton de connexion -->
            <button type="submit" 
                    mat-raised-button 
                    color="primary"
                    class="login-button"
                    [disabled]="loginForm.invalid || isLoading">
              <mat-icon *ngIf="!isLoading">login</mat-icon>
              <mat-spinner *ngIf="isLoading" 
                          diameter="20" 
                          strokeWidth="3"
                          class="white-spinner"></mat-spinner>
              <span *ngIf="!isLoading">Se connecter</span>
            </button>
          </form>
          
          <!-- Footer -->
          <div class="login-footer">
            <p class="version-info">Version 1.0.0</p>
            <p class="copyright">© 2026 Pharmacie Manager</p>
          </div>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      position: relative;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      overflow: hidden;
    }

    .background-gradient {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      z-index: -1;
    }

    .background-gradient::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="50" cy="10" r="0.5" fill="rgba(255,255,255,0.05)"/><circle cx="20" cy="60" r="0.5" fill="rgba(255,255,255,0.05)"/><circle cx="80" cy="40" r="0.5" fill="rgba(255,255,255,0.05)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
      opacity: 0.3;
    }

    .login-card {
      width: 100%;
      max-width: 420px;
    }

    .modern-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 20px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      overflow: hidden;
      padding: 0;
    }

    .login-header {
      text-align: center;
      padding: 3rem 2rem 2rem;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
    }

    .logo-container {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      margin-bottom: 1.5rem;
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
    }

    .logo-icon {
      font-size: 40px;
      color: white;
      height: 40px;
      width: 40px;
    }

    .login-title {
      font-size: 2rem;
      font-weight: 700;
      color: #1a202c;
      margin: 0 0 0.5rem 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .login-subtitle {
      font-size: 0.95rem;
      color: #718096;
      margin: 0;
      font-weight: 400;
    }

    .login-form {
      padding: 2rem;
    }

    .form-field {
      margin-bottom: 1.5rem;
    }

    .modern-field {
      width: 100%;
    }

    .modern-field .mat-mdc-text-field-wrapper {
      background: rgba(255, 255, 255, 0.8);
      border-radius: 12px;
      border: 1px solid rgba(102, 126, 234, 0.2);
      transition: all 0.3s ease;
    }

    .modern-field:hover .mat-mdc-text-field-wrapper {
      border-color: rgba(102, 126, 234, 0.4);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
    }

    .modern-field.mat-focused .mat-mdc-text-field-wrapper {
      border-color: #667eea;
      box-shadow: 0 4px 20px rgba(102, 126, 234, 0.2);
    }

    .field-icon {
      font-size: 18px;
      height: 18px;
      width: 18px;
      margin-right: 8px;
      color: #667eea;
    }

    .password-toggle {
      opacity: 0.7;
      transition: opacity 0.3s ease;
    }

    .password-toggle:hover {
      opacity: 1;
    }

    .white-spinner {
      stroke: white !important;
    }

    .form-options {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .remember-me {
      font-size: 0.9rem;
    }

    .forgot-password {
      font-size: 0.9rem;
      color: #667eea;
      text-decoration: none;
      transition: color 0.3s ease;
    }

    .forgot-password:hover {
      color: #764ba2;
      text-decoration: underline;
    }

    .login-button {
      width: 100%;
      height: 56px;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 600;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.3s ease;
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
    }

    .login-button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 12px 30px rgba(102, 126, 234, 0.4);
    }

    .login-button:disabled {
      opacity: 0.7;
      transform: none;
    }

    .login-footer {
      text-align: center;
      padding: 1.5rem;
      background: rgba(248, 250, 252, 0.5);
      border-top: 1px solid rgba(102, 126, 234, 0.1);
    }

    .version-info {
      font-size: 0.8rem;
      color: #718096;
      margin: 0 0 0.25rem 0;
    }

    .copyright {
      font-size: 0.75rem;
      color: #a0aec0;
      margin: 0;
    }

    /* Responsive */
    @media (max-width: 480px) {
      .login-container {
        padding: 1rem;
      }
      
      .login-header {
        padding: 2rem 1.5rem 1.5rem;
      }
      
      .login-form {
        padding: 1.5rem;
      }
      
      .login-title {
        font-size: 1.75rem;
      }
      
      .form-options {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
      }
    }

    /* Animations */
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .modern-card {
      animation: fadeInUp 0.6s ease-out;
    }

    .logo-container {
      animation: fadeInUp 0.6s ease-out 0.2s both;
    }

    .login-title {
      animation: fadeInUp 0.6s ease-out 0.3s both;
    }

    .login-subtitle {
      animation: fadeInUp 0.6s ease-out 0.4s both;
    }

    .form-field {
      animation: fadeInUp 0.6s ease-out 0.5s both;
    }

    .form-field:nth-child(2) {
      animation-delay: 0.6s;
    }

    .form-options {
      animation: fadeInUp 0.6s ease-out 0.7s both;
    }

    .login-button {
      animation: fadeInUp 0.6s ease-out 0.8s both;
    }
  `]
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  returnUrl: string;
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
    
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.router.navigate([this.returnUrl]);
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;

    const loginRequest: LoginRequest = {
      username: this.loginForm.value.username,
      password: this.loginForm.value.password
    };

    this.authService.login(loginRequest).subscribe({
      next: (response: AuthResponse) => {
        this.authService.setCurrentUser(response);
        this.isLoading = false;
        this.snackBar.open('Connexion réussie', 'Fermer', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        
        this.router.navigate([this.returnUrl]);
      },
      error: (error: any) => {
        this.isLoading = false;
        this.snackBar.open(
          error.error?.message || 'Erreur lors de la connexion', 
          'Fermer', 
          {
            duration: 5000,
            panelClass: ['error-snackbar']
          }
        );
      }
    });
  }
}
