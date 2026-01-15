import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { ApiResponse, ApiError, API_ENDPOINTS } from '../../shared/models/api.model';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiUrl;
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });
    
    if (token) {
      headers = headers.set('Authorization', `Token ${token}`);
    }
    
    return headers;
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    const apiError: ApiError = {
      message: error.error?.message || error.message || 'Une erreur est survenue',
      status: error.status,
      error: error.error
    };

    if (error.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_info');
      window.location.href = '/login';
    }

    return throwError(() => apiError);
  }

  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  get<T>(endpoint: string): Observable<ApiResponse<T>> {
    this.setLoading(true);
    const headers = this.getHeaders();
    
    return this.http.get<ApiResponse<T>>(
      `${this.baseUrl}${endpoint}`,
      { headers }
    ).pipe(
      catchError(this.handleError),
      finalize(() => this.setLoading(false))
    );
  }

  post<T>(endpoint: string, data: any): Observable<ApiResponse<T>> {
    this.setLoading(true);
    const headers = this.getHeaders();
    
    return this.http.post<ApiResponse<T>>(
      `${this.baseUrl}${endpoint}`,
      data,
      { headers }
    ).pipe(
      catchError(this.handleError),
      finalize(() => this.setLoading(false))
    );
  }

  put<T>(endpoint: string, data: any): Observable<ApiResponse<T>> {
    this.setLoading(true);
    const headers = this.getHeaders();
    
    return this.http.put<ApiResponse<T>>(
      `${this.baseUrl}${endpoint}`,
      data,
      { headers }
    ).pipe(
      catchError(this.handleError),
      finalize(() => this.setLoading(false))
    );
  }

  patch<T>(endpoint: string, data: any): Observable<ApiResponse<T>> {
    this.setLoading(true);
    const headers = this.getHeaders();
    
    return this.http.patch<ApiResponse<T>>(
      `${this.baseUrl}${endpoint}`,
      data,
      { headers }
    ).pipe(
      catchError(this.handleError),
      finalize(() => this.setLoading(false))
    );
  }

  delete<T>(endpoint: string): Observable<ApiResponse<T>> {
    this.setLoading(true);
    const headers = this.getHeaders();
    
    return this.http.delete<ApiResponse<T>>(
      `${this.baseUrl}${endpoint}`,
      { headers }
    ).pipe(
      catchError(this.handleError),
      finalize(() => this.setLoading(false))
    );
  }

  getFile(endpoint: string): Observable<Blob> {
    this.setLoading(true);
    const headers = this.getHeaders();
    
    return this.http.get(
      `${this.baseUrl}${endpoint}`,
      { headers, responseType: 'blob' }
    ).pipe(
      catchError(this.handleError),
      finalize(() => this.setLoading(false))
    );
  }

  uploadFile<T>(endpoint: string, file: File, additionalData?: Record<string, any>): Observable<ApiResponse<T>> {
    this.setLoading(true);
    
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });
    }

    const token = localStorage.getItem('auth_token');
    let headers = new HttpHeaders();
    
    if (token) {
      headers = headers.set('Authorization', `Token ${token}`);
    }

    return this.http.post<ApiResponse<T>>(
      `${this.baseUrl}${endpoint}`,
      formData,
      { headers }
    ).pipe(
      catchError(this.handleError),
      finalize(() => this.setLoading(false))
    );
  }
}
