export interface Order {
  id: number;
  orderNumber: string;
  dishName: string;
  description: string;
  status: OrderStatus;
  orderTime: Date;
  prepTime?: number;
  startTime?: Date;
  estimatedTime: number;
}

export enum OrderStatus {
  PENDING = 'pending',
  PREPARING = 'preparing',
  READY = 'ready'
}

export interface TimeModalData {
  order: Order | null;
  isVisible: boolean;
}

