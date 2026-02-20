// shopsmart-frontend/src/app/components/admin/add-product/add-product.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms'; // Import ReactiveFormsModule
import { ProductService } from '../../../services/product.service'; // Import ProductService
import { CategoryService } from '../../../services/category.service'; // Import CategoryService
import { Category } from '../../../models/category.model'; // Import Category model
import { Router } from '@angular/router'; // For navigation after adding product

@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule], // Add ReactiveFormsModule here
  templateUrl: './add-product.component.html',
  styleUrl: './add-product.component.scss'
})
export class AddProductComponent implements OnInit {
  addProductForm!: FormGroup; // Use definite assignment assertion
  categories: Category[] = [];
  isLoading: boolean = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private categoryService: CategoryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.fetchCategories();
  }

  private initForm(): void {
    this.addProductForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      price: [null, [Validators.required, Validators.min(0.01)]],
      imageUrl: ['', [Validators.required, Validators.pattern('https?://.+')]], // Basic URL validation
      category: ['', Validators.required], // Will store category _id
      stock: [null, [Validators.required, Validators.min(0)]],
      // Add rating if your backend expects it. For now, it's optional.
      // rating: [null, [Validators.min(0), Validators.max(5)]]
    });
  }

  private fetchCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (data) => {
        this.categories = data;
        console.log('Categories fetched:', this.categories);
      },
      error: (err) => {
        this.errorMessage = 'Failed to load categories.';
        console.error('Error fetching categories:', err);
      }
    });
  }

  onSubmit(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    if (this.addProductForm.invalid) {
      this.isLoading = false;
      this.errorMessage = 'Please fill in all required fields correctly.';
      this.addProductForm.markAllAsTouched(); // Mark fields to show validation errors
      return;
    }

    // Prepare product data for backend
    const productData = {
      name: this.addProductForm.value.name,
      description: this.addProductForm.value.description,
      price: parseFloat(this.addProductForm.value.price), // Ensure price is a number
      imageUrl: this.addProductForm.value.imageUrl,
      category: this.addProductForm.value.category, // This is the category _id
      stock: parseInt(this.addProductForm.value.stock, 10), // Ensure stock is an integer
      // rating: this.addProductForm.value.rating // Include if you have it
    };

    this.productService.addProduct(productData).subscribe({
      next: (product) => {
        this.successMessage = `Product '${product.name}' added successfully!`;
        this.addProductForm.reset(); // Clear the form
        // Reset validation states after resetting the form
        Object.keys(this.addProductForm.controls).forEach(key => {
          this.addProductForm.get(key)?.setErrors(null);
        });
        console.log('Product added:', product);
        this.isLoading = false;
        // Optionally navigate after a short delay
        // setTimeout(() => {
        //   this.router.navigate(['/products']);
        // }, 2000);
      },
      error: (err) => {
        this.errorMessage = err.message || 'Failed to add product. Please try again.';
        console.error('Error adding product:', err);
        this.isLoading = false;
      }
    });
  }
}