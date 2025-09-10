import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  ],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.scss'
})
export class ChangePasswordComponent implements OnInit {
  private API_URL = environment.API_URL;

  users: any = {
    new_password: '',
    confirm_password: ''
  };
  loading = false;
  message: string = '';
  messageType: string = '';
  token: string = '';

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get the token from the route
    this.token = this.route.snapshot.paramMap.get('token') || '';
  }

  onSubmit(): void {
    this.message = '';
    this.messageType = '';
    this.loading = true;

    // Prepare the payload
    const payload = {
      token: this.token,
      new_password: this.users.new_password,
      new_password_confirmation: this.users.confirm_password
    };

    this.http.post(`${this.API_URL}/change-password`, payload).subscribe(
      (response: any) => {
        // Set success message
        this.loading = false;
        this.message = response.message || 'Password updated successfully!';
        this.messageType = 'success';
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      (error) => {
        // Handle validation errors
        this.loading = false;
        if (error.error.errors) {
          // Extract and join validation error messages
          this.message = Object.values(error.error.errors).join(', ');
        } else {
          this.message = error.error.message || 'Error updating password.';
        }
        this.messageType = 'error';
      }
    );
  }
}
