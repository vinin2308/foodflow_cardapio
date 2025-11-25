import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
  // ❌ Removido: @Input() pratosCardapio (não precisa mais)
  
  @Output() startPreparation = new EventEmitter<number>();
  @Output() finishOrder = new EventEmitter<number>();
  @Output() removeOrder = new EventEmitter<number>();

  OrderStatus = OrderStatus;
  private updateInterval?: any;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (this.order.status === OrderStatus.PREPARING) {
      this.updateInterval = setInterval(() => {
        this.cdr.detectChanges();
      }, 1000);
    }
  }

  ngOnDestroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }

  getCardClass(): string { return this.order.status; }
  getStatusClass(): string { return `status-${this.order.status}`; }

  getStatusText(): string {
    const map = { [OrderStatus.PENDING]: 'Pendente', [OrderStatus.PREPARING]: 'Em Preparo', [OrderStatus.READY]: 'Pronto' };
    return map[this.order.status] || this.order.status;
  }

  // ✅ CORREÇÃO 1: Usar 'criado_em'
  getOrderTime(): string {
    if (!this.order.criado_em) return '--:--';
    return new Date(this.order.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  // ✅ CORREÇÃO 2: Usar 'criado_em'
  getFormattedRemainingTime(): string {
    if (!this.order.tempo_estimado || !this.order.criado_em) return '';
    const criadoEm = new Date(this.order.criado_em).getTime();
    const prazoMs = this.order.tempo_estimado * 60 * 1000;
    const diff = Math.max(0, (criadoEm + prazoMs) - Date.now());
    const minutos = Math.floor(diff / 60000);
    const segundos = Math.floor((diff % 60000) / 1000);
    return `${minutos}m ${segundos}s`;
  }

  // ✅ CORREÇÃO 3: Usar 'criado_em'
  isOvertime(): boolean {
    if (!this.order.tempo_estimado || !this.order.criado_em) return false;
    const criadoEm = new Date(this.order.criado_em).getTime();
    return Date.now() > criadoEm + (this.order.tempo_estimado * 60 * 1000);
  }

  onStartPreparation(): void { this.startPreparation.emit(this.order.id); }
  onFinishOrder(): void { this.finishOrder.emit(this.order.id); }
  onRemoveOrder(): void { this.removeOrder.emit(this.order.id); }
}