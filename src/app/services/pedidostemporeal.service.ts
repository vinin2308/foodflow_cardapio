// pedidos-realtime.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Order } from '../models/ordel.model';

@Injectable({ providedIn: 'root' })
export class PedidosRealtimeService {
  private pedidosSubject = new BehaviorSubject<Order[]>([]);
  pedidos$ = this.pedidosSubject.asObservable();

  adicionarPedido(pedido: Order) {
    const pedidosAtuais = this.pedidosSubject.value;
    this.pedidosSubject.next([...pedidosAtuais, pedido]);
  }

  limparPedidos() {
    this.pedidosSubject.next([]);
  }
}