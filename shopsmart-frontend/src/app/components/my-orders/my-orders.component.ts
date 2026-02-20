// shopsmart-frontend/src/app/components/my-orders/my-orders.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core'; // Added OnDestroy
import { CommonModule, CurrencyPipe, DatePipe, TitleCasePipe, NgIf, NgFor } from '@angular/common'; // For *ngFor, *ngIf, date pipe, currency pipe, TitleCasePipe
import { Router } from '@angular/router'; // For navigating back to products if no orders
import { OrderService } from '../../order.service'; // Import OrderService
import { Order } from '../../order.model'; // CORRECTED: Import Order interface from its model file
import { Observable, Subscription } from 'rxjs'; // Added Subscription

// Optional: Custom pipe to reverse array for showing latest orders first
// If you want this, you MUST create this file at '../../pipes/reverse.pipe.ts'
// If you do NOT have this pipe, remove 'ReversePipe' from the imports array below.
// import { ReversePipe } from '../../pipes/reverse.pipe'; // Adjust path if your 'pipes' folder is elsewhere

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe, // For formatting order total/item prices (used in HTML)
    DatePipe,     // For formatting dates (used in HTML)
    TitleCasePipe, // For formatting status (used in HTML)
    NgIf,
    NgFor,
    // ReversePipe // <--- Include ReversePipe ONLY if you create it in '../../pipes/reverse.pipe.ts'
  ],
  templateUrl: './my-orders.component.html',
  styleUrl: './my-orders.component.scss'
})
export class MyOrdersComponent implements OnInit, OnDestroy { // Implemented OnDestroy
  orders$: Observable<Order[]>;
  private ordersSubscription: Subscription = new Subscription(); // To manage subscriptions

  constructor(private orderService: OrderService, private router: Router) { } // No assignment in constructor, do in ngOnInit

  ngOnInit(): void {
    // Get the observable for user orders from the service
    this.orders$ = this.orderService.getOrdersListener();

    // Fetch the orders to populate the observable when the component initializes
    this.orderService.fetchOrders();

    // Optional: Subscribe here if you need imperative logic based on order changes.
    // Otherwise, relying on async pipe in the template is usually sufficient.
    this.ordersSubscription = this.orders$.subscribe({
      next: (orders) => {
        if (orders.length === 0) {
          console.log('No orders found for this user.');
          // Optionally redirect if you want to force user to products page if no orders
          // this.router.navigate(['/products']);
        }
      },
      error: (err) => {
        console.error('Error fetching orders:', err);
        // Display user-friendly error message
        alert(`Failed to load orders: ${err.message || 'Please try again.'}`);
      }
    });
  }

  /**
   * Method to handle order cancellation.
   * Now subscribes to the Observable returned by OrderService.cancelOrder().
   * @param orderId The ID of the order to cancel.
   */
  cancelOrder(orderId: string): void {
    if (confirm(`Are you sure you want to cancel order ${orderId}? This action cannot be undone.`)) {
      this.orderService.cancelOrder(orderId).subscribe({
        next: () => {
          // Success callback
          alert(`Order ${orderId} has been successfully cancelled.`);
          // The service's cancelOrder method should internally call fetchOrders,
          // so this component's orders$ observable will automatically update.
        },
        error: (error) => {
          // Error callback
          console.error(`Failed to cancel order ${orderId}:`, error);
          alert(`Failed to cancel order ${orderId}: ${error.message || 'An unknown error occurred.'}`);
        }
      });
    }
  }

  // Helper method to navigate to products page
  goToProducts(): void {
    this.router.navigate(['/products']);
  }

  /**
   * Unsubscribe from all active subscriptions when the component is destroyed
   * to prevent memory leaks.
   */
  ngOnDestroy(): void {
    if (this.ordersSubscription) {
      this.ordersSubscription.unsubscribe();
    }
  }
}