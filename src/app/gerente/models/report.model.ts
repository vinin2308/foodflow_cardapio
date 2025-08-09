export interface DashboardMetrics {
  todayOrders: number;
  todayRevenue: number;
  todayDishesCount: number;
  revenueComparison: number; // percentual em relação ao dia anterior
  ordersComparison: number; // percentual em relação ao dia anterior
  dishesComparison: number; // percentual em relação ao dia anterior
}

export interface TopDish {
  id: string;
  name: string;
  image: string;
  ordersCount: number;
  revenue: number;
  category: string;
}

export interface SalesReport {
  date: Date;
  totalOrders: number;
  totalRevenue: number;
  totalDishes: number;
  averageOrderValue: number;
  topDishes: TopDish[];
}

export interface PeakHour {
  hour: number;
  ordersCount: number;
  revenue: number;
}

export interface CategorySales {
  categoryId: string;
  categoryName: string;
  ordersCount: number;
  revenue: number;
  percentage: number;
}

export interface MonthlyReport {
  month: number;
  year: number;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  peakHours: PeakHour[];
  categorySales: CategorySales[];
  topDishes: TopDish[];
  dailySales: { date: Date; orders: number; revenue: number }[];
}

export interface StockAlert {
  id: string;
  itemName: string;
  currentQuantity: number;
  minimumQuantity: number;
  type: 'low_stock' | 'expiring_soon' | 'expired';
  expirationDate?: Date;
  daysUntilExpiration?: number;
}

