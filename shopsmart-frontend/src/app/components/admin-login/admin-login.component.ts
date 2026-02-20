// shopsmart-frontend/src/app/components/admin-login/admin-login.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.scss'
})
export class AdminLoginComponent implements OnInit {
  adminLoginForm!: FormGroup;
  isLoading: boolean = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.adminLoginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit(): void {
    this.isLoading = true;
    this.errorMessage = null;

    if (this.adminLoginForm.invalid) {
      this.isLoading = false;
      this.errorMessage = 'Please enter valid email and password.';
      this.adminLoginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.adminLoginForm.value;

    this.authService.login({ email, password }).subscribe({
      next: () => {
        this.isLoading = false;
        // --- CRITICAL: Check role after successful login ---
        const userRole = this.authService.getUserRole();
        if (userRole === 'admin') {
          this.router.navigate(['/admin/add-product']); // Navigate to admin dashboard/add product
        } else {
          // If a non-admin user logs in via the admin form, log them out and show error
          this.authService.logout(); // Log out locally as they shouldn't be here
          this.errorMessage = 'Access Denied: Not an administrator account.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.errors?.[0]?.msg || 'Invalid Credentials';
        console.error('Admin Login Error:', err);
      }
    });
  }
}