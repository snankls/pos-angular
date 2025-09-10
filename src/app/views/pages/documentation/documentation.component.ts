import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../layout/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-documentation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BreadcrumbComponent,
  ],
  templateUrl: './documentation.component.html'
})
export class DocumentationComponent {
  
}
