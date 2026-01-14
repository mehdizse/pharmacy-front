import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';

import { AuthService } from '../../../core/services/auth.service';
import { LoginRequest } from '../../../shared/models/auth.model';
import { AuthResponse } from '../../../shared/models/auth.model';
import { ConnectionTestComponent } from '../../../shared/components/connection-test/connection-test.component';

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
    ConnectionTestComponent
  ],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <app-connection-test></app-connection-test>
        
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Pharmacie Manager
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600">
            Connectez-vous à votre compte
          </p>
        </div>
        
        <mat-card class="p-8">
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-6">
            <div>
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Nom d'utilisateur</mat-label>
                <input matInput 
                       formControlName="username" 
                       placeholder="Entrez votre nom d'utilisateur"
                       [required]="true">
                <mat-error *ngIf="loginForm.get('username')?.hasError('required')">
                  Le nom d'utilisateur est requis
                </mat-error>
              </mat-form-field>
            </div>

            <div>
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Mot de passe</mat-label>
                <input matInput 
                       type="password" 
                       formControlName="password" 
                       placeholder="Entrez votre mot de passe"
                       [required]="true">
                <mat-error *ngIf="loginForm.get('password')?.hasError('required')">
                  Le mot de passe est requis
                </mat-error>
              </mat-form-field>
            </div>

            <div class="flex items-center justify-between">
              <div class="text-sm">
                <a href="#" class="font-medium text-blue-600 hover:text-blue-500">
                  Mot de passe oublié?
                </a>
              </div>
            </div>

            <div>
              <button type="submit" 
                      mat-raised-button 
                      color="primary"
                      class="w-full py-3 text-base font-medium"
                      [disabled]="loginForm.invalid || isLoading">
                <span *ngIf="!isLoading">Se connecter</span>
                <mat-spinner *ngIf="isLoading" diameter="20"></mat-spinner>
              </button>
            </div>
          </form>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .mat-mdc-form-field {
      width: 100%;
    }
    
    button[mat-raised-button] {
      min-height: 48px;
    }
  `]
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  returnUrl: string;

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
        console.log('Réponse du backend:', response); // Debug
        console.log('Token:', response.token); // Debug
        console.log('User:', response.user); // Debug
        
        this.authService.setCurrentUser(response);
        this.isLoading = false; // Ajouté pour arrêter le loading
        this.snackBar.open('Connexion réussie', 'Fermer', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        
        console.log('Redirection vers:', this.returnUrl); // Debug
        
        this.router.navigate([this.returnUrl]).then(
          () => console.log('Redirection réussie'),
          (err) => console.error('Erreur de redirection:', err)
        );
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
