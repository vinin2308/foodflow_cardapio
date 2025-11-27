import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CategoriaCardapio } from '../models/item-cardapio.model';

@Injectable({
  providedIn: 'root'
})
export class CategoriaService {
  // 🔴 ATENÇÃO: Rota limpa, SEM '/gerente/'
  private apiUrl = `${environment.apiUrl}/categorias`;

  constructor(private http: HttpClient) {}

  listarCategorias(): Observable<CategoriaCardapio[]> {
    return this.http.get<CategoriaCardapio[]>(`${this.apiUrl}/`);
  }
}