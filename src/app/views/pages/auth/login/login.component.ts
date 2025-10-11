import { NgStyle } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../../auth/auth.service';

interface Authorisation {
  token: string;
  type: string;
}

interface User {
  id: number;
  full_name: string;
  email: string;
}

interface LoginResponse {
  status: string;
  message: string;
  data: {
    user: User;
    authorisation: Authorisation;
  };
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    NgStyle,
    FormsModule,
    CommonModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  private API_URL = environment.API_URL;
  
  email: string = '';
  password: string = '';
  rememberMe: boolean = false;
  errorMessage: string = '';
  loadingLogin: boolean = false;
  messageLogin: string = '';
  contactInfo: string = '';
  messageTypeLogin: string = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {}

  onLogin(event?: Event): void {
    const loginData = {
      email: this.email,
      password: this.password,
      remember_me: this.rememberMe
    };

    // Reset previous messages
    this.messageLogin = '';
    this.messageTypeLogin = '';
    this.loadingLogin = true;

    this.http.post<LoginResponse>(`${this.API_URL}/login`, loginData).subscribe({
      next: (response) => {
        this.loadingLogin = false;
        if (response.data?.authorisation?.token) {
          this.messageLogin = 'Login successful!';
          this.messageTypeLogin = 'success';
          
          this.authService.setToken(response.data.authorisation.token);
          
          // Load current user info AFTER setting the token
          this.authService.loadCurrentUser().subscribe({
            next: (user) => {
              // After user loaded, navigate to home or wherever you want
              this.router.navigate(['/']);
            },
            error: (err) => {
              console.error('Failed to load current user:', err);
              // Still navigate or handle error
              this.router.navigate(['/']);
            }
          });
          
          // Also store token in localStorage/sessionStorage as you do now
          if (this.rememberMe) {
            localStorage.setItem('token', response.data.authorisation.token);
          } else {
            sessionStorage.setItem('token', response.data.authorisation.token);
          }
        } else {
          this.messageLogin = 'Login failed. Please try again.';
          this.messageTypeLogin = 'error';
        }
      },
      error: (error) => {
        this.loadingLogin = false;
        this.messageTypeLogin = 'error';
        
        if (error.status === 403) {
          this.messageLogin = error.error?.error || 'Access denied.';
          this.contactInfo = error.error?.contact || '';
        } else {
          this.messageLogin = error.error?.message || 'Login failed. Please try again.';
        }
        this.messageTypeLogin = 'error';
      }
    });
  }

}
