// shopsmart-frontend/src/app/models/product.model.ts
export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  // This correctly represents the populated category object
  category: {
    _id: string;
    name: string;
  };
  stock: number;
  date: Date; // ADDED: For consistency with your backend Product schema
  // Add any other properties your Product has (e.g., if you later add 'rating' to backend)
}