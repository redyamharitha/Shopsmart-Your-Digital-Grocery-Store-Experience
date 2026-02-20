// shopsmart-frontend/src/app/app.routes.ts
import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { ProductsComponent } from './components/products/products.component';
import { CartComponent } from './components/cart/cart.component';
import { CheckoutComponent } from './components/checkout/checkout.component';
import { MyOrdersComponent } from './components/my-orders/my-orders.component';

// --- NEW IMPORTS FOR ADMIN FEATURE ---
import { AddProductComponent } from './components/admin/add-product/add-product.component'; // Import AddProductComponent
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { AdminLoginComponent } from './components/admin-login/admin-login.component';
import { AdminRegisterComponent } from './components/admin-register/admin-register.component'; // <--- NEW: Import AdminRegisterComponent
// --- END NEW IMPORTS ---


export const routes: Routes = [
  // Default route - now redirects to home
  { path: '', component: HomeComponent, pathMatch: 'full' },

  // Application routes
  { path: 'home', component: HomeComponent },
  { path: 'products', component: ProductsComponent },
  { path: 'cart', component: CartComponent, canActivate: [AuthGuard] },
  { path: 'checkout', component: CheckoutComponent, canActivate: [AuthGuard] },
  { path: 'my-orders', component: MyOrdersComponent, canActivate: [AuthGuard] },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // --- NEW ADMIN AUTH ROUTES ---
  { path: 'admin-login', component: AdminLoginComponent },
  { path: 'admin-register', component: AdminRegisterComponent }, // <--- NEW: Route for Admin Register
  // --- END NEW ADMIN AUTH ROUTES ---

  // --- EXISTING ADMIN PRODUCT ROUTE ---
  {
    path: 'admin/add-product',
    component: AddProductComponent,
    canActivate: [AdminGuard]
  },
  // --- END EXISTING ADMIN PRODUCT ROUTE ---

  // Wildcard route for any other invalid paths - redirects to home
  { path: '**', redirectTo: '/home' }
];