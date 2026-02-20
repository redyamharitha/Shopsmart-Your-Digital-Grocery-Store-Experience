import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms'; // Import FormsModule for ngModel
import { Router, RouterLink } from '@angular/router'; // Import Router and RouterLink
import { AuthService } from '../../services/auth.service'; // Import AuthService
import { CommonModule } from '@angular/common'; // <-- ADDED: Import CommonModule for ngIf

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule], // <-- MODIFIED: Add CommonModule here
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  email = '';
  password = '';
  errorMessage: string | null = null; // <-- ADDED: For displaying error messages

  constructor(private authService: AuthService, private router: Router) { }

  onLogin(): void {
    this.errorMessage = null; // Clear previous errors
    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        console.log('Login successful', res);
        // --- MODIFIED: Check user role and navigate accordingly ---
        const userRole = this.authService.getUserRole();
        if (userRole === 'user') {
          this.router.navigate(['/']); // Navigate to home page for regular users
        } else if (userRole === 'admin') {
          // If an admin logs in via the regular user form, log them out and show error
          this.authService.logout(); // Log out locally as they shouldn't be here
          this.errorMessage = 'Access Denied: Please use the Admin Login for administrator accounts.';
        } else {
          // Fallback for unexpected roles
          this.authService.logout();
          this.errorMessage = 'Login successful, but an unexpected user role was detected. Please try again or contact support.';
        }
        // --- END MODIFICATION ---
      },
      error: (err) => {
        console.error('Login failed', err);
        // --- MODIFIED: Display error message in the component ---
        this.errorMessage = err.error?.msg || err.error?.errors?.[0]?.msg || 'Login failed. Please check your credentials.';
        // --- END MODIFICATION ---
      }
    });
  }
}