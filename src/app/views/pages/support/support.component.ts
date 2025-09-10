import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../layout/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BreadcrumbComponent,
  ],
  templateUrl: './support.component.html'
})
export class SupportComponent {
  
}
