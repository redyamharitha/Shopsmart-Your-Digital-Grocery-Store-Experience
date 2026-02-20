// shopsmart-frontend/src/app/models/category.model.ts
// This interface reflects the structure of a category as stored in MongoDB.

export interface Category {
  _id: string; // MongoDB's unique ID for the category
  name: string; // e.g., "Fruits", "Dairy"
  image?: string; // Optional: URL to category image
  date?: Date; // Optional: Date category was added
}