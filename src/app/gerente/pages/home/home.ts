import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../components/layout/header/header';
import { SidebarComponent } from '../../components/layout/sidebar/sidebar';
import { ReportsService } from '../../services/reports';
import { AuthService } from '../../services/auth';
import { 
  DashboardMetrics, 
  TopDish, 
  PeakHour, 
  CategorySales, 
  StockAlert 
} from '../../models/report.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, SidebarComponent],
  templateUrl: './home.html',
  styleUrls: ['./home.scss']
})
export class HomeComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('salesChart') salesChartRef!: ElementRef<HTMLCanvasElement>;
  
  // Layout state
  sidebarCollapsed = false;
  showMobileSidebar = false;
  
  // Dashboard data
  dashboardMetrics: DashboardMetrics | null = null;
  topDishes: TopDish[] = [];
  peakHours: PeakHour[] = [];
  categorySales: CategorySales[] = [];
  stockAlerts: StockAlert[] = [];
  weeklySales: { date: Date; orders: number; revenue: number }[] = [];
  
  // Chart configuration
  chartType: 'line' | 'bar' = 'line';
  salesChart: any = null;
  
  // Utility
  Math = Math;
  
  private subscription = new Subscription();

  constructor(
    private reportsService: ReportsService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Check authentication
    if (!this.authService.isAuthenticated()) {
      return;
    }

    // Load sidebar state
    const savedCollapsed = localStorage.getItem('sidebar_collapsed');
    if (savedCollapsed) {
      this.sidebarCollapsed = savedCollapsed === 'true';
    }

    // Load dashboard data
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    // Initialize chart after view is ready
    setTimeout(() => {
      if (this.weeklySales.length > 0) {
        this.initializeSalesChart();
      }
    }, 100);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    if (this.salesChart) {
      this.salesChart.destroy();
    }
  }

  loadDashboardData(): void {
    // Load dashboard metrics
    const metricsSub = this.reportsService.getDashboardMetrics().subscribe({
      next: (metrics) => {
        this.dashboardMetrics = metrics;
      },
      error: (error) => {
        console.error('Error loading dashboard metrics:', error);
      }
    });
    this.subscription.add(metricsSub);

    // Load top dishes
    const dishesSub = this.reportsService.getTopDishes().subscribe({
      next: (dishes) => {
        this.topDishes = dishes.slice(0, 5); // Show top 5
      },
      error: (error) => {
        console.error('Error loading top dishes:', error);
      }
    });
    this.subscription.add(dishesSub);

    // Load peak hours
    const hoursSub = this.reportsService.getPeakHours().subscribe({
      next: (hours) => {
        this.peakHours = hours;
      },
      error: (error) => {
        console.error('Error loading peak hours:', error);
      }
    });
    this.subscription.add(hoursSub);

    // Load category sales
    const categoriesSub = this.reportsService.getCategorySales().subscribe({
      next: (categories) => {
        this.categorySales = categories;
      },
      error: (error) => {
        console.error('Error loading category sales:', error);
      }
    });
    this.subscription.add(categoriesSub);

    // Load stock alerts
    const alertsSub = this.reportsService.getStockAlerts().subscribe({
      next: (alerts) => {
        this.stockAlerts = alerts.slice(0, 4); // Show top 4 alerts
      },
      error: (error) => {
        console.error('Error loading stock alerts:', error);
      }
    });
    this.subscription.add(alertsSub);

    // Load weekly sales
    const salesSub = this.reportsService.getWeeklySales().subscribe({
      next: (sales) => {
        this.weeklySales = sales;
        if (this.salesChartRef) {
          this.initializeSalesChart();
        }
      },
      error: (error) => {
        console.error('Error loading weekly sales:', error);
      }
    });
    this.subscription.add(salesSub);
  }

  initializeSalesChart(): void {
    if (!this.salesChartRef || this.weeklySales.length === 0) return;

    const ctx = this.salesChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart
    if (this.salesChart) {
      this.salesChart.destroy();
    }

    const labels = this.weeklySales.map(sale => {
      const date = new Date(sale.date);
      return date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' });
    });

    const ordersData = this.weeklySales.map(sale => sale.orders);
    const revenueData = this.weeklySales.map(sale => sale.revenue);

    // Simple chart implementation (you would normally use Chart.js here)
    this.drawSimpleChart(ctx, labels, ordersData, revenueData);
  }

  drawSimpleChart(ctx: CanvasRenderingContext2D, labels: string[], ordersData: number[], revenueData: number[]): void {
    const canvas = ctx.canvas;
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Set up chart area
    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;
    
    // Find max values for scaling
    const maxOrders = Math.max(...ordersData);
    const maxRevenue = Math.max(...revenueData);
    
    // Draw grid lines
    ctx.strokeStyle = '#E9ECEF';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }
    
    // Draw data points and lines
    if (this.chartType === 'line') {
      this.drawLineChart(ctx, labels, ordersData, maxOrders, padding, chartWidth, chartHeight);
    } else {
      this.drawBarChart(ctx, labels, ordersData, maxOrders, padding, chartWidth, chartHeight);
    }
    
    // Draw labels
    ctx.fillStyle = '#6C757D';
    ctx.font = '12px Roboto';
    ctx.textAlign = 'center';
    
    labels.forEach((label, index) => {
      const x = padding + (chartWidth / (labels.length - 1)) * index;
      ctx.fillText(label, x, height - 10);
    });
  }

  drawLineChart(ctx: CanvasRenderingContext2D, labels: string[], data: number[], maxValue: number, padding: number, chartWidth: number, chartHeight: number): void {
    ctx.strokeStyle = '#722F37';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    data.forEach((value, index) => {
      const x = padding + (chartWidth / (data.length - 1)) * index;
      const y = padding + chartHeight - (value / maxValue) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      
      // Draw data points
      ctx.fillStyle = '#722F37';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    });
    
    ctx.stroke();
  }

  drawBarChart(ctx: CanvasRenderingContext2D, labels: string[], data: number[], maxValue: number, padding: number, chartWidth: number, chartHeight: number): void {
    const barWidth = chartWidth / data.length * 0.6;
    
    data.forEach((value, index) => {
      const x = padding + (chartWidth / data.length) * index + (chartWidth / data.length - barWidth) / 2;
      const barHeight = (value / maxValue) * chartHeight;
      const y = padding + chartHeight - barHeight;
      
      ctx.fillStyle = '#722F37';
      ctx.fillRect(x, y, barWidth, barHeight);
    });
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    localStorage.setItem('sidebar_collapsed', this.sidebarCollapsed.toString());
  }

  toggleChartType(): void {
    this.chartType = this.chartType === 'line' ? 'bar' : 'line';
    this.initializeSalesChart();
  }

  getAverageOrderValue(): number {
    if (!this.dashboardMetrics) return 0;
    return this.dashboardMetrics.todayRevenue / this.dashboardMetrics.todayOrders;
  }

  getHourBarHeight(ordersCount: number): number {
    if (this.peakHours.length === 0) return 0;
    const maxOrders = Math.max(...this.peakHours.map(h => h.ordersCount));
    return (ordersCount / maxOrders) * 100;
  }

  getAlertIcon(type: string): string {
    switch (type) {
      case 'low_stock': return 'inventory_2';
      case 'expiring_soon': return 'schedule';
      case 'expired': return 'error';
      default: return 'warning';
    }
  }

  getAlertMessage(alert: StockAlert): string {
    switch (alert.type) {
      case 'low_stock':
        return `Estoque baixo: ${alert.currentQuantity} de ${alert.minimumQuantity} unidades`;
      case 'expiring_soon':
        return `Vence em ${alert.daysUntilExpiration} dia(s)`;
      case 'expired':
        return 'Produto vencido';
      default:
        return 'Alerta de estoque';
    }
  }

  handleAlert(alert: StockAlert): void {
    console.log('Handling alert:', alert);
    // Navigate to stock page or open modal
  }

  refreshData(): void {
    this.loadDashboardData();
  }

  exportReport(): void {
    console.log('Exporting report...');
    // Implement export functionality
  }
}

