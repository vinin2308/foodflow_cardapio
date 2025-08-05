import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Order, OrderStatus, TimeModalData } from '../models/pedidos.model';
import { OrderService } from '../services/pedidos';
import { HeaderComponent } from './components/header/header';
import { OrderCardComponent } from './components/order-card/order-card';
import { TimeModalComponent } from './components/time-modal/time-modal';

interface Notification {
  show: boolean;
  message: string;
  type: 'success' | 'info';
}

@Component({
  selector: 'app-kitchen-screen',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, OrderCardComponent, TimeModalComponent],
  templateUrl: './cozinha.html',
  styleUrls: ['./cozinha.scss']
})
export class CozinhaComponent implements OnInit, OnDestroy {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  currentFilter: OrderStatus | 'all' = 'all';
  OrderStatus = OrderStatus; // Expor enum para o template
  
  timeModal: TimeModalData = {
    order: null,
    isVisible: false
  };

  notification: Notification = {
    show: false,
    message: '',
    type: 'info'
  };

  private ordersSubscription?: Subscription;
  private randomOrderInterval: any;

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.ordersSubscription = this.orderService.getOrders().subscribe(orders => {
      this.orders = orders;
      this.applyFilter();
    });

    // Simular novos pedidos a cada 2-5 minutos
    this.randomOrderInterval = setInterval(() => {
      if (Math.random() > 0.7) { // 30% de chance
        this.orderService.addRandomOrder();
      }
    }, 120000); // 2 minutos
  }

  ngOnDestroy(): void {
    if (this.ordersSubscription) {
      this.ordersSubscription.unsubscribe();
    }
    if (this.randomOrderInterval) {
      clearInterval(this.randomOrderInterval);
    }
  }

  setFilter(filter: OrderStatus | 'all'): void {
    this.currentFilter = filter;
    this.applyFilter();
  }

  private applyFilter(): void {
    if (this.currentFilter === 'all') {
      this.filteredOrders = [...this.orders];
    } else {
      this.filteredOrders = this.orders.filter(order => order.status === this.currentFilter);
    }
  }

  onStartPreparation(order: Order): void {
    this.timeModal = {
      order: order,
      isVisible: true
    };
  }

  onFinishOrder(orderId: number): void {
    const order = this.orders.find(o => o.id === orderId);
    if (order) {
      this.orderService.finishOrder(orderId);
      this.showNotification(`Pedido finalizado: ${order.dishName}`, 'success');
    }
  }

  onRemoveOrder(orderId: number): void {
    const order = this.orders.find(o => o.id === orderId);
    if (order) {
      this.orderService.removeOrder(orderId);
      this.showNotification(`Pedido removido: ${order.dishName}`, 'info');
    }
  }

  onCloseTimeModal(): void {
    this.timeModal = {
      order: null,
      isVisible: false
    };
  }

  onConfirmTimeModal(data: { orderId: number, prepTime: number }): void {
    const order = this.orders.find(o => o.id === data.orderId);
    if (order) {
      this.orderService.startPreparation(data.orderId, data.prepTime);
      this.showNotification(`Preparo iniciado: ${order.dishName} (${data.prepTime} min)`, 'success');
    }
    this.onCloseTimeModal();
  }

  getNotificationIcon(): string {
    return this.notification.type === 'success' ? 'fa-check-circle' : 'fa-info-circle';
  }

  private showNotification(message: string, type: 'success' | 'info'): void {
    this.notification = {
      show: true,
      message: message,
      type: type
    };

    setTimeout(() => {
      this.notification.show = false;
    }, 3000);
  }
}

