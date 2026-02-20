// shopsmart-frontend/src/app/components/products/products.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CartService } from '../../cart.service';
import { AuthService } from '../../services/auth.service';
import { Product } from '../../models/product.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss'
})
export class ProductsComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  allProducts: Product[] = [];

  _searchTerm: string = '';
  private filterTimeout: any;

  isLoading: boolean = true;
  errorMessage: string | null = null;
  private productsSubscription: Subscription = new Subscription();
  isLoggedIn: boolean = false;
  private authStatusSubscription: Subscription = new Subscription();
  private addToCartSubscription: Subscription = new Subscription();
  private buyNowSubscription: Subscription = new Subscription();


  constructor(
    private apiService: ApiService,
    private cartService: CartService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.fetchProducts();

    this.isLoggedIn = this.authService.isAuthenticated();
    this.authStatusSubscription = this.authService.getAuthStatusListener().subscribe(
      isAuthenticated => {
        this.isLoggedIn = isAuthenticated;
      }
    );
  }

  get searchTerm(): string {
    return this._searchTerm;
  }

  set searchTerm(value: string) {
    this._searchTerm = value;
    if (this.filterTimeout) {
      clearTimeout(this.filterTimeout);
    }
    this.filterTimeout = setTimeout(() => {
      this.filterProducts();
    }, 300);
  }

  onSearchTermChange(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
  }

  fetchProducts(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.productsSubscription = this.apiService.getProducts().subscribe({
      next: (data: Product[]) => {
        this.allProducts = data;
        this.products = [...this.allProducts];
        this.isLoading = false;
        this.filterProducts();
      },
      error: (err) => {
        console.error('Error fetching products:', err);
        this.errorMessage = 'Failed to load products. Please try again later.';
        this.isLoading = false;
      }
    });
  }

  filterProducts(): void {
    if (!this.allProducts) {
      this.products = [];
      return;
    }

    if (!this.searchTerm) {
      this.products = [...this.allProducts];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.products = this.allProducts.filter(product =>
        product.name.toLowerCase().includes(term) ||
        product.description.toLowerCase().includes(term)
      );
    }
  }

  ngOnDestroy(): void {
    if (this.productsSubscription) {
      this.productsSubscription.unsubscribe();
    }
    if (this.filterTimeout) {
      clearTimeout(this.filterTimeout);
    }
    this.authStatusSubscription.unsubscribe();
    this.addToCartSubscription.unsubscribe();
    this.buyNowSubscription.unsubscribe();
  }

  addToCart(product: Product): void {
    if (!this.isLoggedIn) {
      alert('Please log in to add items to your cart.');
      return;
    }
    if (product.stock === 0) {
      alert('This product is out of stock.');
      return;
    }

    // UPDATED: Pass product._id instead of the whole product object
    this.addToCartSubscription = this.cartService.addToCart(product._id).pipe(
      catchError(error => {
        alert(`Failed to add to cart: ${error.message || 'An unknown error occurred.'}`);
        console.error('Error adding to cart:', error);
        return throwError(() => error);
      })
    ).subscribe(
      () => {
        console.log(`Added ${product.name} to cart via backend successfully.`);
        // Optional: show a small success message on UI
      }
    );
  }

  buyNow(product: Product): void {
    if (!this.isLoggedIn) {
      alert('Please log in to buy products.');
      this.router.navigate(['/login']);
      return;
    }
    if (product.stock === 0) {
      alert('This product is out of stock.');
      return;
    }

    // UPDATED: Pass product._id instead of the whole product object
    this.buyNowSubscription = this.cartService.addToCart(product._id).pipe(
      catchError(error => {
        alert(`Failed to add to cart for direct purchase: ${error.message || 'An unknown error occurred.'}`);
        console.error('Error adding to cart for buy now:', error);
        return throwError(() => error);
      })
    ).subscribe(
      () => {
        console.log(`Added ${product.name} to cart for immediate purchase via backend.`);
        this.router.navigate(['/checkout']); // Navigate to the checkout page only on success
      }
    );
  }
}