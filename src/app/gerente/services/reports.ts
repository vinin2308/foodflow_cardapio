import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { 
  DashboardMetrics, 
  TopDish, 
  SalesReport, 
  PeakHour, 
  CategorySales, 
  MonthlyReport,
  StockAlert 
} from '../models/report.model';

@Injectable({
  providedIn: 'root'
})
export class ReportsService {

  constructor() { }

  getDashboardMetrics(): Observable<DashboardMetrics> {
    const mockMetrics: DashboardMetrics = {
      todayOrders: 127,
      todayRevenue: 3450.75,
      todayDishesCount: 89,
      revenueComparison: 12.5, // +12.5% compared to yesterday
      ordersComparison: 8.3,   // +8.3% compared to yesterday
      dishesComparison: -2.1   // -2.1% compared to yesterday
    };

    return of(mockMetrics).pipe(delay(800));
  }

  getTopDishes(): Observable<TopDish[]> {
    const mockTopDishes: TopDish[] = [
      {
        id: '1',
        name: 'Hambúrguer Artesanal',
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=200&fit=crop',
        ordersCount: 45,
        revenue: 1125.00,
        category: 'Prato Principal'
      },
      {
        id: '2',
        name: 'Pizza Margherita',
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=200&fit=crop',
        ordersCount: 38,
        revenue: 950.00,
        category: 'Prato Principal'
      },
      {
        id: '3',
        name: 'Salada Caesar',
        image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=300&h=200&fit=crop',
        ordersCount: 32,
        revenue: 640.00,
        category: 'Entrada'
      },
      {
        id: '4',
        name: 'Café Expresso',
        image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&h=200&fit=crop',
        ordersCount: 67,
        revenue: 335.00,
        category: 'Bebida'
      },
      {
        id: '5',
        name: 'Brownie com Sorvete',
        image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=300&h=200&fit=crop',
        ordersCount: 28,
        revenue: 420.00,
        category: 'Sobremesa'
      }
    ];

    return of(mockTopDishes).pipe(delay(600));
  }

  getPeakHours(): Observable<PeakHour[]> {
    const mockPeakHours: PeakHour[] = [
      { hour: 8, ordersCount: 15, revenue: 375.00 },
      { hour: 9, ordersCount: 22, revenue: 550.00 },
      { hour: 10, ordersCount: 18, revenue: 450.00 },
      { hour: 11, ordersCount: 25, revenue: 625.00 },
      { hour: 12, ordersCount: 45, revenue: 1125.00 },
      { hour: 13, ordersCount: 38, revenue: 950.00 },
      { hour: 14, ordersCount: 28, revenue: 700.00 },
      { hour: 15, ordersCount: 20, revenue: 500.00 },
      { hour: 16, ordersCount: 16, revenue: 400.00 },
      { hour: 17, ordersCount: 22, revenue: 550.00 },
      { hour: 18, ordersCount: 35, revenue: 875.00 },
      { hour: 19, ordersCount: 42, revenue: 1050.00 },
      { hour: 20, ordersCount: 38, revenue: 950.00 },
      { hour: 21, ordersCount: 25, revenue: 625.00 },
      { hour: 22, ordersCount: 12, revenue: 300.00 }
    ];

    return of(mockPeakHours).pipe(delay(700));
  }

  getCategorySales(): Observable<CategorySales[]> {
    const mockCategorySales: CategorySales[] = [
      {
        categoryId: '1',
        categoryName: 'Prato Principal',
        ordersCount: 85,
        revenue: 2125.00,
        percentage: 45.2
      },
      {
        categoryId: '2',
        categoryName: 'Bebidas',
        ordersCount: 120,
        revenue: 600.00,
        percentage: 28.5
      },
      {
        categoryId: '3',
        categoryName: 'Entradas',
        ordersCount: 45,
        revenue: 675.00,
        percentage: 15.8
      },
      {
        categoryId: '4',
        categoryName: 'Sobremesas',
        ordersCount: 32,
        revenue: 480.00,
        percentage: 10.5
      }
    ];

    return of(mockCategorySales).pipe(delay(650));
  }

  getStockAlerts(): Observable<StockAlert[]> {
    const mockAlerts: StockAlert[] = [
      {
        id: '1',
        itemName: 'Tomate',
        currentQuantity: 5,
        minimumQuantity: 20,
        type: 'low_stock'
      },
      {
        id: '2',
        itemName: 'Leite',
        currentQuantity: 8,
        minimumQuantity: 15,
        type: 'low_stock'
      },
      {
        id: '3',
        itemName: 'Frango',
        currentQuantity: 25,
        minimumQuantity: 30,
        type: 'expiring_soon',
        expirationDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        daysUntilExpiration: 2
      },
      {
        id: '4',
        itemName: 'Queijo Mussarela',
        currentQuantity: 12,
        minimumQuantity: 25,
        type: 'expiring_soon',
        expirationDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
        daysUntilExpiration: 1
      }
    ];

    return of(mockAlerts).pipe(delay(500));
  }

  getWeeklySales(): Observable<{ date: Date; orders: number; revenue: number }[]> {
    const mockWeeklySales = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      mockWeeklySales.push({
        date: date,
        orders: Math.floor(Math.random() * 50) + 80, // 80-130 orders
        revenue: Math.floor(Math.random() * 1500) + 2500 // 2500-4000 revenue
      });
    }

    return of(mockWeeklySales).pipe(delay(600));
  }

  getMonthlySales(): Observable<{ month: string; orders: number; revenue: number }[]> {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const mockMonthlySales = [];
    
    for (let i = 0; i < 12; i++) {
      mockMonthlySales.push({
        month: months[i],
        orders: Math.floor(Math.random() * 1000) + 2000, // 2000-3000 orders
        revenue: Math.floor(Math.random() * 30000) + 50000 // 50000-80000 revenue
      });
    }

    return of(mockMonthlySales).pipe(delay(800));
  }
}

