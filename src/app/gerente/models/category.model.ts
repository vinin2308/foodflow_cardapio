export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCategoryRequest {
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface UpdateCategoryRequest extends CreateCategoryRequest {
  id: string;
  isActive: boolean;
}

