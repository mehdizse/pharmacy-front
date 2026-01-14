import { Injectable } from '@angular/core';
import { DateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';

@Injectable({
  providedIn: 'root'
})
export class DateService {
  
  constructor(private dateAdapter: DateAdapter<any>) {}

  /**
   * Formate une date au format JJ/MM/YYYY
   */
  formatDate(date: Date | string | null | undefined): string {
    if (!date) {
      return '';
    }
    
    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    
    return `${day}/${month}/${year}`;
  }

  /**
   * Convertit une date string JJ/MM/YYYY en Date object
   */
  parseDate(dateString: string): Date | null {
    if (!dateString) {
      return null;
    }
    
    // Vérifier si le format est JJ/MM/YYYY
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = dateString.match(regex);
    
    if (match) {
      const [, day, month, year] = match;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return isNaN(date.getTime()) ? null : date;
    }
    
    // Essayer de parser avec le constructeur Date par défaut
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  }

  /**
   * Convertit une date en format ISO (YYYY-MM-DD) pour l'API
   */
  toApiFormat(date: Date | string | null | undefined): string | null {
    if (!date) {
      return null;
    }
    
    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      return null;
    }
    
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }

  /**
   * Initialise l'adaptateur de date pour utiliser le locale français
   */
  initFrenchLocale(): void {
    this.dateAdapter.setLocale('fr-FR');
  }

  /**
   * Vérifie si une date est valide
   */
  isValidDate(date: any): boolean {
    if (!date) return false;
    const dateObj = date instanceof Date ? date : new Date(date);
    return !isNaN(dateObj.getTime());
  }

  /**
   * Ajoute des jours à une date
   */
  addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Calcule la différence en jours entre deux dates
   */
  daysBetween(date1: Date, date2: Date): number {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
  }

  /**
   * Retourne la date du jour
   */
  today(): Date {
    return new Date();
  }

  /**
   * Retourne la date du jour formatée
   */
  todayFormatted(): string {
    return this.formatDate(this.today());
  }
}
