import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../enviroments/enviroment';
export interface Prato {
  id: number;
  nome: string;
  descricao: string;
  preco: number;
}

export interface PedidoItem {
  prato: number;      // id do prato
  quantidade: number;
  observacao?: string;
}

export interface Pedido {
  id?: number;
  mesa: number;
  status?: string;
  itens: PedidoItem[];
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  listarPratos(): Observable<Prato[]> {
    return this.http.get<Prato[]>(`${this.baseUrl}/pratos/`);
  }

  criarPedido(pedido: Pedido): Observable<Pedido> {
    return this.http.post<Pedido>(`${this.baseUrl}/pedidos/`, pedido);
  }

  listarPedidosCozinha(): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(`${this.baseUrl}/pedidos/cozinha/`);
  }
}
