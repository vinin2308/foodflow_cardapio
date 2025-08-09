export interface DishIngredient {
  id?: string;
  name: string;
  quantity: number;
  unit: string;
}

export interface Dish {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  preparationTime: number; // in minutes
  image: string;
  status: 'available' | 'unavailable';
  ingredients: DishIngredient[];
  createdAt: Date;
  updatedAt: Date;
}

