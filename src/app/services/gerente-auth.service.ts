import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../enviroments/enviroment';

export interface GerenteUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  criado_em: string;
}

export interface AuthResponse {
  token: string;
  user: GerenteUser;
}

@Injectable({
  providedIn: 'root'
})
export class GerenteAuthService {
  private apiUrl = `${environment.apiUrl}/gerente`;
  private currentUserSubject = new BehaviorSubject<GerenteUser | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const token = localStorage.getItem('gerente_token');
    const user = localStorage.getItem('gerente_user');
    if (token && user) {
      this.currentUserSubject.next(JSON.parse(user));
    }
  }

  registro(dados: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/registro/`, dados).pipe(
      tap(response => {
        localStorage.setItem('gerente_token', response.token);
        localStorage.setItem('gerente_user', JSON.stringify(response.user));
        this.currentUserSubject.next(response.user);
      })
    );
  }

  login(username: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login/`, { username, password }).pipe(
      tap(response => {
        localStorage.setItem('gerente_token', response.token);
        localStorage.setItem('gerente_user', JSON.stringify(response.user));
        this.currentUserSubject.next(response.user);
      })
    );
  }

  logout(): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Token ${token}`);
    
    return this.http.post(`${this.apiUrl}/logout/`, {}, { headers }).pipe(
      tap(() => {
        localStorage.removeItem('gerente_token');
        localStorage.removeItem('gerente_user');
        this.currentUserSubject.next(null);
      })
    );
  }

  esqueceuSenha(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/esqueceu-senha/`, { email });
  }

  getPerfil(): Observable<GerenteUser> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Token ${token}`);
    return this.http.get<GerenteUser>(`${this.apiUrl}/perfil/`, { headers });
  }

  atualizarPerfil(dados: any): Observable<GerenteUser> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Token ${token}`);
    return this.http.put<GerenteUser>(`${this.apiUrl}/perfil/`, dados, { headers }).pipe(
      tap(user => {
        localStorage.setItem('gerente_user', JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem('gerente_token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): GerenteUser | null {
    return this.currentUserSubject.value;
  }
}
