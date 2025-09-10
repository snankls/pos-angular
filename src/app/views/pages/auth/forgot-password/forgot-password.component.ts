import { NgStyle } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../environments/environment';

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
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    NgStyle,
    FormsModule,
    CommonModule,
  ],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent implements OnInit {
  private API_URL = environment.API_URL;
  private NG_URL = environment.NG_URL;

  formData = {
    email: '',
    ng_url: this.NG_URL
  };
  loading: boolean = false;
  message: string = '';
  messageType: string = '';
  
  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void { }

  onSubmit(): void {
    this.message = '';
    this.messageType = '';
    this.loading = true;

    this.http.post(`${this.API_URL}/forgot-password`, this.formData).subscribe({
      next: (response: any) => {
        this.loading = false;
        if (response.success) {
          this.message = response.message || 'A password reset link has been sent to your email.';
          this.messageType = 'success';
        } else {
          this.message = response.message || 'Failed to send reset link. Please try again.';
          this.messageType = 'error';
        }
      },
      error: (error) => {
        this.loading = false;
        this.message = error.error?.message || 'An error occurred. Please try again later.';
        this.messageType = 'error';
      }
    });
  }

}
