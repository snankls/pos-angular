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
  //loadingPassword = false;
  // messageTypeProfile = '';

  loading = false;
  message: string = '';
  messageType: string = '';
  // token: string = '';
  
  // globalError: string = '';
  // globalErrorMessage: string = '';
  // isEditMode = false;
  isLoading = false;
  // errorMessage: any;
  // selected: any[] = [];
  // 

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute
  ) {}
  
  // Add your onSubmit method
  onchangePassword(): void {
    // Reset messages
    this.messagePassword = '';
    this.messageTypePassword = '';
    //this.loadingPassword = true;

    // Validate input fields
    if (!this.users.old_password || !this.users.new_password || !this.users.new_password_confirmation) {
      this.messagePassword = 'All fields are required.';
      this.messageTypePassword = 'error';
      //this.loadingPassword = false;
      return;
    }

    if (this.users.new_password !== this.users.new_password_confirmation) {
      this.messagePassword = 'New password and confirmation do not match.';
      this.messageTypePassword = 'error';
      //this.loadingPassword = false;
      return;
    }

    // Prepare FormData for API
    const data = {
      old_password: this.users.old_password,
      new_password: this.users.new_password,
      new_password_confirmation: this.users.new_password_confirmation
    };    
    
    this.http.put(`${this.API_URL}/change-password`, data).subscribe(
      (response: any) => {
        //this.loadingPassword = false;
        this.messagePassword = response.message || 'Password updated successfully';
        this.messageTypePassword = 'success';
      },
      (error) => {
        //this.loadingPassword = false;
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
