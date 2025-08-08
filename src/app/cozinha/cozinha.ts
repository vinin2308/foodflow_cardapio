import { Component, OnInit } from '@angular/core';
import { PedidosService } from '../services/pedidos';
import { OrderCardComponent } from './components/order-card/order-card';
import { TimeModalComponent } from './components/time-modal/time-modal';
import { CommonModule } from '@angular/common';
import { interval, switchMap } from 'rxjs';
import { Order, OrderStatus } from '../models/ordel.model';
import { HeaderComponent } from './components/header/header';
import { ItemCardapio } from '../models/item-cardapio.model';
import { PratoService } from '../services/prato';

@Component({
  standalone: true,
  imports: [OrderCardComponent, TimeModalComponent, CommonModule, HeaderComponent],
  selector: 'app-cozinha',
  templateUrl: './cozinha.html',
  styleUrls: ['./cozinha.scss']
})
export class CozinhaComponent implements OnInit {
  OrderStatus = OrderStatus;
  pedidos: Order[] = [];
  pratosCardapio: ItemCardapio[] = [];
  filteredOrders: Order[] = [];
  currentFilter: string = 'all';
  pedidoSelecionado: Order | null = null;

  timeModal = {
    isVisible: false,
    order: null as Order | null
  };

  notification = {
    show: false,
    message: '',
    type: 'success'
  };

  constructor(
    private pedidoService: PedidosService,
    private pratoService: PratoService
  ) {}

  ngOnInit(): void {
    this.carregarPedidosPendentes();

    interval(5000)
      .pipe(switchMap(() => this.pedidoService.listarPedidosPendentes()))
      .subscribe({
        next: pedidos => {
          this.pedidos = pedidos;
          this.aplicarFiltro();
        },
        error: () => this.mostrarNotificacao('Erro ao atualizar pedidos', 'error')
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
    this.filteredOrders = this.currentFilter === 'all'
      ? this.pedidos
      : this.pedidos.filter(p => p.status === this.currentFilter);
  }

  setFilter(filtro: string): void {
    this.currentFilter = filtro;
    this.aplicarFiltro();
  }

  onStartPreparation(pedidoId: number): void {
    const pedido = this.pedidos.find(p => p.id === pedidoId);
    if (pedido) {
      this.timeModal.order = pedido;
      this.timeModal.isVisible = true;
    }
  }

  onFinishOrder(pedidoId: number): void {
    const pedido = this.pedidos.find(p => p.id === pedidoId);
    if (pedido) {
      this.timeModal.order = pedido;
      this.timeModal.isVisible = true;
    }
  }

  onConfirmTimeModal(data: { pedidoId: number, tempoEstimado: number }): void {
    this.pedidoService.atualizarTempoEStatus(data.pedidoId, data.tempoEstimado, OrderStatus.PREPARING).subscribe({
      next: () => {
        this.mostrarNotificacao('Pedido marcado como em preparo');
        this.timeModal.isVisible = false;
        this.carregarPedidos();
      },
      error: () => this.mostrarNotificacao('Erro ao iniciar preparo', 'error')
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
