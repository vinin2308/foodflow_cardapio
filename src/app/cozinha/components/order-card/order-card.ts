import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Order, OrderStatus } from '../../../models/pedidos.model';
import { OrderService } from '../../../services/pedidos';

@Component({
  selector: 'app-order-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-card.html',
  styleUrls: ['./order-card.scss']
})
export class OrderCardComponent implements OnInit, OnDestroy {
  @Input() order!: Order;
  @Output() startPreparation = new EventEmitter<Order>();
  @Output() finishOrder = new EventEmitter<number>();
  @Output() removeOrder = new EventEmitter<number>();

  private updateInterval: any;

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    // Atualizar countdown a cada segundo se estiver em preparo
    if (this.order.status === OrderStatus.PREPARING) {
      this.updateInterval = setInterval(() => {
        // Força a atualização do componente
      }, 1000);
    }
  }

  ngOnDestroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }

  getCardClass(): string {
    return this.order.status;
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
    return this.order.orderTime.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  getRemainingTime(): number {
    return this.orderService.calculateRemainingTime(this.order);
  }

  getFormattedRemainingTime(): string {
    const minutes = Math.abs(this.getRemainingTime());
    if (minutes < 60) {
      return `${minutes}min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}min`;
    }
  }

  getCountdownClass(): string {
    return this.isOvertime() ? 'countdown overtime' : 'countdown';
  }

  isOvertime(): boolean {
    return this.getRemainingTime() <= 0;
  }

  onStartPreparation(): void {
    this.startPreparation.emit(this.order);
  }

  onFinishOrder(): void {
    this.finishOrder.emit(this.order.id);
  }

  onRemoveOrder(): void {
    this.removeOrder.emit(this.order.id);
  }
}

