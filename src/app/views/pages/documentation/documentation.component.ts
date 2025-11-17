import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../layout/breadcrumb/breadcrumb.component';
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-documentation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BreadcrumbComponent,
    NgbAccordionModule
  ],
  templateUrl: './documentation.component.html'
})
export class DocumentationComponent {
  
}
