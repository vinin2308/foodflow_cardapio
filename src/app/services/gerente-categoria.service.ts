import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { GerenteAuthService } from './gerente-auth.service';

export interface Categoria {
  id?: number;
  nome: string;
  icone: string;
  ativo: boolean;
  criado_por?: string;
  criado_em?: string;
  atualizado_em?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GerenteCategoriaService {
  private apiUrl = `${environment.apiUrl}/gerente/categorias`;

  constructor(
    private http: HttpClient,
    private authService: GerenteAuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders().set('Authorization', `Token ${token}`);
  }

  listar(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.apiUrl}/`, { headers: this.getHeaders() });
  }

  obter(id: number): Observable<Categoria> {
    return this.http.get<Categoria>(`${this.apiUrl}/${id}/`, { headers: this.getHeaders() });
  }

  criar(categoria: Categoria): Observable<Categoria> {
    return this.http.post<Categoria>(`${this.apiUrl}/`, categoria, { headers: this.getHeaders() });
  }

  atualizar(id: number, categoria: Categoria): Observable<Categoria> {
    return this.http.put<Categoria>(`${this.apiUrl}/${id}/`, categoria, { headers: this.getHeaders() });
  }

  deletar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}/`, { headers: this.getHeaders() });
  }
}
