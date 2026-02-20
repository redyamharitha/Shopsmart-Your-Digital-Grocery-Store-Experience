// shopsmart-frontend/src/app/services/product.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Product } from '../models/product.model'; // Import the Product interface

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = `${environment.apiUrl}/products`; // Base URL for product API

  constructor(private http: HttpClient) { }

  // Helper for setting headers with token (handled by HttpInterceptor, but explicit for clarity)
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token'); // Get token from local storage
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'x-auth-token': token || '' // Add token if available
    });
  }

  /**
   * Calls the backend API to add a new product (Admin only).
   * @param productData The product details (name, description, price, categoryId, imageUrl, stock).
   * Note: 'category' here should be the Category's _id (string).
   * @returns An Observable of the newly created Product.
   */
  addProduct(productData: {
    name: string;
    description: string;
    price: number;
    category: string; // This should be the category ID (string)
    imageUrl: string;
    stock: number;
    // If you add 'rating' to your backend ProductSchema, include it here too.
    rating?: number; // Optional rating for admin input
  }): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, productData, { headers: this.getAuthHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Fetches all products from the backend.
   * @returns An Observable of an array of Products.
   */
  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl).pipe(
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
    console.error('An error occurred in ProductService:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}