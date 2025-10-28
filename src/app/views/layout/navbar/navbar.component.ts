import { Component, OnInit, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from '@angular/common/http';
import { ThemeModeService } from '../../../core/services/theme-mode.service';
import { AuthService } from '../../../auth/auth.service';
import { environment } from '../../../environments/environment';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    NgbDropdownModule,
    RouterLink,
    CommonModule
  ],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent implements OnInit {
  private API_URL = environment.API_URL;
  private IMAGE_URL = environment.IMAGE_URL;
  
  showPin = false;
  user: any = null;
  currentTheme: string;
  imagePreview: string | ArrayBuffer | null = null;
  basicModalCloseResult: string = '';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router,
    private themeModeService: ThemeModeService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.user = user;
        this.user.imagePreview = user.images?.image_name
          ? `${this.IMAGE_URL}/users/${user.images.image_name}`
          : 'images/placeholder.png';
      } else {
        this.user = null;
      }
    });
  }

  togglePinVisibility() {
    this.showPin = !this.showPin;
  }

  generatePin() {
    this.http.post<{ pin_code: string }>(`${this.API_URL}/users/generate-pin`, {})
      .pipe(
        catchError(err => {
          console.error('Error generating pin:', err);
          return of(null);
        })
      )
      .subscribe(res => {
        if (res?.pin_code) {
          this.user.pin_code = res.pin_code;
        }
      });
  }

  openBasicModal(content: TemplateRef<any>) {
    this.modalService.open(content, {}).result.then((result) => {
      this.basicModalCloseResult = "Modal closed" + result
    }).catch((res) => {});
  }

  showActiveTheme(theme: string) {
    const themeSwitcher = document.querySelector('#theme-switcher') as HTMLInputElement;
    const box = document.querySelector('.box') as HTMLElement;

    if (!themeSwitcher) {
      return;
    }

    // Toggle the custom checkbox based on the theme
    if (theme === 'dark') {
      themeSwitcher.checked = true;
      box.classList.remove('light');
      box.classList.add('dark');
    } else if (theme === 'light') {
      themeSwitcher.checked = false;
      box.classList.remove('dark');
      box.classList.add('light');
    }
  }

  /**
   * Change the theme on #theme-switcher checkbox changes 
   */
  onThemeCheckboxChange(e: Event) {
    const checkbox = e.target as HTMLInputElement;
    const newTheme: string = checkbox.checked ? 'dark' : 'light';
    this.themeModeService.toggleTheme(newTheme);
    this.showActiveTheme(newTheme);
  }

  /**
   * Toggle the sidebar when the hamburger button is clicked
   */
  toggleSidebar(e: Event) {
    e.preventDefault();
    document.body.classList.add('sidebar-open');
    document.querySelector('.sidebar .sidebar-toggler')?.classList.add('active');
  }

  /**
   * Logout
   */
  onSignOut(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

}
