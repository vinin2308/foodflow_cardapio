import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HeaderComponent } from '../../components/layout/header/header';
import { SidebarComponent } from '../../components/layout/sidebar/sidebar';
import { Dish } from '../../models/dish.model';
import { Category } from '../../models/category.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HeaderComponent, SidebarComponent],
  templateUrl: './menu.html',
  styleUrls: ['./menu.scss']
})
export class MenuComponent implements OnInit, OnDestroy {
  // Layout state
  sidebarCollapsed = false;
  showMobileSidebar = false;
  previewMode = false;
  
  // Data
  dishes: Dish[] = [];
  categories: Category[] = [];
  activeCategories: Category[] = [];
  filteredDishes: Dish[] = [];
  
  // Filters
  searchTerm = '';
  selectedCategory = '';
  priceRange = '';
  
  private subscription = new Subscription();

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Load sidebar state
    const savedCollapsed = localStorage.getItem('sidebar_collapsed');
    if (savedCollapsed) {
      this.sidebarCollapsed = savedCollapsed === 'true';
    }

    // Load preview mode state
    const savedPreviewMode = localStorage.getItem('menu_preview_mode');
    if (savedPreviewMode) {
      this.previewMode = savedPreviewMode === 'true';
    }

    this.loadMockData();
    this.filterDishes();
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
      }
    ];

    this.activeCategories = this.categories.filter(cat => cat.isActive);

    // Mock dishes
    this.dishes = [
      {
        id: '1',
        name: 'Hambúrguer Artesanal',
        description: 'Hambúrguer com carne bovina, queijo cheddar, alface, tomate e molho especial da casa',
        price: 28.90,
        categoryId: '2',
        preparationTime: 20,
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
        status: 'available',
        ingredients: [
          { id: '1', name: 'Carne bovina', quantity: 150, unit: 'g' },
          { id: '2', name: 'Queijo cheddar', quantity: 50, unit: 'g' },
          { id: '3', name: 'Pão brioche', quantity: 1, unit: 'unidade' },
          { id: '4', name: 'Alface', quantity: 30, unit: 'g' },
          { id: '5', name: 'Tomate', quantity: 50, unit: 'g' }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        name: 'Pizza Margherita',
        description: 'Pizza tradicional com molho de tomate artesanal, mussarela de búfala e manjericão fresco',
        price: 35.00,
        categoryId: '2',
        preparationTime: 25,
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',
        status: 'available',
        ingredients: [
          { id: '6', name: 'Massa de pizza', quantity: 200, unit: 'g' },
          { id: '7', name: 'Molho de tomate', quantity: 80, unit: 'ml' },
          { id: '8', name: 'Mussarela de búfala', quantity: 100, unit: 'g' },
          { id: '9', name: 'Manjericão', quantity: 10, unit: 'g' }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '3',
        name: 'Salada Caesar',
        description: 'Alface romana crocante, croutons dourados, parmesão ralado e molho caesar tradicional',
        price: 22.50,
        categoryId: '1',
        preparationTime: 10,
        image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400',
        status: 'available',
        ingredients: [
          { id: '10', name: 'Alface romana', quantity: 150, unit: 'g' },
          { id: '11', name: 'Croutons', quantity: 30, unit: 'g' },
          { id: '12', name: 'Parmesão', quantity: 40, unit: 'g' },
          { id: '13', name: 'Molho caesar', quantity: 50, unit: 'ml' }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '4',
        name: 'Bruschetta Italiana',
        description: 'Pão italiano tostado com tomate fresco, manjericão, alho e azeite extra virgem',
        price: 18.00,
        categoryId: '1',
        preparationTime: 8,
        image: 'https://images.unsplash.com/photo-1572441713132-51c75654db73?w=400',
        status: 'available',
        ingredients: [
          { id: '14', name: 'Pão italiano', quantity: 100, unit: 'g' },
          { id: '15', name: 'Tomate', quantity: 80, unit: 'g' },
          { id: '16', name: 'Manjericão', quantity: 10, unit: 'g' },
          { id: '17', name: 'Alho', quantity: 5, unit: 'g' }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '5',
        name: 'Refrigerante Cola',
        description: 'Refrigerante de cola gelado servido em copo de 350ml',
        price: 6.00,
        categoryId: '3',
        preparationTime: 2,
        image: 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=400',
        status: 'available',
        ingredients: [
          { id: '18', name: 'Refrigerante cola', quantity: 350, unit: 'ml' }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '6',
        name: 'Suco Natural de Laranja',
        description: 'Suco de laranja natural espremido na hora, sem açúcar adicionado',
        price: 8.50,
        categoryId: '3',
        preparationTime: 5,
        image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400',
        status: 'available',
        ingredients: [
          { id: '19', name: 'Laranja', quantity: 300, unit: 'ml' }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '7',
        name: 'Tiramisu',
        description: 'Sobremesa italiana tradicional com café, mascarpone, cacau e biscoito champagne',
        price: 18.00,
        categoryId: '4',
        preparationTime: 5,
        image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400',
        status: 'unavailable',
        ingredients: [
          { id: '20', name: 'Biscoito champagne', quantity: 100, unit: 'g' },
          { id: '21', name: 'Mascarpone', quantity: 150, unit: 'g' },
          { id: '22', name: 'Café expresso', quantity: 100, unit: 'ml' },
          { id: '23', name: 'Cacau em pó', quantity: 10, unit: 'g' }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '8',
        name: 'Cheesecake de Frutas Vermelhas',
        description: 'Cheesecake cremoso com calda de frutas vermelhas e base de biscoito',
        price: 16.50,
        categoryId: '4',
        preparationTime: 5,
        image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400',
        status: 'available',
        ingredients: [
          { id: '24', name: 'Cream cheese', quantity: 200, unit: 'g' },
          { id: '25', name: 'Frutas vermelhas', quantity: 80, unit: 'g' },
          { id: '26', name: 'Biscoito', quantity: 50, unit: 'g' }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    localStorage.setItem('sidebar_collapsed', this.sidebarCollapsed.toString());
  }

  togglePreviewMode(): void {
    this.previewMode = !this.previewMode;
    localStorage.setItem('menu_preview_mode', this.previewMode.toString());
  }

  filterDishes(): void {
    this.filteredDishes = this.dishes.filter(dish => {
      const matchesSearch = !this.searchTerm || 
        dish.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        dish.description.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesCategory = !this.selectedCategory || dish.categoryId === this.selectedCategory;
      
      const matchesPrice = !this.priceRange || this.checkPriceRange(dish.price, this.priceRange);
      
      return matchesSearch && matchesCategory && matchesPrice;
    });
  }

  checkPriceRange(price: number, range: string): boolean {
    switch (range) {
      case '0-20': return price <= 20;
      case '20-40': return price > 20 && price <= 40;
      case '40-60': return price > 40 && price <= 60;
      case '60+': return price > 60;
      default: return true;
    }
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.priceRange = '';
    this.filterDishes();
  }

  selectCategory(categoryId: string): void {
    this.selectedCategory = categoryId;
    this.filterDishes();
    
    // Scroll to category if not empty
    if (categoryId) {
      setTimeout(() => {
        const element = document.getElementById('category-' + categoryId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }

  getDisplayCategories(): Category[] {
    if (this.selectedCategory) {
      return this.activeCategories.filter(cat => cat.id === this.selectedCategory);
    }
    return this.activeCategories.filter(cat => this.getCategoryDishes(cat.id).length > 0);
  }

  getCategoryDishes(categoryId: string): Dish[] {
    return this.filteredDishes.filter(dish => dish.categoryId === categoryId);
  }

  getCategoryDishesCount(categoryId: string): number {
    return this.dishes.filter(dish => dish.categoryId === categoryId && dish.status === 'available').length;
  }

  getAvailableDishesCount(): number {
    return this.dishes.filter(dish => dish.status === 'available').length;
  }

  getAveragePrice(): string {
    const availableDishes = this.dishes.filter(dish => dish.status === 'available');
    if (availableDishes.length === 0) return '0,00';
    
    const total = availableDishes.reduce((sum, dish) => sum + dish.price, 0);
    const average = total / availableDishes.length;
    return average.toFixed(2).replace('.', ',');
  }

  getAveragePreparationTime(): number {
    const availableDishes = this.dishes.filter(dish => dish.status === 'available');
    if (availableDishes.length === 0) return 0;
    
    const total = availableDishes.reduce((sum, dish) => sum + dish.preparationTime, 0);
    return Math.round(total / availableDishes.length);
  }

  getCurrentDate(): string {
    return new Date().toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  editDish(dish: Dish): void {
    this.router.navigate(['/dishes'], { 
      queryParams: { edit: dish.id } 
    });
  }

  toggleDishAvailability(dish: Dish): void {
    const index = this.dishes.findIndex(d => d.id === dish.id);
    if (index !== -1) {
      this.dishes[index].status = this.dishes[index].status === 'available' ? 'unavailable' : 'available';
      this.dishes[index].updatedAt = new Date();
      this.filterDishes();
    }
  }

  goToAddDish(): void {
    this.router.navigate(['/dishes'], { 
      queryParams: { action: 'add' } 
    });
  }

  exportMenu(): void {
    console.log('Exporting menu to PDF...');
    // Implement PDF export functionality
  }

  printMenu(): void {
    window.print();
  }

  refreshData(): void {
    this.loadMockData();
    this.filterDishes();
  }
}

