import { inject } from '@angular/core';
import { HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
    const authService = inject(AuthService);  // Inject the AuthService
    const router = inject(Router);  // Inject the Router for navigation
    const authToken = authService.getToken();  // Get the authentication token

    // Clone the request to add the Authorization header with the token.
    const newReq = req.clone({
        headers: req.headers.append('Authorization', `Bearer ${authToken}`),
    });

    // Handle request and catch errors (e.g., token expiration)
    return next(newReq).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
                // Token has expired or user is unauthorized
                authService.logout();  // Log out the user
                router.navigate(['/login']);
            }
            return throwError(() => error);  // Pass error to the next handler
        })
    );
}
