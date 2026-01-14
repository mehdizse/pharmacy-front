import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  
  constructor(private snackBar: MatSnackBar) {}

  show(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const duration = 5000;
    const panelClass = type === 'error' ? 'error-snackbar' : 
                       type === 'success' ? 'success-snackbar' : 'info-snackbar';
    
    this.snackBar.open(message, 'Fermer', {
      duration,
      panelClass,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  success(message: string): void {
    this.show(message, 'success');
  }

  error(message: string): void {
    this.show(message, 'error');
  }

  info(message: string): void {
    this.show(message, 'info');
  }
}
