import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../enviroments/enviroment';
import { GerenteAuthService } from './gerente-auth.service';

export interface Prato {
  id?: number;
  nome: string;
  descricao: string;
  preco: number;
  imagem: string;
  categoria: number;
  categoria_nome?: string;
  ativo: boolean;
  criado_por?: string;
  criado_em?: string;
  atualizado_em?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GerentePratoService {
  private apiUrl = `${environment.apiUrl}/gerente/pratos`;

  constructor(
    private http: HttpClient,
    private authService: GerenteAuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders().set('Authorization', `Token ${token}`);
  }

  listar(): Observable<Prato[]> {
    return this.http.get<Prato[]>(`${this.apiUrl}/`, { headers: this.getHeaders() });
  }

  obter(id: number): Observable<Prato> {
    return this.http.get<Prato>(`${this.apiUrl}/${id}/`, { headers: this.getHeaders() });
  }

  criar(prato: Prato): Observable<Prato> {
    return this.http.post<Prato>(`${this.apiUrl}/`, prato, { headers: this.getHeaders() });
  }

  atualizar(id: number, prato: Prato): Observable<Prato> {
    return this.http.put<Prato>(`${this.apiUrl}/${id}/`, prato, { headers: this.getHeaders() });
  }

  deletar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}/`, { headers: this.getHeaders() });
  }
}
