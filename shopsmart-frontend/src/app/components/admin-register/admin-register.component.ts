// shopsmart-frontend/src/app/components/admin-register/admin-register.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service'; // Use existing AuthService
import { Router, RouterLink } from '@angular/router'; // Import RouterLink for navigation

@Component({
  selector: 'app-admin-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink], // Add RouterLink
  templateUrl: './admin-register.component.html',
  styleUrl: './admin-register.component.scss'
})
export class AdminRegisterComponent implements OnInit {
  adminRegisterForm!: FormGroup;
  isLoading: boolean = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.adminRegisterForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      adminSecretKey: ['', Validators.required] // Field for the admin secret key
    });
  }

  onSubmit(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    if (this.adminRegisterForm.invalid) {
      this.isLoading = false;
      this.errorMessage = 'Please fill in all required fields correctly.';
      this.adminRegisterForm.markAllAsTouched();
      return;
    }

    const { name, email, password, adminSecretKey } = this.adminRegisterForm.value;

    // Make a direct POST request to the admin-register endpoint
    // Since AuthService.register uses /users, we'll create a new method in AuthService for admin register
    this.authService.registerAdmin({
      name,
      email,
      password,
      admin_secret_key: adminSecretKey
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Admin account registered successfully! You can now log in.';
        this.adminRegisterForm.reset();
        Object.keys(this.adminRegisterForm.controls).forEach(key => {
          this.adminRegisterForm.get(key)?.setErrors(null);
        });
        // Optionally, navigate to admin login after success
        // setTimeout(() => {
        //   this.router.navigate(['/admin-login']);
        // }, 2000);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.errors?.[0]?.msg || 'Admin registration failed. Check secret key.';
        console.error('Admin Register Error:', err);
      }
    });
  }
}