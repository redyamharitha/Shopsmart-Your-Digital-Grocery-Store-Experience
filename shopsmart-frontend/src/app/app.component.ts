// shopsmart-frontend/src/app/app.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';

import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators'; // <--- IMPORTANT: Import 'map' operator here!

import { CartService } from './cart.service';
import { AuthService } from './services/auth.service';
import { CartComponent } from './components/cart/cart.component';

// Import components that are directly embedded or part of routes
import { HomeComponent } from './components/home/home.component';
import { ProductsComponent } from './components/products/products.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { CheckoutComponent } from './components/checkout/checkout.component';
import { MyOrdersComponent } from './components/my-orders/my-orders.component';

// REMOVED: AddProductComponent import is not needed here as it's used via router-outlet
// import { AddProductComponent } from './components/admin/add-product/add-product.component';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatMenuModule,
    CartComponent,
    // REMOVED: AddProductComponent from imports, as it's routed, not directly used in template
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'ShopSmart';
  cartItemCount$: Observable<number>;
  isLoggedIn$: Observable<boolean>;
  isAdmin$: Observable<boolean>;
  isCartOpen: boolean = false;
  private authSubscription: Subscription = new Subscription();
  private adminSubscription: Subscription = new Subscription();

  constructor(private cartService: CartService, private authService: AuthService) {
    this.cartItemCount$ = this.cartService.getCartItemCount();
    this.isLoggedIn$ = this.authService.getAuthStatusListener();

    this.isAdmin$ = this.authService.getUserRoleListener().pipe(
      map(role => role === 'admin') // 'map' operator is now correctly imported
    );
  }

  ngOnInit(): void {
    this.cartService.fetchCart().subscribe({
      error: (err) => console.log('Initial cart fetch failed (possibly not logged in):', err.message)
    });

    this.authService.getAuthStatusListener().subscribe(isAuthenticated => {
      if (isAuthenticated) {
        this.authService.getUserRoleListener().subscribe().unsubscribe();
      }
    });
  }

  onLogout(): void {
    this.authService.logout();
    this.isCartOpen = false;
  }

  toggleCart(): void {
    this.isCartOpen = !this.isCartOpen;
    if (this.isCartOpen) {
      this.cartService.fetchCart().subscribe();
    }
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.adminSubscription) {
      this.adminSubscription.unsubscribe();
    }
  }
}