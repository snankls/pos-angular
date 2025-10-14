import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../../layout/breadcrumb/breadcrumb.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    CommonModule,
    BreadcrumbComponent,
    RouterLink,
    FormsModule,
  ],
  templateUrl: './change-password.component.html'
})
export class ChangePasswordComponent {
  private API_URL = environment.API_URL;

  users: any = {
    old_password: '',
    new_password: '',
    new_password_confirmation: ''
  };  

  formErrors: any = {};
  messageProfile = '';
  messageTypePassword = '';
  messagePassword = '';
  loading = false;
  message: string = '';
  messageType: string = '';
  isLoading = false;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute
  ) {}
  
  // Add your onSubmit method
  onchangePassword(): void {
    this.messagePassword = '';
    this.messageTypePassword = '';

    // Validate input fields
    if (!this.users.old_password || !this.users.new_password || !this.users.new_password_confirmation) {
      this.messagePassword = 'All fields are required.';
      this.messageTypePassword = 'error';
      return;
    }

    if (this.users.new_password !== this.users.new_password_confirmation) {
      this.messagePassword = 'New password and confirmation do not match.';
      this.messageTypePassword = 'error';
      return;
    }

    // Prepare FormData for API
    const data = {
      old_password: this.users.old_password,
      new_password: this.users.new_password,
      new_password_confirmation: this.users.new_password_confirmation
    };    
    
    this.http.put(`${this.API_URL}/users/change-password`, data).subscribe(
      (response: any) => {
        this.messagePassword = response.message || 'Password updated successfully';
        this.messageTypePassword = 'success';
      },
      (error) => {
        if (error.error.errors) {
          this.messagePassword = Object.values(error.error.errors).join(', ');
        } else {
          this.messagePassword = error.error.message || 'Error updating password';
        }
        this.messageTypePassword = 'error';
      }
    );
  }

}
