import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { trigger, state, style, transition, animate } from '@angular/animations';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  animations: [
    trigger('dialogAnimation', [
      state('void', style({
        opacity: 0,
        transform: 'scale(0.8) translateY(-20px)'
      })),
      state('enter', style({
        opacity: 1,
        transform: 'scale(1) translateY(0)'
      })),
      transition('void => enter', animate('200ms cubic-bezier(0.4, 0, 0.2, 1)')),
      transition('enter => void', animate('150ms cubic-bezier(0.4, 0, 1, 1)'))
    ])
  ],
  template: `
    <div class="confirm-dialog" [@dialogAnimation]>
      <!-- Header -->
      <div class="dialog-header">
        <div class="header-content">
          <mat-icon [class]="getIconClass()" class="header-icon">{{ getIcon() }}</mat-icon>
          <h2 class="dialog-title">{{ data.title }}</h2>
        </div>
        <button mat-icon-button class="close-btn" (click)="onCancel()" matTooltip="Fermer">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Content -->
      <div class="dialog-content">
        <div class="content-wrapper">
          <mat-icon [class]="getContentIconClass()" class="content-icon">{{ getContentIcon() }}</mat-icon>
          <p class="dialog-message">{{ data.message }}</p>
        </div>
      </div>

      <!-- Actions -->
      <div class="dialog-actions">
        <button mat-button 
                class="cancel-btn"
                (click)="onCancel()">
          <mat-icon>close</mat-icon>
          {{ data.cancelText || 'Annuler' }}
        </button>
        
        <button mat-raised-button 
                color="primary"
                class="confirm-btn"
                [class]="getConfirmButtonClass()"
                (click)="onConfirm()">
          <mat-icon>{{ getConfirmIcon() }}</mat-icon>
          {{ data.confirmText || 'Confirmer' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .confirm-dialog {
      min-width: 400px;
      max-width: 500px;
      padding: 0;
      border-radius: 16px;
      overflow: hidden;
      background: #ffffff;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    }

    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 24px 24px 16px;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
      border-bottom: 1px solid rgba(102, 126, 234, 0.1);
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
    }

    .header-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .close-btn {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .close-btn .mat-icon {
      font-size: 18px;
      height: 18px;
      width: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .close-btn:hover {
      background: rgba(0, 0, 0, 0.05);
    }

    .dialog-title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #1a202c;
      flex: 1;
    }

    .dialog-content {
      padding: 20px 24px;
    }

    .content-wrapper {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 16px;
      background: rgba(102, 126, 234, 0.02);
      border-radius: 12px;
      border: 1px solid rgba(102, 126, 234, 0.08);
    }

    .content-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .icon-danger {
      color: #ef4444;
    }

    .icon-warning {
      color: #f59e0b;
    }

    .icon-info {
      color: #3b82f6;
    }

    .dialog-message {
      margin: 0;
      font-size: 0.95rem;
      line-height: 1.6;
      color: #4a5568;
      flex: 1;
    }

    .dialog-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      padding: 16px 24px 24px;
      background: rgba(248, 250, 252, 0.8);
      border-top: 1px solid rgba(102, 126, 234, 0.1);
    }

    .cancel-btn {
      color: #64748b;
      border: 1px solid #e2e8f0;
      background: white;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .cancel-btn:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
      transform: translateY(-1px);
    }

    .confirm-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 120px;
      height: 40px;
      border-radius: 8px;
      font-weight: 500;
      transition: all 0.2s ease;
      position: relative;
      overflow: hidden;
    }

    .confirm-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .confirm-btn.danger {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      border: none;
    }

    .confirm-btn.danger:hover {
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
    }

    .confirm-btn.warning {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      border: none;
    }

    .confirm-btn.warning:hover {
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
    }

    .confirm-btn.info {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      border: none;
    }

    .confirm-btn.info:hover {
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .mat-icon {
      font-size: 20px;
      height: 20px;
      width: 20px;
    }

    .icon-danger {
      color: #ef4444;
    }

    .icon-warning {
      color: #f59e0b;
    }

    .icon-info {
      color: #3b82f6;
    }

    /* Responsive */
    @media (max-width: 480px) {
      .confirm-dialog {
        min-width: 320px;
        margin: 16px;
      }

      .dialog-header {
        padding: 20px 16px 12px;
      }

      .dialog-content {
        padding: 16px;
      }

      .content-wrapper {
        flex-direction: column;
        text-align: center;
        gap: 12px;
      }

      .dialog-actions {
        padding: 12px 16px 16px;
        flex-direction: column;
        gap: 8px;
      }

      .confirm-btn {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<boolean>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  getIcon(): string {
    switch (this.data.type) {
      case 'danger':
        return 'warning';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'help';
    }
  }

  getIconClass(): string {
    switch (this.data.type) {
      case 'danger':
        return 'icon-danger';
      case 'warning':
        return 'icon-warning';
      case 'info':
        return 'icon-info';
      default:
        return 'icon-info';
    }
  }

  getConfirmIcon(): string {
    switch (this.data.type) {
      case 'danger':
        return 'delete';
      case 'warning':
        return 'warning';
      case 'info':
        return 'check_circle';
      default:
        return 'check_circle';
    }
  }

  getContentIcon(): string {
    switch (this.data.type) {
      case 'danger':
        return 'error_outline';
      case 'warning':
        return 'warning_amber';
      case 'info':
        return 'info_outline';
      default:
        return 'help_outline';
    }
  }

  getContentIconClass(): string {
    switch (this.data.type) {
      case 'danger':
        return 'icon-danger';
      case 'warning':
        return 'icon-warning';
      case 'info':
        return 'icon-info';
      default:
        return 'icon-info';
    }
  }

  getConfirmButtonClass(): string {
    return this.data.type || 'danger';
  }
}
