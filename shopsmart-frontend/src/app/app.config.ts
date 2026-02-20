import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'; // IMPORTANT: Import withInterceptorsFromDi
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { HTTP_INTERCEPTORS } from '@angular/common/http'; // IMPORTANT: Import HTTP_INTERCEPTORS
import { AuthInterceptor } from './auth/auth.interceptor'; // IMPORTANT: Import your AuthInterceptor

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    // IMPORTANT: Configure provideHttpClient to use interceptors from DI
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimations(),
    // IMPORTANT: Register your AuthInterceptor here
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true // Essential if you have or plan to have multiple interceptors
    }
  ]
};