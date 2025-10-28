import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { BreadcrumbComponent } from '../../../layout/breadcrumb/breadcrumb.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    BreadcrumbComponent,
    NgbDropdownModule
  ],
  templateUrl: './profile.component.html'
})
export class ProfileComponent {
  private API_URL = environment.API_URL;
  private IMAGE_URL = environment.IMAGE_URL;
  
  totalServiceCharges: number = 0;
  itemsList: any = {} = [];
  currentRecord: any = {};
  loadingIndicator = true;
  isEditMode = false;
  image: string | ArrayBuffer | null = null;
  imagePreview: string | ArrayBuffer | null = null;
  rows: { id: number; [key: string]: any }[] = [];
  temp: { id: number; [key: string]: any }[] = [];

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    // Handle id-based route
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadUser(+id);
      }
    });
  }

  calculateTotalServiceCharges(): void {
    this.totalServiceCharges = this.itemsList.reduce((sum: number, item: any) => {
      const charge = parseFloat(item.service_charges) || 0;
      return sum + charge;
    }, 0);
  }

  loadUser(id: number) {
    this.http.get<any>(`${this.API_URL}/user/${id}`).subscribe(user => {
      this.currentRecord = user;
      
      this.itemsList = user.subscriptions || [];
      this.calculateTotalServiceCharges();

      // If user has image
      if (user.user_image) {
        this.imagePreview = `${this.IMAGE_URL}/users/${user.user_image}`;
      }

      this.isEditMode = true;
      this.loadingIndicator = false;
    });
  }

}
