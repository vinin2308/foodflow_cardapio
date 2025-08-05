import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Order, OrderStatus } from '../models/pedidos.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private ordersSubject = new BehaviorSubject<Order[]>([]);
  public orders$ = this.ordersSubject.asObservable();

  private mockOrders: Order[] = [
    {
      id: 1,
      orderNumber: "Mesa 12",
      dishName: "Bruschetta Italiana",
      description: "Pão italiano tostado com tomate, manjericão e azeite extra virgem",
      status: OrderStatus.PENDING,
      orderTime: new Date(Date.now() - 10 * 60 * 1000),
      estimatedTime: 15
    },
    {
      id: 2,
      orderNumber: "Mesa 8",
      dishName: "Carpaccio de Salmão",
      description: "Fatias finas de salmão fresco com alcaparras e molho de mostarda",
      status: OrderStatus.PREPARING,
      orderTime: new Date(Date.now() - 25 * 60 * 1000),
      prepTime: 20,
      startTime: new Date(Date.now() - 15 * 60 * 1000),
      estimatedTime: 20
    },
    {
      id: 3,
      orderNumber: "Mesa 15",
      dishName: "Tábua de Queijos",
      description: "Seleção de queijos artesanais com geleia de pimenta e nozes",
      status: OrderStatus.READY,
      orderTime: new Date(Date.now() - 35 * 60 * 1000),
      prepTime: 10,
      startTime: new Date(Date.now() - 20 * 60 * 1000),
      estimatedTime: 10
    },
    {
      id: 4,
      orderNumber: "Mesa 3",
      dishName: "Risotto de Cogumelos",
      description: "Arroz arbóreo cremoso com mix de cogumelos frescos e parmesão",
      status: OrderStatus.PENDING,
      orderTime: new Date(Date.now() - 5 * 60 * 1000),
      estimatedTime: 25
    },
    {
      id: 5,
      orderNumber: "Mesa 7",
      dishName: "Salmão Grelhado",
      description: "Filé de salmão grelhado com legumes salteados e molho de ervas",
      status: OrderStatus.PREPARING,
      orderTime: new Date(Date.now() - 30 * 60 * 1000),
      prepTime: 18,
      startTime: new Date(Date.now() - 8 * 60 * 1000),
      estimatedTime: 18
    }
  ];

  constructor() {
    this.ordersSubject.next(this.mockOrders);
  }

  getOrders(): Observable<Order[]> {
    return this.orders$;
  }

  getOrdersByStatus(status: OrderStatus | 'all'): Observable<Order[]> {
    return new Observable(observer => {
      this.orders$.subscribe(orders => {
        if (status === 'all') {
          observer.next(orders);
        } else {
          observer.next(orders.filter(order => order.status === status));
        }
      });
    });
  }

  startPreparation(orderId: number, prepTime: number): void {
    const orders = this.ordersSubject.value;
    const orderIndex = orders.findIndex(order => order.id === orderId);
    
    if (orderIndex !== -1) {
      orders[orderIndex] = {
        ...orders[orderIndex],
        status: OrderStatus.PREPARING,
        prepTime: prepTime,
        startTime: new Date()
      };
      
      this.ordersSubject.next([...orders]);
    }
  }

  finishOrder(orderId: number): void {
    const orders = this.ordersSubject.value;
    const orderIndex = orders.findIndex(order => order.id === orderId);
    
    if (orderIndex !== -1) {
      orders[orderIndex] = {
        ...orders[orderIndex],
        status: OrderStatus.READY
      };
      
      this.ordersSubject.next([...orders]);
    }
  }

  removeOrder(orderId: number): void {
    const orders = this.ordersSubject.value;
    const filteredOrders = orders.filter(order => order.id !== orderId);
    this.ordersSubject.next(filteredOrders);
  }

  calculateRemainingTime(order: Order): number {
    if (!order.startTime || !order.prepTime) return 0;
    
    const now = new Date();
    const elapsed = Math.floor((now.getTime() - order.startTime.getTime()) / 1000 / 60);
    return order.prepTime - elapsed;
  }

  addRandomOrder(): void {
    const dishes = [
      {
        name: "Lasanha Bolonhesa",
        description: "Lasanha tradicional com molho bolonhesa e queijo gratinado",
        estimatedTime: 30
      },
      {
        name: "Pizza Margherita",
        description: "Pizza tradicional com molho de tomate, mussarela e manjericão",
        estimatedTime: 20
      },
      {
        name: "Frango à Parmegiana",
        description: "Filé de frango empanado com molho de tomate e queijo",
        estimatedTime: 25
      },
      {
        name: "Salada Caesar",
        description: "Alface americana, croutons, parmesão e molho caesar",
        estimatedTime: 10
      }
    ];
    
    const tables = ["Mesa 1", "Mesa 4", "Mesa 6", "Mesa 9", "Mesa 11", "Mesa 14", "Mesa 16"];
    
    const randomDish = dishes[Math.floor(Math.random() * dishes.length)];
    const randomTable = tables[Math.floor(Math.random() * tables.length)];
    
    const newOrder: Order = {
      id: Date.now(),
      orderNumber: randomTable,
      dishName: randomDish.name,
      description: randomDish.description,
      status: OrderStatus.PENDING,
      orderTime: new Date(),
      estimatedTime: randomDish.estimatedTime
    };
    
    const orders = this.ordersSubject.value;
    this.ordersSubject.next([newOrder, ...orders]);
  }
}

