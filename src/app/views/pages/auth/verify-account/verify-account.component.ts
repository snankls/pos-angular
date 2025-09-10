import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-verify-account',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  ],
  templateUrl: './verify-account.component.html',
  styleUrl: './verify-account.component.scss'
})
export class VerifyAccountComponent implements OnInit {
  private API_URL = environment.API_URL;
  
  verificationMessage: string = '';
  loading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Extract token from the URL
    const token = this.route.snapshot.paramMap.get('token');

    if (token) {
      this.verifyAccount(token);
    } else {
      this.verificationMessage = 'Invalid or missing verification token.';
      this.loading = false;
    }
  }

  verifyAccount(token: string): void {
    this.http.get(`${this.API_URL}/verify-account/${token}`).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.verificationMessage = 'Your account has been successfully verified. Please login to continue.';
        } else {
          this.verificationMessage = 'Account verification failed. Please try again or contact support.';
        }
      },
      error: (error) => {
        console.error('Verification error:', error);
        this.verificationMessage = 'An error occurred during verification. Please try again later.';
      }
    });
  }
}
