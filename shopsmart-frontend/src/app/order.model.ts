// shopsmart-frontend/src/app/order.model.ts
// Assuming you have a product.model.ts defining the Product interface
// If not, you'd define Product here or ensure it's available.
// For now, we'll assume CartItem (from cart.service.ts) has the necessary product details.

// Define how an item looks within an order (a snapshot of the product at order time)
export interface OrderItem {
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
  imageUrl: string; // To display product image in order history
}

// Define the structure of an entire order
export interface Order {
  id: string; // Unique order ID (e.g., ORD-timestamp-random)
  date: string; // ISO string for the order date/time (e.g., "2025-06-24T08:30:00.000Z")
  items: OrderItem[];
  total: number;
  status: 'Pending' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled'; // Order status
}