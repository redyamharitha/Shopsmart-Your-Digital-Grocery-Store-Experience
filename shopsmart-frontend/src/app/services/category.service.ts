// shopsmart-frontend/src/app/services/category.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Category } from '../models/category.model'; // Import the Category interface

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private apiUrl = `${environment.apiUrl}/categories`; // Base URL for category API

  constructor(private http: HttpClient) { }

  /**
   * Fetches all categories from the backend.
   * @returns An Observable of an array of Categories.
   */
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Generic error handling for HTTP requests.
   * @param error The HttpErrorResponse object.
   * @returns An Observable that throws an error.
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      // Client-side errors
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side errors
      errorMessage = `Server Error Code: ${error.status}\nMessage: ${error.error?.msg || JSON.stringify(error.error) || error.message}`;
      console.error('Full server error response:', error.error);
    }
    console.error('An error occurred in CategoryService:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}