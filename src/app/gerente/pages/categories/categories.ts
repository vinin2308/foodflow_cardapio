import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../components/layout/header/header';
import { SidebarComponent } from '../../components/layout/sidebar/sidebar';
import { Category } from '../../models/category.model';
import { Dish } from '../../models/dish.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HeaderComponent, SidebarComponent],
  templateUrl: './categories.html',
  styleUrls: ['./categories.scss']
})
export class CategoriesComponent implements OnInit, OnDestroy {
  // Layout state
  sidebarCollapsed = false;
  showMobileSidebar = false;
  
  // Data
  categories: Category[] = [];
  dishes: Dish[] = [];
  filteredCategories: Category[] = [];
  
  // Filters
  searchTerm = '';
  selectedStatus = '';
  
  // Modal state
  showCategoryModal = false;
  editingCategory: Category | null = null;
  
  // Form data
  categoryFormData: any = {
    name: '',
    description: '',
    icon: '',
    color: '#722F37',
    isActive: true
  };
  
  // Color presets
  colorPresets = [
    '#722F37', // Wine
    '#8B0000', // Dark Red
    '#FFD700', // Gold
    '#4CAF50', // Green
    '#2196F3', // Blue
    '#FF9800', // Orange
    '#9C27B0', // Purple
    '#607D8B', // Blue Grey
    '#795548', // Brown
    '#E91E63'  // Pink
  ];
  
  private subscription = new Subscription();

  constructor() {}

  ngOnInit(): void {
    // Load sidebar state
    const savedCollapsed = localStorage.getItem('sidebar_collapsed');
    if (savedCollapsed) {
      this.sidebarCollapsed = savedCollapsed === 'true';
    }

    this.loadMockData();
    this.filterCategories();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadMockData(): void {
    // Mock categories
    this.categories = [
      { 
        id: '1', 
        name: 'Entradas', 
        description: 'Pratos para começar a refeição com sabor', 
        icon: 'restaurant', 
        color: '#4CAF50', 
        isActive: true, 
        createdAt: new Date('2024-01-15'), 
        updatedAt: new Date() 
      },
      { 
        id: '2', 
        name: 'Pratos Principais', 
        description: 'Os protagonistas do seu cardápio', 
        icon: 'dinner_dining', 
        color: '#722F37', 
        isActive: true, 
        createdAt: new Date('2024-01-10'), 
        updatedAt: new Date() 
      },
      { 
        id: '3', 
        name: 'Bebidas', 
        description: 'Refrescantes e saborosas para acompanhar', 
        icon: 'local_bar', 
        color: '#2196F3', 
        isActive: true, 
        createdAt: new Date('2024-01-20'), 
        updatedAt: new Date() 
      },
      { 
        id: '4', 
        name: 'Sobremesas', 
        description: 'Doces finais para completar a experiência', 
        icon: 'cake', 
        color: '#FF9800', 
        isActive: true, 
        createdAt: new Date('2024-01-25'), 
        updatedAt: new Date() 
      },
      { 
        id: '5', 
        name: 'Cafés Especiais', 
        description: 'Cafés premium e bebidas quentes', 
        icon: 'coffee', 
        color: '#795548', 
        isActive: false, 
        createdAt: new Date('2024-02-01'), 
        updatedAt: new Date() 
      }
    ];

    // Mock dishes for counting
    this.dishes = [
      { id: '1', name: 'Hambúrguer Artesanal', categoryId: '2', status: 'available' } as Dish,
      { id: '2', name: 'Pizza Margherita', categoryId: '2', status: 'available' } as Dish,
      { id: '3', name: 'Salada Caesar', categoryId: '1', status: 'available' } as Dish,
      { id: '4', name: 'Refrigerante Cola', categoryId: '3', status: 'available' } as Dish,
      { id: '5', name: 'Tiramisu', categoryId: '4', status: 'unavailable' } as Dish,
      { id: '6', name: 'Bruschetta', categoryId: '1', status: 'available' } as Dish,
      { id: '7', name: 'Suco Natural', categoryId: '3', status: 'available' } as Dish,
      { id: '8', name: 'Cheesecake', categoryId: '4', status: 'available' } as Dish,
      { id: '9', name: 'Espresso', categoryId: '5', status: 'available' } as Dish,
      { id: '10', name: 'Cappuccino', categoryId: '5', status: 'available' } as Dish
    ];
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    localStorage.setItem('sidebar_collapsed', this.sidebarCollapsed.toString());
  }

  filterCategories(): void {
    this.filteredCategories = this.categories.filter(category => {
      const matchesSearch = !this.searchTerm || 
        category.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        category.description.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesStatus = !this.selectedStatus || 
        (this.selectedStatus === 'active' && category.isActive) ||
        (this.selectedStatus === 'inactive' && !category.isActive);
      
      return matchesSearch && matchesStatus;
    });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.filterCategories();
  }

  getActiveCategoriesCount(): number {
    return this.categories.filter(category => category.isActive).length;
  }

  getTotalDishesCount(): number {
    return this.dishes.length;
  }

  getMostPopularCategory(): Category | null {
    if (this.categories.length === 0) return null;
    
    // Find category with most dishes
    let maxCount = 0;
    let popularCategory: Category | null = null;
    
    this.categories.forEach(category => {
      const count = this.getDishesCountByCategory(category.id);
      if (count > maxCount) {
        maxCount = count;
        popularCategory = category;
      }
    });
    
    return popularCategory;
  }

  getDishesCountByCategory(categoryId: string): number {
    return this.dishes.filter(dish => dish.categoryId === categoryId).length;
  }

  getCategoryUsagePercentage(categoryId: string): number {
    const totalDishes = this.dishes.length;
    if (totalDishes === 0) return 0;
    
    const categoryDishes = this.getDishesCountByCategory(categoryId);
    return Math.round((categoryDishes / totalDishes) * 100);
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'hoje';
    if (diffDays === 2) return 'ontem';
    if (diffDays <= 7) return `há ${diffDays} dias`;
    if (diffDays <= 30) return `há ${Math.ceil(diffDays / 7)} semanas`;
    return `há ${Math.ceil(diffDays / 30)} meses`;
  }

  openAddCategoryModal(): void {
    this.editingCategory = null;
    this.categoryFormData = {
      name: '',
      description: '',
      icon: '',
      color: '#722F37',
      isActive: true
    };
    this.showCategoryModal = true;
  }

  editCategory(category: Category): void {
    this.editingCategory = category;
    this.categoryFormData = {
      name: category.name,
      description: category.description,
      icon: category.icon,
      color: category.color,
      isActive: category.isActive
    };
    this.showCategoryModal = true;
  }

  closeCategoryModal(): void {
    this.showCategoryModal = false;
    this.editingCategory = null;
  }

  saveCategory(): void {
    const categoryData: Category = {
      id: this.editingCategory ? this.editingCategory.id : Date.now().toString(),
      name: this.categoryFormData.name,
      description: this.categoryFormData.description,
      icon: this.categoryFormData.icon,
      color: this.categoryFormData.color,
      isActive: this.categoryFormData.isActive,
      createdAt: this.editingCategory ? this.editingCategory.createdAt : new Date(),
      updatedAt: new Date()
    };

    if (this.editingCategory) {
      // Update existing category
      const index = this.categories.findIndex(c => c.id === this.editingCategory!.id);
      if (index !== -1) {
        this.categories[index] = categoryData;
      }
    } else {
      // Add new category
      this.categories.push(categoryData);
    }

    this.filterCategories();
    this.closeCategoryModal();
  }

  toggleCategoryStatus(category: Category): void {
    const index = this.categories.findIndex(c => c.id === category.id);
    if (index !== -1) {
      this.categories[index].isActive = !this.categories[index].isActive;
      this.categories[index].updatedAt = new Date();
      this.filterCategories();
    }
  }

  deleteCategory(category: Category): void {
    const dishesCount = this.getDishesCountByCategory(category.id);
    
    if (dishesCount > 0) {
      alert(`Não é possível excluir a categoria "${category.name}" pois ela possui ${dishesCount} prato(s) associado(s). Remova os pratos primeiro.`);
      return;
    }
    
    if (confirm(`Tem certeza que deseja excluir a categoria "${category.name}"?`)) {
      const index = this.categories.findIndex(c => c.id === category.id);
      if (index !== -1) {
        this.categories.splice(index, 1);
        this.filterCategories();
      }
    }
  }

  getContrastColor(hexColor: string): string {
    // Convert hex to RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  }

  exportCategories(): void {
    console.log('Exporting categories...');
    // Implement export functionality
  }
}

