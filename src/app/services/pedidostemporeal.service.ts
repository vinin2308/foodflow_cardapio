import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Order } from '../models/ordel.model';

@Injectable({ providedIn: 'root' })
export class PedidosRealtimeService {
  private pedidosSubject = new BehaviorSubject<Order[]>([]);
  pedidos$ = this.pedidosSubject.asObservable();

  adicionarPedido(novoPedido: Order): void {
    const pedidos = this.pedidosSubject.value;

    // Evita duplicatas com base no ID
    const existe = pedidos.find(p => p.id === novoPedido.id);
    if (!existe) {
      this.pedidosSubject.next([...pedidos, novoPedido]);
    }
  }

  atualizarPedido(pedidoAtualizado: Order): void {
    const pedidos = this.pedidosSubject.value.map(p =>
      p.id === pedidoAtualizado.id ? pedidoAtualizado : p
    );
    this.pedidosSubject.next(pedidos);
  }

  removerPedido(id: number): void {
    const pedidos = this.pedidosSubject.value.filter(p => p.id !== id);
    this.pedidosSubject.next(pedidos);
  }

  limparPedidos(): void {
    this.pedidosSubject.next([]);
  }

  getPedidos(): Order[] {
    return this.pedidosSubject.value;
  }
}