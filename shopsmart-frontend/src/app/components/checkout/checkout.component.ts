// shopsmart-frontend/src/app/components/checkout/checkout.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { CartService } from '../../cart.service';
import { OrderService } from '../../order.service';
import { CartItem } from '../../models/cart-item.model';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CurrencyPipe
  ],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss'
})
export class CheckoutComponent implements OnInit, OnDestroy {
  checkoutForm: FormGroup;
  cartItems$: Observable<CartItem[]>;
  totalPrice$: Observable<number>;
  private cartSubscription: Subscription = new Subscription();

  constructor(
    private fb: FormBuilder,
    private cartService: CartService,
    private orderService: OrderService,
    private router: Router
  ) {
    this.checkoutForm = this.fb.group({
      shippingAddress: this.fb.group({
        street: ['', Validators.required],
        city: ['', Validators.required],
        state: ['', Validators.required], // <--- ADDED: state field
        zip: ['', Validators.required],     // <--- CHANGED: from postalCode to zip
        country: ['', Validators.required]
      }),
      paymentMethod: ['Cash on Delivery', Validators.required]
    });
  }

  ngOnInit(): void {
    this.cartItems$ = this.cartService.getCartItems();
    this.totalPrice$ = this.cartService.getCartTotal();
    this.cartService.fetchCart().subscribe();

    this.cartSubscription = this.cartService.getCartItems().subscribe(items => {
      if (items.length === 0) {
        const currentTotal = this.cartService.currentCartTotal;
        if (currentTotal === 0) {
          alert('Your cart is empty. Redirecting to products page.');
          this.router.navigate(['/products']);
        }
      }
    });
  }

  onCheckoutSubmit(): void {
    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      alert('Please fill in all required fields.');
      return;
    }

    const currentCartItems = this.cartService.currentCartItems;
    const currentCartTotal = this.cartService.currentCartTotal;

    if (!currentCartItems || currentCartItems.length === 0) {
      alert('Your cart is empty. Please add items before checking out.');
      return;
    }

    const orderItems = currentCartItems.map(item => ({
      product: item.product._id,
      quantity: item.quantity,
      price: item.product.price
    }));

    const orderDetails = {
      shippingAddress: this.checkoutForm.get('shippingAddress')?.value,
      paymentMethod: this.checkoutForm.get('paymentMethod')?.value,
      items: orderItems,
      totalPrice: currentCartTotal
    };

    console.log('Order Details being sent:', orderDetails);

    this.orderService.placeOrder(orderDetails).subscribe({
      next: (response) => {
        console.log('Order placed successfully:', response);
        this.cartService.clearCart().subscribe();
        alert('Order placed successfully! Thank you for your purchase.');
        this.router.navigate(['/my-orders']);
      },
      error: (error) => {
        console.error('Error placing order:', error);
        alert(`Failed to place order: ${error.message || 'An unexpected error occurred. Please try again.'}`);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
  }
}