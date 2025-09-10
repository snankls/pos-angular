import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { CookieService } from 'ngx-cookie-service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private API_URL = environment.API_URL;
  private userIdSubject = new BehaviorSubject<number | null>(null);

  //private loggedInSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(this.isLoggedIn());
  //public loggedIn$ = this.loggedInSubject.asObservable();

  constructor(private http: HttpClient, private cookieService: CookieService) { } // Inject CookieService
  

  private currentUserSubject = new BehaviorSubject<any | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  login(username: string, password: string): Observable<any> {
    return this.http.post(`${this.API_URL}/login`, { username, password }).pipe(
      tap((response: any) => {
        this.setToken(response.token);
        //this.loggedInSubject.next(true);
        this.loadCurrentUser();
      })
    );
  }

  loadCurrentUser(): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/current-user`).pipe(
      tap({
        next: (user) => {
          if (user && user.id) {
            this.userIdSubject.next(user.id);
            this.currentUserSubject.next(user);
          } else {
            console.warn('User ID is missing in the response');
            this.userIdSubject.next(null);
            this.currentUserSubject.next(null);
          }
        },
        error: (err) => {
          console.error('Error fetching user:', err);
          this.userIdSubject.next(null);
          this.currentUserSubject.next(null);
        }
      })
    );
  }
  
  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }

  get userId$(): Observable<number | null> {
    return this.userIdSubject.asObservable();
  }

  // Use CookieService to set the token
  setToken(token: string): void {
    this.cookieService.set('token', token, { path: '/', secure: true, sameSite: 'Strict' });
  }

  // Use CookieService to get the token
  getToken(): string {
    return this.cookieService.get('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    this.cookieService.delete('token', '/'); // Delete token from cookies
    //this.loggedInSubject.next(false);
  }
}