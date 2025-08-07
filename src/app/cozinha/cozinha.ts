import { Component, OnInit } from '@angular/core';
import { PedidoService } from '../services/pedidos';
import { OrderCardComponent } from './components/order-card/order-card';
import { TimeModalComponent } from './components/time-modal/time-modal';
import { CommonModule } from '@angular/common';
import { interval, switchMap } from 'rxjs';
import { Order, OrderStatus } from '../models/ordel.model';

@Component({
  standalone: true,
  imports: [OrderCardComponent, TimeModalComponent, CommonModule],
  selector: 'app-cozinha',
  templateUrl: './cozinha.html',
  styleUrls: ['./cozinha.scss']
})
export class CozinhaComponent implements OnInit {
  OrderStatus = OrderStatus;
  private pedidosAntigos: Order[] = [];
  pedidos: Order[] = [];
  filteredOrders: Order[] = [];
  currentFilter: string = 'all';
  pedidosPendentes: Order[] = [];
  pedidoSelecionado: Order | null = null;
  modalVisivel: boolean = false;



  notification = {
    show: false,
    message: '',
    type: 'success' // ou 'error'
  };

  timeModal = {
    isVisible: false,
    order: null as Order | null
  };

  constructor(private pedidoService: PedidoService) {}
  

  ngOnInit(): void {
    this.carregarPedidosPendentes();

    interval(5000)
      .pipe(
        switchMap(() => this.pedidoService.listarPedidosPendentes())
      )
      .subscribe({
        next: pedidos => {
          this.pedidos = pedidos;
          this.aplicarFiltro();
        },
        error: () => this.mostrarNotificacao('Erro ao carregar pedidos', 'error')
      });
  }

  carregarPedidosPendentes(): void {
    this.pedidoService.listarPedidosPendentes().subscribe({
      next: pedidos => {
        this.pedidos = pedidos;
        this.aplicarFiltro();
      },
      error: () => this.mostrarNotificacao('Erro ao carregar pedidos', 'error')
    });
  }

  carregarPedidos(): void {
    this.pedidoService.listarPedidos().subscribe({
      next: pedidos => {
        this.pedidos = pedidos;
        this.aplicarFiltro();
      },
      error: () => this.mostrarNotificacao('Erro ao carregar pedidos', 'error')
    });
  }

  aplicarFiltro(): void {
    if (this.currentFilter === 'all') {
      this.filteredOrders = this.pedidos;
    } else {
      this.filteredOrders = this.pedidos.filter(p => p.status === this.currentFilter);
    }
  }

  setFilter(filtro: string): void {
    this.currentFilter = filtro;
    this.aplicarFiltro();
  }

  onStartPreparation(pedidoId: number) {
  this.pedidoService.atualizarStatus(pedidoId, OrderStatus.PREPARING).subscribe({
    next: () => {
      this.mostrarNotificacao('Pedido marcado como em preparo');
      this.carregarPedidosPendentes();
    },
    error: () => this.mostrarNotificacao('Erro ao atualizar pedido', 'error')
  });
}

  onFinishOrder(pedidoId: number): void {
    const pedido = this.pedidos.find(p => p.id === pedidoId);
    if (pedido) {
      this.timeModal.order = pedido;
      this.timeModal.isVisible = true;
    }
  }

  onConfirmTimeModal(data: { pedidoId: number, tempoEstimado: number }): void {
    this.pedidoService.atualizarStatus(data.pedidoId, OrderStatus.READY).subscribe({
      next: () => {
        this.mostrarNotificacao('Pedido finalizado');
        this.timeModal.isVisible = false;
        this.carregarPedidos();
      },
      error: () => this.mostrarNotificacao('Erro ao finalizar pedido', 'error')
    });
  }

  onCloseTimeModal(): void {
    this.timeModal.isVisible = false;
    this.timeModal.order = null;
  }

  onRemoveOrder(pedidoId: number): void {
    this.pedidos = this.pedidos.filter(p => p.id !== pedidoId);
    this.aplicarFiltro();
  }

  mostrarNotificacao(msg: string, tipo: 'success' | 'error' = 'success') {
    this.notification.message = msg;
    this.notification.type = tipo;
    this.notification.show = true;
    setTimeout(() => this.notification.show = false, 3000);
  }

  getNotificationIcon(): string {
    return this.notification.type === 'success' ? 'fa-check-circle' : 'fa-times-circle';
  }
}
