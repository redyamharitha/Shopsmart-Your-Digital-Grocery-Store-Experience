// shopsmart-frontend/src/app/guards/auth.guard.ts

import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service'; // Import AuthService
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    // Check if the user is authenticated synchronously first
    if (this.authService.isAuthenticated()) {
      return true; // Allow access if authenticated
    } else {
      // If not authenticated, redirect to login
      this.router.navigate(['/login']);
      return false;
    }

    // Alternative: If your isAuthenticated() relies on an async check,
    // you would subscribe to authStatusListener here.
    // For simplicity and immediate protection, the synchronous check is often preferred for guards.
  }
}