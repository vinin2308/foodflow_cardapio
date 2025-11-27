import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order, OrderStatus } from '../models/ordel.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PedidosService {
  private apiUrl = environment.apiUrl + '/pedidos/';

  constructor(private http: HttpClient) {}

  listarPedidos(): Observable<Order[]> {
    return this.http.get<Order[]>(this.apiUrl);
  }
  listarPedidosPendentes(): Observable<Order[]> {
    return this.http.get<Order[]>(this.apiUrl + 'cozinha/'); 
  }

  atualizarTempoEStatus(pedidoId: number, tempo: number, status: OrderStatus): Observable<any> {
    return this.http.patch(this.apiUrl + pedidoId + '/', {
      tempo_estimado: tempo,
      status: status
    });
  }

  finalizarPedido(pedidoId: number): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}${pedidoId}/finalizar/`, {});
  }

  removerPedido(id: number) {
    return this.http.delete(`${this.apiUrl}${id}/`);
  }

  /**
   * NOVO MÉTODO: Consulta o status e tempo estimado de um pedido de forma resumida (Polling).
   * @param codigo O código de acesso do pedido.
   * @returns Um Observable que retorna o status e tempo estimado.
   */
  consultarStatusResumido(codigo: string): Observable<any> {
    // ⚠️ ATENÇÃO: Ajuste este endpoint para o seu backend.
    // Exemplo de Endpoint Leve: /api/pedidos/status_resumo/?codigo=YTFZYE
    return this.http.get<any>(`${this.apiUrl}status_resumo/?codigo=${codigo}`);
  }
}