import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, CanActivateChild } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return this.checkLogin();
  }

  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return this.checkLogin();
  }

  private checkLogin(): boolean {
    const token = this.authService.getToken();
  
    if (token) {
      console.log('AuthGuard: User is authenticated');
      return true;
    } else {
      console.log('AuthGuard: No token, redirecting to login');
      this.router.navigate(['/login']);
      return false;
    }
  }
  
}