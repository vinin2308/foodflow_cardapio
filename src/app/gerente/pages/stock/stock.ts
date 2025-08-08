import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../components/layout/header/header';
import { SidebarComponent } from '../../components/layout/sidebar/sidebar';
import { StockItem, StockAlert } from '../../models/stock.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HeaderComponent, SidebarComponent],
  templateUrl: './stock.html',
  styleUrls: ['./stock.scss']
})
export class StockComponent implements OnInit, OnDestroy {
  // Layout state
  sidebarCollapsed = false;
  showMobileSidebar = false;
  
  // Data
  stockItems: StockItem[] = [];
  filteredItems: StockItem[] = [];
  alerts: StockAlert[] = [];
  
  // Filters
  searchTerm = '';
  selectedStatus = '';
  selectedCategory = '';
  
  // View mode
  viewMode: 'grid' | 'list' = 'grid';
  
  // Modal state
  showItemModal = false;
  showRestockModal = false;
  editingItem: StockItem | null = null;
  restockingItem: StockItem | null = null;
  
  // Form data
  itemFormData: any = {
    name: '',
    description: '',
    category: '',
    currentQuantity: 0,
    minimumQuantity: 0,
    maximumQuantity: null,
    unit: '',
    purchaseDate: '',
    expiryDate: ''
  };
  
  restockQuantity = 0;
  restockDate = '';
  
  private subscription = new Subscription();

  constructor() {}

  ngOnInit(): void {
    // Load sidebar state
    const savedCollapsed = localStorage.getItem('sidebar_collapsed');
    if (savedCollapsed) {
      this.sidebarCollapsed = savedCollapsed === 'true';
    }

    // Load view mode
    const savedViewMode = localStorage.getItem('stock_view_mode');
    if (savedViewMode) {
      this.viewMode = savedViewMode as 'grid' | 'list';
    }

    this.loadMockData();
    this.filterItems();
    this.generateAlerts();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadMockData(): void {
    // Mock stock items
    this.stockItems = [
      {
        id: '1',
        name: 'Carne Bovina',
        description: 'Carne bovina de primeira qualidade',
        category: 'carnes',
        currentQuantity: 5.5,
        minimumQuantity: 2.0,
        maximumQuantity: 20.0,
        unit: 'kg',
        purchaseDate: new Date('2024-01-20'),
        expiryDate: new Date('2024-01-27'),
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-22')
      },
      {
        id: '2',
        name: 'Queijo Mussarela',
        description: 'Queijo mussarela fatiado',
        category: 'laticinios',
        currentQuantity: 1.2,
        minimumQuantity: 2.0,
        maximumQuantity: 10.0,
        unit: 'kg',
        purchaseDate: new Date('2024-01-18'),
        expiryDate: new Date('2024-01-25'),
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-20')
      },
      {
        id: '3',
        name: 'Tomate',
        description: 'Tomate fresco para saladas',
        category: 'vegetais',
        currentQuantity: 8.0,
        minimumQuantity: 3.0,
        maximumQuantity: 15.0,
        unit: 'kg',
        purchaseDate: new Date('2024-01-21'),
        expiryDate: new Date('2024-01-28'),
        createdAt: new Date('2024-01-12'),
        updatedAt: new Date('2024-01-21')
      },
      {
        id: '4',
        name: 'Alface Americana',
        description: 'Alface americana crocante',
        category: 'vegetais',
        currentQuantity: 12,
        minimumQuantity: 5,
        maximumQuantity: 30,
        unit: 'unidade',
        purchaseDate: new Date('2024-01-22'),
        expiryDate: new Date('2024-01-26'),
        createdAt: new Date('2024-01-14'),
        updatedAt: new Date('2024-01-22')
      },
      {
        id: '5',
        name: 'Azeite Extra Virgem',
        description: 'Azeite de oliva extra virgem',
        category: 'temperos',
        currentQuantity: 2.5,
        minimumQuantity: 1.0,
        maximumQuantity: 5.0,
        unit: 'l',
        purchaseDate: new Date('2024-01-10'),
        expiryDate: new Date('2024-12-31'),
        createdAt: new Date('2024-01-08'),
        updatedAt: new Date('2024-01-15')
      },
      {
        id: '6',
        name: 'Refrigerante Cola',
        description: 'Refrigerante de cola 2L',
        category: 'bebidas',
        currentQuantity: 0,
        minimumQuantity: 6,
        maximumQuantity: 24,
        unit: 'unidade',
        purchaseDate: new Date('2024-01-15'),
        expiryDate: new Date('2024-06-15'),
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-01-18')
      },
      {
        id: '7',
        name: 'Manjericão',
        description: 'Manjericão fresco',
        category: 'temperos',
        currentQuantity: 0.3,
        minimumQuantity: 0.2,
        maximumQuantity: 1.0,
        unit: 'kg',
        purchaseDate: new Date('2024-01-19'),
        expiryDate: new Date('2024-01-24'),
        createdAt: new Date('2024-01-16'),
        updatedAt: new Date('2024-01-19')
      },
      {
        id: '8',
        name: 'Leite Integral',
        description: 'Leite integral 1L',
        category: 'laticinios',
        currentQuantity: 8,
        minimumQuantity: 4,
        maximumQuantity: 20,
        unit: 'unidade',
        purchaseDate: new Date('2024-01-20'),
        expiryDate: new Date('2024-01-23'),
        createdAt: new Date('2024-01-11'),
        updatedAt: new Date('2024-01-20')
      }
    ];
  }

  generateAlerts(): void {
    this.alerts = [];
    
    this.stockItems.forEach(item => {
      // Check for out of stock
      if (item.currentQuantity === 0) {
        this.alerts.push({
          id: `out_of_stock_${item.id}`,
          type: 'out_of_stock',
          title: 'Item sem estoque',
          message: 'Este item está completamente sem estoque.',
          itemId: item.id,
          itemName: item.name,
          currentQuantity: item.currentQuantity,
          unit: item.unit,
          createdAt: new Date()
        });
      }
      // Check for low stock
      else if (item.currentQuantity <= item.minimumQuantity) {
        this.alerts.push({
          id: `low_stock_${item.id}`,
          type: 'low_stock',
          title: 'Estoque baixo',
          message: 'Este item está abaixo da quantidade mínima.',
          itemId: item.id,
          itemName: item.name,
          currentQuantity: item.currentQuantity,
          unit: item.unit,
          createdAt: new Date()
        });
      }
      
      // Check for expiry
      if (item.expiryDate) {
        const today = new Date();
        const expiryDate = new Date(item.expiryDate);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry < 0) {
          this.alerts.push({
            id: `expired_${item.id}`,
            type: 'expired',
            title: 'Item vencido',
            message: `Este item venceu há ${Math.abs(daysUntilExpiry)} dia(s).`,
            itemId: item.id,
            itemName: item.name,
            currentQuantity: item.currentQuantity,
            unit: item.unit,
            createdAt: new Date()
          });
        } else if (daysUntilExpiry <= 3) {
          this.alerts.push({
            id: `near_expiry_${item.id}`,
            type: 'near_expiry',
            title: 'Próximo ao vencimento',
            message: `Este item vence em ${daysUntilExpiry} dia(s).`,
            itemId: item.id,
            itemName: item.name,
            currentQuantity: item.currentQuantity,
            unit: item.unit,
            createdAt: new Date()
          });
        }
      }
    });
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    localStorage.setItem('sidebar_collapsed', this.sidebarCollapsed.toString());
  }

  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
    localStorage.setItem('stock_view_mode', mode);
  }

  filterItems(): void {
    this.filteredItems = this.stockItems.filter(item => {
      const matchesSearch = !this.searchTerm || 
        item.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(this.searchTerm.toLowerCase()));
      
      const matchesCategory = !this.selectedCategory || item.category === this.selectedCategory;
      
      const matchesStatus = !this.selectedStatus || this.getItemStatus(item) === this.selectedStatus;
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.selectedCategory = '';
    this.filterItems();
  }

  getItemStatus(item: StockItem): string {
    if (item.currentQuantity === 0) return 'out_of_stock';
    if (item.currentQuantity <= item.minimumQuantity) return 'low_stock';
    
    if (item.expiryDate) {
      const today = new Date();
      const expiryDate = new Date(item.expiryDate);
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry < 0) return 'expired';
      if (daysUntilExpiry <= 3) return 'near_expiry';
    }
    
    return 'in_stock';
  }

  getItemStatusClass(item: StockItem): string {
    return this.getItemStatus(item).replace('_', '-');
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'in_stock': return 'check_circle';
      case 'low_stock': return 'warning';
      case 'out_of_stock': return 'error';
      case 'expired': return 'dangerous';
      case 'near_expiry': return 'schedule';
      default: return 'help';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'in_stock': return 'Em estoque';
      case 'low_stock': return 'Estoque baixo';
      case 'out_of_stock': return 'Sem estoque';
      case 'expired': return 'Vencido';
      case 'near_expiry': return 'Próximo ao vencimento';
      default: return 'Desconhecido';
    }
  }

  getQuantityPercentage(item: StockItem): number {
    if (!item.maximumQuantity) {
      // If no max quantity, use minimum as reference
      return Math.min((item.currentQuantity / (item.minimumQuantity * 3)) * 100, 100);
    }
    return (item.currentQuantity / item.maximumQuantity) * 100;
  }

  getQuantityBarClass(item: StockItem): string {
    const percentage = this.getQuantityPercentage(item);
    if (percentage === 0) return 'empty';
    if (percentage <= 25) return 'low';
    if (percentage <= 50) return 'medium';
    return 'high';
  }

  getCategoryName(category: string): string {
    const categories: { [key: string]: string } = {
      'carnes': 'Carnes',
      'vegetais': 'Vegetais',
      'laticinios': 'Laticínios',
      'temperos': 'Temperos',
      'bebidas': 'Bebidas',
      'outros': 'Outros'
    };
    return categories[category] || category;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('pt-BR');
  }

  formatRelativeDate(date: Date): string {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'hoje';
    if (diffDays === 2) return 'ontem';
    if (diffDays <= 7) return `há ${diffDays} dias`;
    if (diffDays <= 30) return `há ${Math.ceil(diffDays / 7)} semanas`;
    return `há ${Math.ceil(diffDays / 30)} meses`;
  }

  getExpiryClass(expiryDate: Date): string {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 3) return 'near-expiry';
    if (daysUntilExpiry <= 7) return 'warning';
    return 'normal';
  }

  // Stats methods
  getInStockCount(): number {
    return this.stockItems.filter(item => this.getItemStatus(item) === 'in_stock').length;
  }

  getLowStockCount(): number {
    return this.stockItems.filter(item => 
      this.getItemStatus(item) === 'low_stock' || this.getItemStatus(item) === 'out_of_stock'
    ).length;
  }

  getExpiredCount(): number {
    return this.stockItems.filter(item => 
      this.getItemStatus(item) === 'expired' || this.getItemStatus(item) === 'near_expiry'
    ).length;
  }

  // Alert methods
  getAlerts(): StockAlert[] {
    return this.alerts.slice(0, 6); // Show only first 6 alerts
  }

  getAlertIcon(type: string): string {
    switch (type) {
      case 'low_stock': return 'warning';
      case 'out_of_stock': return 'error';
      case 'expired': return 'dangerous';
      case 'near_expiry': return 'schedule';
      default: return 'info';
    }
  }

  getAlertActionText(type: string): string {
    switch (type) {
      case 'low_stock':
      case 'out_of_stock': return 'Repor';
      case 'expired': return 'Remover';
      case 'near_expiry': return 'Verificar';
      default: return 'Ver';
    }
  }

  handleAlert(alert: StockAlert): void {
    const item = this.stockItems.find(i => i.id === alert.itemId);
    if (!item) return;

    switch (alert.type) {
      case 'low_stock':
      case 'out_of_stock':
        this.restockItem(item);
        break;
      case 'expired':
        if (confirm(`Deseja remover "${item.name}" do estoque? Este item está vencido.`)) {
          this.deleteItem(item);
        }
        break;
      case 'near_expiry':
        this.editItem(item);
        break;
    }
  }

  dismissAlert(alert: StockAlert): void {
    const index = this.alerts.findIndex(a => a.id === alert.id);
    if (index !== -1) {
      this.alerts.splice(index, 1);
    }
  }

  dismissAllAlerts(): void {
    this.alerts = [];
  }

  // Modal methods
  openAddItemModal(): void {
    this.editingItem = null;
    this.itemFormData = {
      name: '',
      description: '',
      category: '',
      currentQuantity: 0,
      minimumQuantity: 0,
      maximumQuantity: null,
      unit: '',
      purchaseDate: '',
      expiryDate: ''
    };
    this.showItemModal = true;
  }

  editItem(item: StockItem): void {
    this.editingItem = item;
    this.itemFormData = {
      name: item.name,
      description: item.description || '',
      category: item.category,
      currentQuantity: item.currentQuantity,
      minimumQuantity: item.minimumQuantity,
      maximumQuantity: item.maximumQuantity,
      unit: item.unit,
      purchaseDate: item.purchaseDate ? this.formatDateForInput(item.purchaseDate) : '',
      expiryDate: item.expiryDate ? this.formatDateForInput(item.expiryDate) : ''
    };
    this.showItemModal = true;
  }

  closeItemModal(): void {
    this.showItemModal = false;
    this.editingItem = null;
  }

  saveItem(): void {
    const itemData: StockItem = {
      id: this.editingItem ? this.editingItem.id : Date.now().toString(),
      name: this.itemFormData.name,
      description: this.itemFormData.description || undefined,
      category: this.itemFormData.category,
      currentQuantity: this.itemFormData.currentQuantity,
      minimumQuantity: this.itemFormData.minimumQuantity,
      maximumQuantity: this.itemFormData.maximumQuantity || undefined,
      unit: this.itemFormData.unit,
      purchaseDate: this.itemFormData.purchaseDate ? new Date(this.itemFormData.purchaseDate) : undefined,
      expiryDate: this.itemFormData.expiryDate ? new Date(this.itemFormData.expiryDate) : undefined,
      createdAt: this.editingItem ? this.editingItem.createdAt : new Date(),
      updatedAt: new Date()
    };

    if (this.editingItem) {
      // Update existing item
      const index = this.stockItems.findIndex(i => i.id === this.editingItem!.id);
      if (index !== -1) {
        this.stockItems[index] = itemData;
      }
    } else {
      // Add new item
      this.stockItems.push(itemData);
    }

    this.filterItems();
    this.generateAlerts();
    this.closeItemModal();
  }

  restockItem(item: StockItem): void {
    this.restockingItem = item;
    this.restockQuantity = 0;
    this.restockDate = this.formatDateForInput(new Date());
    this.showRestockModal = true;
  }

  closeRestockModal(): void {
    this.showRestockModal = false;
    this.restockingItem = null;
    this.restockQuantity = 0;
    this.restockDate = '';
  }

  confirmRestock(): void {
    if (!this.restockingItem || this.restockQuantity <= 0) return;

    const index = this.stockItems.findIndex(i => i.id === this.restockingItem!.id);
    if (index !== -1) {
      this.stockItems[index].currentQuantity += this.restockQuantity;
      this.stockItems[index].updatedAt = new Date();
      
      if (this.restockDate) {
        this.stockItems[index].purchaseDate = new Date(this.restockDate);
      }
    }

    this.filterItems();
    this.generateAlerts();
    this.closeRestockModal();
  }

  deleteItem(item: StockItem): void {
    if (confirm(`Tem certeza que deseja excluir "${item.name}" do estoque?`)) {
      const index = this.stockItems.findIndex(i => i.id === item.id);
      if (index !== -1) {
        this.stockItems.splice(index, 1);
        this.filterItems();
        this.generateAlerts();
      }
    }
  }

  formatDateForInput(date: Date): string {
    return new Date(date).toISOString().split('T')[0];
  }

  exportStock(): void {
    console.log('Exporting stock...');
    // Implement export functionality
  }
}

