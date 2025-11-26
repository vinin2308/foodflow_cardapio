import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export interface Prato {
  id: number;
  nome: string;
  descricao: string;
  preco: number;
}

export interface Mesa {
  id: number;
  numero: number;
  status: 'disponivel' | 'ocupada' | 'reservada';
  valor_total_mesa: number;
  pedidos: any[]; 
  garcom?: string;
  solicitou_atencao: boolean; 
}

export interface PedidoItem {
  prato: number;
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

  // --- MÉTODOS GERAIS ---

  listarPratos(): Observable<Prato[]> {
    return this.http.get<Prato[]>(`${this.baseUrl}/pratos/`);
  }

  criarPedido(pedido: Pedido): Observable<Pedido> {
    return this.http.post<Pedido>(`${this.baseUrl}/pedidos/`, pedido);
  }

  iniciarComanda(pedido: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/iniciar-comanda/`, pedido);
  }

  listarPedidosCozinha(): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(`${this.baseUrl}/pedidos/cozinha/`);
  }

  // --- MÉTODOS DO GARÇOM ---

  listarMesas(): Observable<Mesa[]> {
    return this.http.get<Mesa[]>(`${this.baseUrl}/mesas/`);
  }

  adicionarItemMesa(mesaId: number, pratoId: number, quantidade: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/mesas/${mesaId}/adicionar_item/`, {
      prato_id: pratoId,
      quantidade: quantidade
    });
  }

  liberarMesa(mesaId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/mesas/${mesaId}/liberar/`, {});
  }

  // --- ALERTAS E ENTREGA ---

  chamarGarcom(mesaId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/mesas/${mesaId}/chamar_garcom/`, {});
  }

  atenderChamado(mesaId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/mesas/${mesaId}/atender_chamado/`, {});
  }

  confirmarEntrega(pedidoId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/pedidos/${pedidoId}/entregar/`, {});
  }

  // --- ACOMPANHAMENTO (Faltava este!) ---
  
  consultarStatusPedido(codigo: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/pedido-por-codigo/${codigo}/`);
  }
}