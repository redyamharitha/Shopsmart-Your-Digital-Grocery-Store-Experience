import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // Ensure this is imported
import { RouterLink } from '@angular/router'; // Add RouterLink for navigation

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink], // Add RouterLink here
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {

}