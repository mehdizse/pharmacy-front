import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../../core/services/auth.service';

export interface MenuItem {
  label: string;
  icon: string;
  route: string;
  roles?: string[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ],
  template: `
    <div class="sidebar-container">
      <!-- Logo -->
      <div class="logo-section">
        <mat-icon class="logo-icon">medication</mat-icon>
        <h2 class="logo-text">PharmaManager</h2>
      </div>

      <!-- Navigation -->
      <nav class="nav-section">
        <ul class="nav-list">
          <li *ngFor="let item of menuItems" class="nav-item">
            <a 
              [routerLink]="item.route" 
              routerLinkActive="active"
              class="nav-link"
              [class.disabled]="!hasAccess(item)"
              [matTooltip]="!hasAccess(item) ? 'Accès non autorisé' : ''"
              matTooltipPosition="right">
              <mat-icon class="nav-icon">{{ item.icon }}</mat-icon>
              <span class="nav-label">{{ item.label }}</span>
            </a>
          </li>
        </ul>
      </nav>

      <!-- User Section -->
      <div class="user-section">
        <div class="user-info">
          <mat-icon class="user-avatar">person</mat-icon>
          <div class="user-details">
            <p class="user-name">{{ currentUser?.username || 'Utilisateur' }}</p>
            <p class="user-role">{{ getRoleDisplay() }}</p>
          </div>
        </div>
        <button mat-icon-button (click)="logout()" class="logout-btn">
          <mat-icon>logout</mat-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .sidebar-container {
      width: 260px;
      height: 100vh;
      background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
      color: white;
      display: flex;
      flex-direction: column;
      position: fixed;
      left: 0;
      top: 0;
      z-index: 1000;
      box-shadow: 2px 0 10px rgba(0,0,0,0.1);
    }

    .logo-section {
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }

    .logo-icon {
      font-size: 2rem;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255,255,255,0.1);
      border-radius: 8px;
    }

    .logo-text {
      font-size: 1.25rem;
      font-weight: 700;
      margin: 0;
      color: white;
    }

    .nav-section {
      flex: 1;
      padding: 1rem 0;
      overflow-y: auto;
    }

    .nav-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .nav-item {
      margin: 0.25rem 0;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1.5rem;
      color: rgba(255,255,255,0.8);
      text-decoration: none;
      transition: all 0.3s ease;
      position: relative;
      font-weight: 500;
    }

    .nav-link:hover {
      background: rgba(255,255,255,0.1);
      color: white;
    }

    .nav-link.active {
      background: rgba(255,255,255,0.15);
      color: white;
      border-left: 4px solid #4CAF50;
    }

    .nav-link.active::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: #4CAF50;
    }

    .nav-link.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .nav-icon {
      font-size: 1.25rem;
      width: 24px;
      height: 24px;
    }

    .nav-label {
      font-size: 0.9rem;
    }

    .user-section {
      padding: 1rem 1.5rem;
      border-top: 1px solid rgba(255,255,255,0.1);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex: 1;
    }

    .user-avatar {
      width: 36px;
      height: 36px;
      background: rgba(255,255,255,0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .user-details {
      flex: 1;
      min-width: 0;
    }

    .user-name {
      margin: 0;
      font-size: 0.9rem;
      font-weight: 600;
      color: white;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-role {
      margin: 0;
      font-size: 0.75rem;
      color: rgba(255,255,255,0.7);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .logout-btn {
      color: rgba(255,255,255,0.8);
    }

    .logout-btn:hover {
      color: white;
      background: rgba(255,255,255,0.1);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .sidebar-container {
        transform: translateX(-100%);
        transition: transform 0.3s ease;
      }

      .sidebar-container.open {
        transform: translateX(0);
      }

      .nav-label {
        display: none;
      }

      .logo-text {
        display: none;
      }

      .user-details {
        display: none;
      }
    }
  `]
})
export class SidebarComponent implements OnInit {
  menuItems: MenuItem[] = [
    {
      label: 'Tableau de bord',
      icon: 'dashboard',
      route: '/dashboard'
    },
    {
      label: 'Fournisseurs',
      icon: 'business',
      route: '/suppliers'
    },
    {
      label: 'Factures',
      icon: 'receipt',
      route: '/invoices'
    },
    {
      label: 'Avoirs',
      icon: 'assignment_return',
      route: '/credit-notes'
    },
    {
      label: 'Rapports',
      icon: 'assessment',
      route: '/reports'
    }
  ];

  currentUser: any;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getUser();
  }

  hasAccess(item: MenuItem): boolean {
    if (!item.roles || item.roles.length === 0) {
      return true;
    }
    return this.authService.hasAnyRole(item.roles as any[]);
  }

  getRoleDisplay(): string {
    if (!this.currentUser?.role) return 'Utilisateur';
    
    const roleMap: { [key: string]: string } = {
      'ADMIN': 'Administrateur',
      'PHARMACIEN': 'Pharmacien',
      'COMPTABLE': 'Comptable'
    };
    
    return roleMap[this.currentUser.role] || 'Utilisateur';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth']);
  }
}
