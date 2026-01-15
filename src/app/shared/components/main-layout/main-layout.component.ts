import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    SidebarComponent,
    MatIconModule,
    MatButtonModule
  ],
  template: `
    <div class="app-layout">
      <!-- Sidebar - seulement si connecté -->
      <app-sidebar *ngIf="authService.isLoggedIn()"></app-sidebar>
      
      <!-- Main Content -->
      <div class="main-content" [class.no-sidebar]="!authService.isLoggedIn()">
        <!-- Mobile Menu Toggle - seulement si connecté -->
        <button 
          mat-icon-button 
          class="mobile-menu-toggle"
          (click)="toggleMobileMenu()"
          aria-label="Toggle menu"
          *ngIf="authService.isLoggedIn()">
          <mat-icon>menu</mat-icon>
        </button>
        
        <!-- Page Content -->
        <main class="page-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .app-layout {
      display: flex;
      min-height: 100vh;
    }

    .main-content {
      flex: 1;
      margin-left: 260px;
      min-height: 100vh;
      background: #f5f7fa;
      transition: margin-left 0.3s ease;
    }

    .main-content.no-sidebar {
      margin-left: 0;
    }

    .mobile-menu-toggle {
      display: none;
      position: fixed;
      top: 1rem;
      left: 1rem;
      z-index: 1001;
      background: white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }

    .page-content {
      padding: 2rem;
      min-height: 100vh;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .main-content {
        margin-left: 0;
      }

      .mobile-menu-toggle {
        display: flex;
      }

      .page-content {
        padding: 1rem;
        padding-top: 4rem;
      }

      .sidebar-open .main-content {
        margin-left: 0;
      }
    }

    /* Sidebar open state for mobile */
    :host ::ng-deep .sidebar-container.open {
      transform: translateX(0);
    }
  `]
})
export class MainLayoutComponent {
  
  constructor(public authService: AuthService) {}
  
  toggleMobileMenu(): void {
    document.querySelector('app-sidebar')?.classList.toggle('open');
    document.querySelector('.main-content')?.classList.toggle('sidebar-open');
  }
}
