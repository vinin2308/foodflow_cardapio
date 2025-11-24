import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order, OrderStatus } from '../models/ordel.model';
import { environment } from '../../enviroments/enviroment';

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
    return this.http.get<Order[]>(this.apiUrl + 'cozinha/');  // chama /api/pedidos/cozinha/
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


  
}
