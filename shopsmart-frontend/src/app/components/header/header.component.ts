import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common'; // <-- ADD THIS LINE

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, CommonModule], // <-- ADD CommonModule here
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {
  isLoggedIn: boolean = false;
  private authStatusSubscription: Subscription = new Subscription();

  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit(): void {
    //console.log('HeaderComponent ngOnInit: Initial check for isLoggedIn (before subscription):', this.authService.isAuthenticated()); // TEMP LOG
    this.isLoggedIn = this.authService.isAuthenticated();

    this.authStatusSubscription = this.authService.getAuthStatusListener().subscribe(
      isAuthenticated => {
        this.isLoggedIn = isAuthenticated;
       // console.log('HeaderComponent: Auth status changed to:', this.isLoggedIn); // TEMP LOG
      }
    );
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    this.authStatusSubscription.unsubscribe();
  }
}