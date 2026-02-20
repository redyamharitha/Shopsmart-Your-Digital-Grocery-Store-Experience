// shopsmart-frontend/src/app/guards/admin.guard.ts

import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service'; // Import AuthService
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    return this.authService.getUserRoleListener().pipe( // Listen to changes in user role
      map(role => {
        if (role === 'admin' && this.authService.isAuthenticated()) {
          return true; // Allow access if user is authenticated and has 'admin' role
        } else {
          // Redirect to login page or a forbidden page if not admin
          // You might want to add a message here (e.g., via a Snackbar/Toast)
          this.router.navigate(['/login']); // Redirect to login
          return false;
        }
      })
    );
  }
}