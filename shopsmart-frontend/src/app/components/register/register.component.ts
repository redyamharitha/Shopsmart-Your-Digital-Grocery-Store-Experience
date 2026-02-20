import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms'; // Import FormsModule for ngModel
import { Router, RouterLink } from '@angular/router'; // Import Router and RouterLink
import { AuthService } from '../../services/auth.service'; // Import AuthService

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink], // Add FormsModule and RouterLink here
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  name = '';
  email = '';
  password = '';

  constructor(private authService: AuthService, private router: Router) { }

  onRegister(): void {
    const userData = {
      name: this.name,
      email: this.email,
      password: this.password
    };

    this.authService.register(userData).subscribe({
      next: (res) => {
        console.log('Registration successful', res);
        alert('Registration successful! Please log in.'); // Inform the user
        this.router.navigate(['/login']); // Redirect to login page after successful registration
      },
      error: (err) => {
        console.error('Registration failed', err);
        // Handle registration errors (e.g., display error message to user)
        alert('Registration failed: ' + (err.error.msg || err.message || 'An unknown error occurred.'));
      }
    });
  }
}