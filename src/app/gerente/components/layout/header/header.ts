import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { User } from '../../../models/user.model';
import { Subscription } from 'rxjs';

interface Notification {
  id: string;
  type: 'warning' | 'info' | 'success' | 'error';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './header.html',
  styleUrls: ['./header.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Output() sidebarToggle = new EventEmitter<void>();
  
  currentUser: User | null = null;
  searchQuery = '';
  showNotifications = false;
  showUserMenu = false;
  notificationCount = 0;
  notifications: Notification[] = [];
  
  private subscription = new Subscription();

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to current user
    const userSub = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    this.subscription.add(userSub);

    // Load mock notifications
    this.loadNotifications();

    // Close dropdowns when clicking outside
    document.addEventListener('click', this.closeDropdowns.bind(this));
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    document.removeEventListener('click', this.closeDropdowns.bind(this));
  }

  loadNotifications(): void {
    // Mock notifications
    this.notifications = [
      {
        id: '1',
        type: 'warning',
        title: 'Estoque Baixo',
        message: 'Tomate está com estoque baixo (5 unidades restantes)',
        read: false,
        createdAt: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
      },
      {
        id: '2',
        type: 'info',
        title: 'Novo Pedido',
        message: 'Pedido #127 foi recebido - Mesa 8',
        read: false,
        createdAt: new Date(Date.now() - 45 * 60 * 1000) // 45 minutes ago
      },
      {
        id: '3',
        type: 'warning',
        title: 'Produto Vencendo',
        message: 'Frango vence em 2 dias',
        read: true,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        id: '4',
        type: 'success',
        title: 'Meta Atingida',
        message: 'Meta de vendas do dia foi atingida!',
        read: true,
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
      }
    ];

    this.notificationCount = this.notifications.filter(n => !n.read).length;
  }

  toggleSidebar(): void {
    this.sidebarToggle.emit();
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    this.showUserMenu = false;
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
    this.showNotifications = false;
  }

  closeDropdowns(event: Event): void {
    const target = event.target as HTMLElement;
    
    // Check if click is outside notification dropdown
    if (!target.closest('.notification-dropdown')) {
      this.showNotifications = false;
    }
    
    // Check if click is outside user dropdown
    if (!target.closest('.user-dropdown')) {
      this.showUserMenu = false;
    }
  }

  onSearch(): void {
    if (this.searchQuery.trim()) {
      console.log('Searching for:', this.searchQuery);
      // Implement search functionality
    }
  }

  markAllAsRead(): void {
    this.notifications.forEach(notification => {
      notification.read = true;
    });
    this.notificationCount = 0;
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'warning': return 'warning';
      case 'error': return 'error';
      case 'success': return 'check_circle';
      case 'info': 
      default: return 'info';
    }
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes < 60) return `${diffInMinutes}m atrás`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d atrás`;
  }

  getUserRoleLabel(role?: string): string {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'manager': return 'Gerente';
      default: return 'Usuário';
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

