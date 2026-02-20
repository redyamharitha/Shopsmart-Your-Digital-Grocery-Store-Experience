// shopsmart-frontend/src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { CartService } from '../cart.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authStatus = new BehaviorSubject<boolean>(false);
  private _userRole$ = new BehaviorSubject<string | null>(null);

  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  constructor(
    private http: HttpClient,
    private cartService: CartService
  ) {
    this.authStatus.next(this.isAuthenticated());

    const storedRole = localStorage.getItem('userRole');
    if (storedRole) {
      this._userRole$.next(storedRole);
    }
  }

  register(userData: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/users`, userData, this.httpOptions).pipe(
      tap((res: any) => {
        localStorage.setItem('token', res.token);
        if (res.role) {
          localStorage.setItem('userRole', res.role);
          this._userRole$.next(res.role);
        }
        this.authStatus.next(true);
      })
    );
  }

  // --- NEW METHOD: registerAdmin ---
  registerAdmin(adminData: { name: string; email: string; password: string; admin_secret_key: string }): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/users/admin-register`, adminData, this.httpOptions).pipe(
      tap((res: any) => {
        localStorage.setItem('token', res.token);
        if (res.role) { // Should be 'admin' if successful
          localStorage.setItem('userRole', res.role);
          this._userRole$.next(res.role);
        }
        this.authStatus.next(true);
      })
    );
  }
  // --- END NEW METHOD ---

  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/auth`, credentials, this.httpOptions).pipe(
      tap((res: any) => {
        localStorage.setItem('token', res.token);
        this.authStatus.next(true);
        if (res.role) {
          localStorage.setItem('userRole', res.role);
          this._userRole$.next(res.role);
        }
        this.cartService.fetchCart().subscribe();
      })
    );
  }

  logout(): void {
    this.cartService.clearCart().subscribe({
      next: () => {
        console.log('Cart cleared successfully on logout.');
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        this._userRole$.next(null);
        this.authStatus.next(false);
      },
      error: (err) => {
        console.error('Error clearing cart on logout:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        this._userRole$.next(null);
        this.authStatus.next(false);
      }
    });
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token;
  }

  getUserRole(): string | null {
    return this._userRole$.getValue();
  }

  getUserRoleListener(): Observable<string | null> {
    return this._userRole$.asObservable();
  }

  getAuthStatusListener(): Observable<boolean> {
    return this.authStatus.asObservable();
  }
}