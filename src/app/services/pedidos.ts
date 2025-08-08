import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order, OrderStatus } from '../models/ordel.model';

@Injectable({
  providedIn: 'root'
})
export class PedidosService {
  private apiUrl = 'http://localhost:8000/api/pedidos/';

  constructor(private http: HttpClient) {}

  listarPedidos(): Observable<Order[]> {
    return this.http.get<Order[]>(this.apiUrl);
  }
  listarPedidosPendentes(): Observable<Order[]> {
    return this.http.get<Order[]>(this.apiUrl + 'cozinha/');  // chama /api/pedidos/cozinha/
}

  atualizarTempoEStatus(pedidoId: number, tempo: number, status: OrderStatus) {
  return this.http.put(`/api/pedidos/${pedidoId}`, {
    tempoEstimado: tempo,
    status: status
  });
}
  
}
