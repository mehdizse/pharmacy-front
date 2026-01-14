import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-connection-test',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-4 bg-gray-100 rounded-lg mb-4">
      <h3 class="text-lg font-bold mb-2">Test de connexion au backend</h3>
      
      <div class="space-y-2">
        <p><strong>URL du backend:</strong> {{ baseUrl }}</p>
        <p><strong>Statut:</strong> 
          <span [class]="connectionStatus === 'success' ? 'text-green-600' : connectionStatus === 'error' ? 'text-red-600' : 'text-yellow-600'">
            {{ connectionStatusText }}
          </span>
        </p>
        <p><strong>Authentification:</strong> 
          <span [class]="isAuthenticated ? 'text-green-600' : 'text-red-600'">
            {{ isAuthenticated ? 'Connecté' : 'Non connecté' }}
          </span>
        </p>
        <p *ngIf="token"><strong>Token:</strong> {{ token.substring(0, 20) }}...</p>
        <p *ngIf="userInfo"><strong>Utilisateur:</strong> {{ userInfo.username }}</p>
        <p *ngIf="error"><strong>Erreur:</strong> {{ error }}</p>
      </div>
      
      <div class="mt-4 space-x-2">
        <button (click)="testConnection()" 
                class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Tester la connexion
        </button>
        <button (click)="checkAuth()" 
                class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
          Vérifier l'auth
        </button>
        <button (click)="clearAuth()" 
                class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
          Effacer l'auth
        </button>
      </div>
    </div>
  `
})
export class ConnectionTestComponent implements OnInit {
  baseUrl = 'http://localhost:8000';
  connectionStatus: 'idle' | 'success' | 'error' = 'idle';
  connectionStatusText = 'Non testé';
  isAuthenticated = false;
  token: string | null = null;
  userInfo: any = null;
  error: string | null = null;

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.checkAuth();
    this.testConnection();
  }

  testConnection(): void {
    this.connectionStatus = 'idle';
    this.connectionStatusText = 'Test en cours...';
    this.error = null;

    // Test simple de connexion au backend
    this.apiService.get('/api/health/').subscribe({
      next: (response) => {
        this.connectionStatus = 'success';
        this.connectionStatusText = 'Connecté avec succès';
        console.log('Backend response:', response);
      },
      error: (err) => {
        this.connectionStatus = 'error';
        this.connectionStatusText = 'Erreur de connexion';
        this.error = err.message || 'Erreur inconnue';
        console.error('Backend connection error:', err);
      }
    });
  }

  checkAuth(): void {
    this.isAuthenticated = this.authService.isLoggedIn();
    this.token = this.authService.getToken();
    this.userInfo = this.authService.getUser();
  }

  clearAuth(): void {
    this.authService.logout();
    this.checkAuth();
  }
}
