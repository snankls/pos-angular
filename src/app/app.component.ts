import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeModeService } from './core/services/theme-mode.service';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { AuthService } from './auth/auth.service';
import { Title } from '@angular/platform-browser';
import { filter, map, mergeMap } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  title = 'Point of Sale';

  constructor(
    private themeModeService: ThemeModeService,
    private titleService: Title,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Load current user if logged in
    if (this.authService.isLoggedIn()) {
      this.authService.loadCurrentUser().subscribe();
    }

    // Set Page Title
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => {
        let route = this.activatedRoute;
        while (route.firstChild) {
          route = route.firstChild;
        }
        return route;
      }),
      mergeMap(route => route.data)
    ).subscribe(data => {
      const pageTitle = data['title']
        ? `${data['title']} - Point of Sale`
        : 'Point of Sale';
      this.titleService.setTitle(pageTitle);
    });
  }

}
