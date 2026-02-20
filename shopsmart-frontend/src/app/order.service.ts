// shopsmart-frontend/src/app/order.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../environments/environment'; // Assuming environment is available for apiUrl

// Corrected import paths for services and models
import { CartService } from './cart.service'; // Ensure this is the updated CartService
import { AuthService } from './services/auth.service';
import { Order } from './order.model'; // Corrected import for Order model

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  // Use environment.apiUrl for consistency
  private orderApiUrl = `${environment.apiUrl}/orders`; // Your backend order API endpoint

  private orders = new BehaviorSubject<Order[]>([]); // To manage user's orders

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private cartService: CartService // To access cart data for placing orders
  ) { }

  /**
   * Provides an observable for components to subscribe to user's order changes.
   */
  getOrdersListener(): Observable<Order[]> {
    return this.orders.asObservable();
  }

  /**
   * Provides synchronous access to the current list of user's orders.
   */
  getCurrentOrdersData(): Order[] {
    return this.orders.value;
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders().set('x-auth-token', token || '');
  }

  /**
   * Places a new order with the backend.
   * @param orderDetails Object containing shipping, payment, and order items.
   * `orderDetails.items` should already contain `product._id` and `quantity`
   * `orderDetails.totalPrice` should already contain the calculated total.
   * @returns An Observable of the backend's response for the placed order.
   */
  placeOrder(orderDetails: any): Observable<any> { // orderDetails is expected to be complete from component
    if (!this.authService.isAuthenticated()) {
      return throwError(() => new Error('User not authenticated. Please log in to place an order.'));
    }

    const headers = this.getAuthHeaders();

    if (!orderDetails.items || orderDetails.items.length === 0) {
      return throwError(() => new Error('Cannot place an empty order. No items provided.'));
    }

    const finalOrderPayload = orderDetails;

    // --- CRITICAL CHANGE HERE ---
    // Appending '/checkout' to the URL to match the backend route
    return this.http.post<any>(`${this.orderApiUrl}/checkout`, finalOrderPayload, { headers }).pipe(
      tap((response) => {
        console.log('Order placed successfully via OrderService:', response);
        this.fetchOrders(); // Refresh orders list after placing a new order
        this.cartService.fetchCart().subscribe(); // Also refresh the cart to reflect it being cleared on successful order
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Fetches the current user's orders from the backend and updates the orders state.
   */
  fetchOrders(): void {
    if (!this.authService.isAuthenticated()) {
      this.orders.next([]); // Clear orders if not authenticated
      return;
    }
    const headers = this.getAuthHeaders();
    this.http.get<Order[]>(this.orderApiUrl, { headers }).pipe(
      tap((res) => {
        this.orders.next(res); // Assuming backend returns an array of orders directly
      }),
      catchError(this.handleError)
    ).subscribe();
  }

  /**
   * Cancels a specific order.
   * @param orderId The ID of the order to cancel.
   * @returns An Observable of the backend's response.
   */
  cancelOrder(orderId: string): Observable<any> {
    if (!this.authService.isAuthenticated()) {
      return throwError(() => new Error('User not authenticated.'));
    }
    const headers = this.getAuthHeaders();
    // Assuming backend endpoint for cancellation is PUT /api/orders/:orderId/cancel
    return this.http.put<any>(`${this.orderApiUrl}/${orderId}/cancel`, {}, { headers }).pipe(
      tap(() => {
        console.log(`Order ${orderId} cancelled.`);
        this.fetchOrders(); // Refresh orders list after cancellation
      }),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('An error occurred in OrderService:', error);
    let errorMessage = 'An unexpected error occurred. Please try again.';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Network Error: ${error.error.message}`;
    } else {
      if (error.error && error.error.msg) {
        errorMessage = `Server Error: ${error.error.msg}`;
      } else if (error.error && error.error.errors && error.error.errors.length > 0) {
        errorMessage = `Validation Error: ${error.error.errors[0].msg}`;
      } else if (error.status === 0) {
        errorMessage = 'Could not connect to the backend server. Please ensure it is running.';
      } else {
        errorMessage = `Server Error (Code: ${error.status}): ${error.message}`;
      }
    }
    return throwError(() => new Error(errorMessage));
  }
}