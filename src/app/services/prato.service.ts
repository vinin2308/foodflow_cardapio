import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
// Reaproveitando a interface ou definindo uma nova se preferir
import { ItemCardapio } from '../models/item-cardapio.model'; 

@Injectable({
  providedIn: 'root'
})
export class PratoService {
  // 🔴 ATENÇÃO: Rota limpa, SEM '/gerente/'
  private apiUrl = `${environment.apiUrl}/pratos`; 

  constructor(private http: HttpClient) {}

  listarPratos(): Observable<ItemCardapio[]> {
    // 🔴 ATENÇÃO: Sem headers de Authorization
    return this.http.get<ItemCardapio[]>(`${this.apiUrl}/`);
  }
}