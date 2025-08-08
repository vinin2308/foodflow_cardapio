import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReportsService } from '../../../services/reports';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss']
})
export class SidebarComponent implements OnInit, OnDestroy {
  @Input() isCollapsed = false;
  @Input() showMobileOverlay = false;
  
  stockAlerts = 4; // Mock stock alerts count
  todayStats = {
    orders: 127,
    revenue: 3450,
    dishes: 89
  };
  
  private subscription = new Subscription();

  constructor(private reportsService: ReportsService) {}

  ngOnInit(): void {
    this.loadTodayStats();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadTodayStats(): void {
    const metricsSub = this.reportsService.getDashboardMetrics().subscribe({
      next: (metrics) => {
        this.todayStats = {
          orders: metrics.todayOrders,
          revenue: metrics.todayRevenue,
          dishes: metrics.todayDishesCount
        };
      },
      error: (error) => {
        console.error('Error loading dashboard metrics:', error);
      }
    });

    this.subscription.add(metricsSub);
  }

  toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
    // Save preference to localStorage
    localStorage.setItem('sidebar_collapsed', this.isCollapsed.toString());
  }

  closeMobileSidebar(): void {
    // This will be handled by parent component
  }

  quickAddDish(): void {
    console.log('Quick add dish');
    // Navigate to add dish page or open modal
  }

  quickAddCategory(): void {
    console.log('Quick add category');
    // Navigate to add category page or open modal
  }

  quickStockUpdate(): void {
    console.log('Quick stock update');
    // Navigate to stock page or open modal
  }
}

