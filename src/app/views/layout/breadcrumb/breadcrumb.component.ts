import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../../../auth/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [
    NgbAlertModule,
    CommonModule
  ],
  templateUrl: './breadcrumb.component.html',
})
export class BreadcrumbComponent implements OnInit {
  pageTitle: string = '';
  user: any = null;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.setupRouteTitle();
    this.setupUserSubscription();
  }

  private setupRouteTitle(): void {
    let activeRoute = this.route;
    while (activeRoute.firstChild) {
      activeRoute = activeRoute.firstChild;
    }

    activeRoute.data.subscribe(data => {
      this.pageTitle = data['title'] || '';
    });
  }

  private setupUserSubscription(): void {
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
      this.cdr.detectChanges();
    });
  }
}