import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Order, OrderStatus } from '../../../models/ordel.model';
@Component({
  selector: 'app-order-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-card.html',
  styleUrls: ['./order-card.scss']
})
export class OrderCardComponent implements OnInit, OnDestroy {
  @Input() order!: Order;
  @Output() startPreparation = new EventEmitter<number>();
  @Output() finishOrder = new EventEmitter<number>();
  @Output() removeOrder = new EventEmitter<number>();

  OrderStatus = OrderStatus;
  private updateInterval?: any;

  ngOnInit(): void {
    if (this.order.status === OrderStatus.PREPARING) {
      // Atualiza a cada segundo para contar o tempo restante do preparo
      this.updateInterval = setInterval(() => {
        // Pode disparar change detection ou recalcular o tempo restante
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
    return new Date(this.order.tempoEstimado).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  /** 
   * Calcula o tempo restante para preparo baseado no tempo estimado (minutos)
   * e a hora de criação do pedido.
   */
  getFormattedRemainingTime(): string {
    if (!this.order.tempoEstimado) return '';

    const criadoEm = new Date(this.order.tempoEstimado);
    const prazoMs = this.order.tempoEstimado * 60 * 1000;
    const expiracao = criadoEm.getTime() + prazoMs;
    const agora = Date.now();
    let diff = Math.max(0, expiracao - agora);

    const minutos = Math.floor(diff / 60000);
    const segundos = Math.floor((diff % 60000) / 1000);

    return `${minutos}m ${segundos}s`;
  }

  isOvertime(): boolean {
    if (!this.order.tempoEstimado) return false;

    const criadoEm = new Date(this.order.tempoEstimado);
    const prazoMs = this.order.tempoEstimado * 60 * 1000;
    return (Date.now() - criadoEm.getTime()) > prazoMs;
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
