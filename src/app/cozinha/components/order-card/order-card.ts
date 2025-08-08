import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Order, OrderStatus } from '../../../models/ordel.model';
import { ItemCardapio } from '../../../models/item-cardapio.model';

@Component({
  selector: 'app-order-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-card.html',
  styleUrls: ['./order-card.scss']
})
export class OrderCardComponent implements OnInit, OnDestroy {
  @Input() order!: Order;
  @Input() pratosCardapio: ItemCardapio[] = [];
  @Output() startPreparation = new EventEmitter<number>();
  @Output() finishOrder = new EventEmitter<number>();
  @Output() removeOrder = new EventEmitter<number>();

  OrderStatus = OrderStatus;
  private updateInterval?: any;

  ngOnInit(): void {
    if (this.order.status === OrderStatus.PREPARING) {
      this.updateInterval = setInterval(() => {
        // Atualiza a cada segundo para recalcular tempo restante
      }, 1000);
    }
  }

  ngOnDestroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }

  getCardClass(): string {
    return `order-card-${this.order.status}`;
  }

  getStatusClass(): string {
    return `status-${this.order.status}`;
  }

  getStatusText(): string {
    switch (this.order.status) {
      case OrderStatus.PENDING:
        return 'Pendente';
      case OrderStatus.PREPARING:
        return 'Em Preparo';
      case OrderStatus.READY:
        return 'Pronto';
      default:
        return '';
    }
  }

  getOrderTime(): string {
    return new Date(this.order.data).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getNomePrato(prato_nome: number): string {
  const prato = this.pratosCardapio.find(p => p.id === prato_nome);
  return prato ? prato.nome : `Prato #${prato_nome}`;
}

  getFormattedRemainingTime(): string {
    if (!this.order.tempoEstimado || !this.order.data) return '';

    const criadoEm = new Date(this.order.data).getTime();
    const prazoMs = this.order.tempoEstimado * 60 * 1000;
    const expiracao = criadoEm + prazoMs;
    const agora = Date.now();
    const diff = Math.max(0, expiracao - agora);

    const minutos = Math.floor(diff / 60000);
    const segundos = Math.floor((diff % 60000) / 1000);

    return `${minutos}m ${segundos}s`;
  }

  isOvertime(): boolean {
    if (!this.order.tempoEstimado || !this.order.data) return false;

    const criadoEm = new Date(this.order.data).getTime();
    const prazoMs = this.order.tempoEstimado * 60 * 1000;
    return Date.now() > criadoEm + prazoMs;
  }

  getCountdownClass(): string {
    return this.isOvertime() ? 'overdue' : '';
  }

  onStartPreparation(): void {
    this.startPreparation.emit(this.order.id);
  }

  onFinishOrder(): void {
    this.finishOrder.emit(this.order.id);
  }

  onRemoveOrder(): void {
    this.removeOrder.emit(this.order.id);
  }
}
