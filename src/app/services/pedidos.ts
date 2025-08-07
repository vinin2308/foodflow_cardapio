import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order } from '../models/ordel.model';

@Injectable({
  providedIn: 'root'
})
export class PedidoService {
  private apiUrl = 'http://localhost:8000/api/pedidos/';

  constructor(private http: HttpClient) {}

  listarPedidos(): Observable<Order[]> {
    return this.http.get<Order[]>(this.apiUrl);
  }
  listarPedidosPendentes(): Observable<Order[]> {
    return this.http.get<Order[]>(this.apiUrl + 'cozinha/');  // chama /api/pedidos/cozinha/
}

  atualizarStatus(pedidoId: number, status: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}${pedidoId}/`, { status });
  }
  
}
