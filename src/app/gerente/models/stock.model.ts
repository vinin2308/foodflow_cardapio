export interface StockItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  currentQuantity: number;
  minimumQuantity: number;
  maximumQuantity?: number;
  unit: string;
  purchaseDate?: Date;
  expiryDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockAlert {
  id: string;
  type: 'low_stock' | 'out_of_stock' | 'expired' | 'near_expiry';
  title: string;
  message: string;
  itemId: string;
  itemName: string;
  currentQuantity?: number;
  unit?: string;
  createdAt: Date;
}

export interface CreateStockItemRequest {
  name: string;
  description?: string;
  category: string;
  currentQuantity: number;
  minimumQuantity: number;
  maximumQuantity?: number;
  unit: string;
  purchaseDate?: Date;
  expiryDate?: Date;
}

export interface UpdateStockItemRequest extends CreateStockItemRequest {
  id: string;
}

export interface StockMovement {
  id: string;
  stockItemId: string;
  stockItemName: string;
  type: 'in' | 'out';
  quantity: number;
  reason: string;
  date: Date;
  userId: string;
  userName: string;
}

