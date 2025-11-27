import { Component, OnInit } from '@angular/core';
import { PedidosService } from '../services/pedidos.service';
import { OrderCardComponent } from './components/order-card/order-card';
import { TimeModalComponent } from './components/time-modal/time-modal';
import { CommonModule } from '@angular/common';
import { timer, switchMap, retry, share, takeUntil, Subject } from 'rxjs';import { Order, OrderStatus } from '../models/ordel.model';
import { HeaderComponent } from './components/header/header';
import { ItemCardapio } from '../models/item-cardapio.model';
import { PratoService } from '../services/prato.service';

@Component({
  standalone: true,
  imports: [OrderCardComponent, TimeModalComponent, CommonModule, HeaderComponent],
  selector: 'app-cozinha',
  templateUrl: './cozinha.html',
  styleUrls: ['./cozinha.scss']
})
export class CozinhaComponent implements OnInit {
  private destroy$ = new Subject<void>();
  OrderStatus = OrderStatus;
  pedidos: Order[] = [];
  pratosCardapio: ItemCardapio[] = [];
  filteredOrders: Order[] = [];
  currentFilter: string = 'all';
  pedidoSelecionado: Order | null = null;

  timeModal = {
  isVisible: false,
  order: null as Order | null,
  isFinalizing: false
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
  // Configura um timer que dispara agora (0ms) e depois a cada 5000ms
  timer(0, 5000)
    .pipe(
      // Cancela a requisição anterior se demorar mais que 5s e inicia a nova
      switchMap(() => this.pedidoService.listarPedidosPendentes()),
      // Se der erro na API, não mata o intervalo, apenas tenta de novo na próxima
      retry(), 
      // Limpa o intervalo quando o componente for destruído
      takeUntil(this.destroy$)
    )
    .subscribe({
      next: (pedidos) => {
        console.log('🔄 Atualizando pedidos da cozinha...', pedidos.length);
        
        // Verifica se houve mudança real para evitar "piscar" a tela à toa
        // (Opcional, mas recomendado se a lista for grande)
        if (JSON.stringify(this.pedidos) !== JSON.stringify(pedidos)) {
           this.pedidos = pedidos;
           this.aplicarFiltro();
        }
      },
      error: (err) => {
        console.error('Erro no polling da cozinha:', err);
        // Não mostre notificação visual a cada 5s para não irritar o usuário
        // Apenas logue no console.
      }
    });
}

ngOnDestroy(): void {
  this.destroy$.next();
  this.destroy$.complete();
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
    this.timeModal.isFinalizing = false;
  }
}

  onFinishOrder(pedidoId: number): void {
  const pedido = this.pedidos.find(p => p.id === pedidoId);
  if (pedido) {
    this.timeModal.order = pedido;
    this.timeModal.isVisible = true;
    this.timeModal.isFinalizing = true;
  }
}

  onConfirmTimeModal(data: { pedidoId: number, tempoEstimado: number }): void {
  if (this.timeModal.isFinalizing) {
    this.pedidoService.finalizarPedido(data.pedidoId).subscribe({
      next: () => {
        this.mostrarNotificacao('Pedido finalizado com sucesso');
        this.timeModal.isVisible = false;
        this.carregarPedidos();
      },
      error: () => this.mostrarNotificacao('Erro ao finalizar pedido', 'error')
    });
  } else {
    this.pedidoService.atualizarTempoEStatus(data.pedidoId, data.tempoEstimado, OrderStatus.PREPARING).subscribe({
      next: () => {
        this.mostrarNotificacao('Pedido marcado como em preparo');
        this.timeModal.isVisible = false;
        this.carregarPedidos();
      },
      error: () => this.mostrarNotificacao('Erro ao iniciar preparo', 'error')
    });
  }
}


  onCloseTimeModal(): void {
    this.timeModal.isVisible = false;
    this.timeModal.order = null;
  }

  onRemoveOrder(pedidoId: number): void {
  this.pedidoService.removerPedido(pedidoId).subscribe({
    next: () => {
      this.pedidos = this.pedidos.filter(p => p.id !== pedidoId);
      this.aplicarFiltro();
      this.mostrarNotificacao('Pedido removido com sucesso');
    },
    error: () => this.mostrarNotificacao('Erro ao remover pedido', 'error')
  });
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
