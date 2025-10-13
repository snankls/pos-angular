import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../../../auth/auth.service';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';

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
  private API_URL = environment.API_URL;

  pageTitle: string = '';
  user: any = null;
  notice_board: any = null;
  isLoading = false;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.setupRouteTitle();
    this.setupUserSubscription();
    this.fetchNoticeBoard();
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
  
  fetchNoticeBoard(): void {
    this.isLoading = true;

    this.http.get(`${this.API_URL}/notice-board`).subscribe({
      next: (res: any) => {
        this.notice_board = res;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error fetching notice board:', err);
      }
    });
  }

}