import { Product } from './product.model'; // Ensure this import is correct

// This is the correct and consolidated CartItem interface.
// It includes the full Product object as required by the CartService and components.
export interface CartItem {
  _id?: string; // Optional: The ID of the cart item entry itself (from backend, might be undefined before saving)
  product: Product; // Crucial: This holds the full product details (id, name, price, imageUrl, etc.)
  quantity: number; // The quantity of this product in the cart
}

// This interface remains correct for representing the overall cart data.
export interface CartData {
  items: CartItem[]; // An array of the CartItem objects defined above
  total: number;     // The total price of all items in the cart
}