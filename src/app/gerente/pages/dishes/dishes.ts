import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../components/layout/header/header';
import { SidebarComponent } from '../../components/layout/sidebar/sidebar';
import { Dish, DishIngredient } from '../../models/dish.model';
import { Category } from '../../models/category.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dishes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HeaderComponent, SidebarComponent],
  templateUrl: './dishes.html',
  styleUrls: ['./dishes.scss']
})
export class DishesComponent implements OnInit, OnDestroy {
  // Layout state
  sidebarCollapsed = false;
  showMobileSidebar = false;
  
  // Data
  dishes: Dish[] = [];
  categories: Category[] = [];
  filteredDishes: Dish[] = [];
  
  // Filters
  searchTerm = '';
  selectedCategory = '';
  selectedStatus = '';
  
  // View mode
  viewMode: 'grid' | 'list' = 'grid';
  
  // Modal state
  showDishModal = false;
  editingDish: Dish | null = null;
  
  // Form data
  dishFormData: any = {
    name: '',
    description: '',
    price: 0,
    categoryId: '',
    preparationTime: 15,
    image: '',
    ingredients: [],
    available: true
  };
  
  private subscription = new Subscription();

  constructor() {}

  ngOnInit(): void {
    // Load sidebar state
    const savedCollapsed = localStorage.getItem('sidebar_collapsed');
    if (savedCollapsed) {
      this.sidebarCollapsed = savedCollapsed === 'true';
    }

    // Load view mode
    const savedViewMode = localStorage.getItem('dishes_view_mode');
    if (savedViewMode) {
      this.viewMode = savedViewMode as 'grid' | 'list';
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
      { id: '1', name: 'Entradas', description: 'Pratos para começar', icon: 'restaurant', color: '#4CAF50', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: '2', name: 'Pratos Principais', description: 'Pratos principais', icon: 'dinner_dining', color: '#722F37', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: '3', name: 'Bebidas', description: 'Bebidas diversas', icon: 'local_bar', color: '#2196F3', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: '4', name: 'Sobremesas', description: 'Doces e sobremesas', icon: 'cake', color: '#FF9800', isActive: true, createdAt: new Date(), updatedAt: new Date() }
    ];

    // Mock dishes
    this.dishes = [
      {
        id: '1',
        name: 'Hambúrguer Artesanal',
        description: 'Hambúrguer com carne bovina, queijo cheddar, alface, tomate e molho especial',
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
        description: 'Pizza tradicional com molho de tomate, mussarela e manjericão fresco',
        price: 35.00,
        categoryId: '2',
        preparationTime: 25,
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',
        status: 'available',
        ingredients: [
          { id: '6', name: 'Massa de pizza', quantity: 200, unit: 'g' },
          { id: '7', name: 'Molho de tomate', quantity: 80, unit: 'ml' },
          { id: '8', name: 'Mussarela', quantity: 100, unit: 'g' },
          { id: '9', name: 'Manjericão', quantity: 10, unit: 'g' }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '3',
        name: 'Salada Caesar',
        description: 'Alface romana, croutons, parmesão e molho caesar',
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
        name: 'Refrigerante Cola',
        description: 'Refrigerante de cola gelado 350ml',
        price: 6.00,
        categoryId: '3',
        preparationTime: 2,
        image: 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=400',
        status: 'available',
        ingredients: [
          { id: '14', name: 'Refrigerante cola', quantity: 350, unit: 'ml' }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '5',
        name: 'Tiramisu',
        description: 'Sobremesa italiana com café, mascarpone e cacau',
        price: 18.00,
        categoryId: '4',
        preparationTime: 5,
        image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400',
        status: 'unavailable',
        ingredients: [
          { id: '15', name: 'Biscoito champagne', quantity: 100, unit: 'g' },
          { id: '16', name: 'Mascarpone', quantity: 150, unit: 'g' },
          { id: '17', name: 'Café expresso', quantity: 100, unit: 'ml' },
          { id: '18', name: 'Cacau em pó', quantity: 10, unit: 'g' }
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

  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
    localStorage.setItem('dishes_view_mode', mode);
  }

  filterDishes(): void {
    this.filteredDishes = this.dishes.filter(dish => {
      const matchesSearch = !this.searchTerm || 
        dish.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        dish.description.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesCategory = !this.selectedCategory || dish.categoryId === this.selectedCategory;
      
      const matchesStatus = !this.selectedStatus || dish.status === this.selectedStatus;
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.selectedStatus = '';
    this.filterDishes();
  }

  getAvailableDishesCount(): number {
    return this.dishes.filter(dish => dish.status === 'available').length;
  }

  getMostPopularDish(): Dish | null {
    // Mock: return first available dish as most popular
    return this.dishes.find(dish => dish.status === 'available') || null;
  }

  getCategoryName(categoryId: string): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.name : 'Sem categoria';
  }

  openAddDishModal(): void {
    this.editingDish = null;
    this.dishFormData = {
      name: '',
      description: '',
      price: 0,
      categoryId: '',
      preparationTime: 15,
      image: '',
      ingredients: [{ name: '', quantity: 0, unit: '' }],
      available: true
    };
    this.showDishModal = true;
  }

  editDish(dish: Dish): void {
    this.editingDish = dish;
    this.dishFormData = {
      name: dish.name,
      description: dish.description,
      price: dish.price,
      categoryId: dish.categoryId,
      preparationTime: dish.preparationTime,
      image: dish.image,
      ingredients: [...dish.ingredients],
      available: dish.status === 'available'
    };
    this.showDishModal = true;
  }

  closeDishModal(): void {
    this.showDishModal = false;
    this.editingDish = null;
  }

  addIngredient(): void {
    this.dishFormData.ingredients.push({ name: '', quantity: 0, unit: '' });
  }

  removeIngredient(index: number): void {
    if (this.dishFormData.ingredients.length > 1) {
      this.dishFormData.ingredients.splice(index, 1);
    }
  }

  saveDish(): void {
    const dishData: Dish = {
      id: this.editingDish ? this.editingDish.id : Date.now().toString(),
      name: this.dishFormData.name,
      description: this.dishFormData.description,
      price: this.dishFormData.price,
      categoryId: this.dishFormData.categoryId,
      preparationTime: this.dishFormData.preparationTime,
      image: this.dishFormData.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
      status: this.dishFormData.available ? 'available' : 'unavailable',
      ingredients: this.dishFormData.ingredients.filter((ing: any) => ing.name && ing.quantity && ing.unit),
      createdAt: this.editingDish ? this.editingDish.createdAt : new Date(),
      updatedAt: new Date()
    };

    if (this.editingDish) {
      // Update existing dish
      const index = this.dishes.findIndex(d => d.id === this.editingDish!.id);
      if (index !== -1) {
        this.dishes[index] = dishData;
      }
    } else {
      // Add new dish
      this.dishes.push(dishData);
    }

    this.filterDishes();
    this.closeDishModal();
  }

  deleteDish(dish: Dish): void {
    if (confirm(`Tem certeza que deseja excluir o prato "${dish.name}"?`)) {
      const index = this.dishes.findIndex(d => d.id === dish.id);
      if (index !== -1) {
        this.dishes.splice(index, 1);
        this.filterDishes();
      }
    }
  }

  exportDishes(): void {
    console.log('Exporting dishes...');
    // Implement export functionality
  }
}

