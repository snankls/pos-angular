import { Component } from '@angular/core';
import { BreadcrumbComponent } from '../../layout/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-payment-details',
  standalone: true,
  imports: [
    BreadcrumbComponent
  ],
  templateUrl: './payment-details.component.html'
})
export class PaymentDetailsComponent {
  
}
