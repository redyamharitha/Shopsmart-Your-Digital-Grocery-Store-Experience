import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { CartItem } from './models/cart-item.model';
import { environment } from '../environments/environment';

// Define the structure of the Cart object you expect from the backend
export interface Cart {
  _id: string;
  user: string;
  items: CartItem[]; // Array of CartItem
  date: string;
  totalAmount?: number; // Backend usually calculates totalAmount, not just 'total'
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = `${environment.apiUrl}/cart`; // Ensure this matches your backend API
  private _cartItems$ = new BehaviorSubject<CartItem[]>([]);
  private _cartTotal$ = new BehaviorSubject<number>(0);

  constructor(private http: HttpClient) { }

  getCartItems(): Observable<CartItem[]> {
    return this._cartItems$.asObservable();
  }

  get currentCartItems(): CartItem[] {
    return this._cartItems$.getValue();
  }

  get currentCartTotal(): number {
    return this._cartTotal$.getValue();
  }

  getCartItemCount(): Observable<number> {
    return this._cartItems$.asObservable().pipe(
      map(items => items.reduce((count, item) => count + item.quantity, 0))
    );
  }

  getCartTotal(): Observable<number> {
    return this._cartTotal$.asObservable();
  }

  /**
   * Fetches the entire cart from the backend and updates local state.
   */
  fetchCart(): Observable<CartItem[]> {
    return this.http.get<Cart>(this.apiUrl).pipe(
      tap(cart => {
        if (cart && Array.isArray(cart.items)) {
          this._cartItems$.next(cart.items);
          this.calculateCartTotal(cart.items);
          console.log('Cart fetched successfully:', cart.items);
        } else {
          console.warn('Fetched cart data is empty or malformed, resetting cart:', cart);
          this._cartItems$.next([]); // Reset to empty if data is bad
          this.calculateCartTotal([]);
        }
      }),
      map(cart => cart.items || []), // Ensure it always returns an array
      catchError(this.handleError)
    );
  }

  /**
   * Adds a product to the cart on the backend and updates local state.
   * Method is POST, URL is /api/cart/add
   */
  addToCart(productId: string, quantity: number = 1): Observable<CartItem[]> {
    const payload = { productId, quantity };
    console.log('Sending AddToCart payload:', payload);

    return this.http.post<Cart>(`${this.apiUrl}/add`, payload).pipe(
      tap(cart => {
        if (cart && Array.isArray(cart.items)) {
          this._cartItems$.next(cart.items);
          this.calculateCartTotal(cart.items);
          console.log('Product added and local cart updated:', cart.items);
        } else {
          console.error('Add to cart request successful, but returned cart data is empty or malformed:', cart);
          this.fetchCart().subscribe(); // Re-fetch the cart for consistency
        }
      }),
      map(cart => cart.items || []), // Ensure it always returns an array
      catchError(this.handleError)
    );
  }

  /**
   * Removes a product from the cart on the backend and updates local state.
   * Method is DELETE, URL is /api/cart/remove/:productId
   */
  removeFromCart(productId: string): Observable<CartItem[]> {
    return this.http.delete<Cart>(`${this.apiUrl}/remove/${productId}`).pipe(
      tap(cart => { // Backend now sends back the updated cart directly
        if (cart && Array.isArray(cart.items)) {
            this._cartItems$.next(cart.items);
            this.calculateCartTotal(cart.items);
            console.log('Product removed and local cart updated:', cart.items);
        } else {
            console.error('Remove from cart request successful, but returned cart data is empty or malformed:', cart);
            this.fetchCart().subscribe(); // Re-fetch the cart for consistency
        }
      }),
      map(cart => cart.items || []), // Extract items from response, assuming it's a Cart object
      catchError(this.handleError)
    );
  }

  /**
   * Updates the quantity of a specific item in the cart on the backend and updates local state.
   * Method is PUT, URL is /api/cart/update-quantity
   */
  updateCartItemQuantity(productId: string, quantity: number): Observable<CartItem[]> {
    const payload = { productId, quantity };
    return this.http.put<Cart>(`${this.apiUrl}/update-quantity`, payload).pipe(
      tap(cart => {
        if (cart && Array.isArray(cart.items)) {
          this._cartItems$.next(cart.items);
          this.calculateCartTotal(cart.items);
          console.log('Quantity updated and local cart updated:', cart.items);
        } else {
          console.error('Update quantity request successful, but returned cart data is empty or malformed:', cart);
          this.fetchCart().subscribe();
        }
      }),
      map(cart => cart.items || []),
      catchError(this.handleError)
    );
  }

  /**
   * Clears the entire cart on the backend and locally.
   * Method is DELETE, URL is /api/cart/clear
   */
  clearCart(): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/clear`).pipe(
      tap(() => {
        this._cartItems$.next([]); // Clear local state
        this._cartTotal$.next(0);
        console.log('Cart cleared successfully.');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Calculates the total price of items in the cart.
   * @param items The array of cart items.
   */
  private calculateCartTotal(items: CartItem[]): void {
    const total = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    this._cartTotal$.next(total);
  }

  /**
   * Generic error handler for HTTP requests.
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      // Client-side errors
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side errors
      errorMessage = `Server Error Code: ${error.status}\nMessage: ${error.error?.msg || error.message}`;
      // In case of 404 with HTML response, try to parse for msg within <pre>
      if (error.status === 404 && typeof error.error === 'string') {
          const match = error.error.match(/<pre>(.*?)<\/pre>/s);
          if (match && match[1]) {
              errorMessage = `Server Error Code: ${error.status}\nMessage: ${match[1].trim()}`;
          }
      }
      console.error('Full server error response:', error.error); // Log full error response for debugging
    }
    console.error('An error occurred in CartService:', errorMessage);
    return throwError(() => new Error(errorMessage)); // Re-throw for component to catch
  }
}