// shopsmart-frontend/src/app/components/cart/cart.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe, NgIf, NgFor } from '@angular/common';
import { Subscription, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router, RouterLink } from '@angular/router';

import { CartService } from '../../cart.service';
import { CartItem } from '../../models/cart-item.model'; // THIS PATH IS CORRECT

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    NgIf,
    NgFor,
    RouterLink
  ],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss'
})
export class CartComponent implements OnInit, OnDestroy {
  cartItems$: Observable<CartItem[]>;
  totalPrice$: Observable<number>;
  private cartSubscription: Subscription = new Subscription();

  constructor(private cartService: CartService, private router: Router) { }

  ngOnInit(): void {
    this.cartItems$ = this.cartService.getCartItems();
    this.totalPrice$ = this.cartService.getCartTotal();

    this.cartService.fetchCart().subscribe();

    this.cartSubscription = combineLatest([this.cartItems$, this.totalPrice$]).subscribe(
      ([items, total]) => {
        // console.log('Cart updated in CartComponent:', items, 'Total:', total);
        // FOR DEBUGGING: Add this line to see the actual structure of 'items'
        // if (items && items.length > 0) {
        //   console.log('First Cart Item:', items[0]);
        //   console.log('First Cart Item Product:', items[0].product);
        // }
      }
    );
  }

  increaseQuantity(productId: string): void {
    const currentItems = this.cartService.currentCartItems;
    const item = currentItems.find(i => i.product._id === productId);

    if (item) {
      if (item.quantity + 1 > item.product.stock) {
        alert(`Cannot add more. Only ${item.product.stock} in stock for ${item.product.name}.`);
        return;
      }
      const newQuantity = item.quantity + 1;
      this.cartService.updateCartItemQuantity(productId, newQuantity).subscribe({
        next: () => console.log('Quantity increased for:', productId),
        error: (err) => alert(`Failed to increase quantity: ${err.message || 'Error'}`)
      });
    }
  }

  decreaseQuantity(productId: string): void {
    const currentItems = this.cartService.currentCartItems;
    const item = currentItems.find(i => i.product._id === productId);

    if (item && item.quantity > 1) {
      const newQuantity = item.quantity - 1;
      this.cartService.updateCartItemQuantity(productId, newQuantity).subscribe({
        next: () => console.log('Quantity decreased for:', productId),
        error: (err) => alert(`Failed to decrease quantity: ${err.message || 'Error'}`)
      });
    } else if (item && item.quantity === 1) {
      this.removeFromCart(productId);
    }
  }

  removeFromCart(productId: string): void {
    if (confirm('Are you sure you want to remove this item from your cart?')) {
      this.cartService.removeFromCart(productId).subscribe({
        next: () => console.log('Item removed from cart:', productId),
        error: (err) => alert(`Failed to remove item: ${err.message || 'Error'}`)
      });
    }
  }

  clearCart(): void {
    if (confirm('Are you sure you want to clear your entire cart?')) {
      this.cartService.clearCart().subscribe({
        next: () => console.log('Cart cleared successfully.'),
        error: (err) => alert(`Failed to clear cart: ${err.message || 'Error'}`)
      });
    }
  }

  proceedToCheckout(): void {
    if (this.cartService.currentCartItems.length === 0) {
      alert('Your cart is empty. Please add items before checking out.');
      return;
    }
    this.router.navigate(['/checkout']);
  }

  ngOnDestroy(): void {
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
  }
}