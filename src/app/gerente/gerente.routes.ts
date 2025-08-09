// gerente.routes.ts

import { Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login/login';
import { RegisterComponent } from './components/auth/register/register';
import { ForgotPasswordComponent } from './components/auth/forgot-password/forgot-password';
import { HomeComponent } from './pages/home/home';
import { DishesComponent } from './pages/dishes/dishes';
import { CategoriesComponent } from './pages/categories/categories';
import { MenuComponent } from './pages/menu/menu';
import { StockComponent } from './pages/stock/stock';
import { ReportsComponent } from './pages/reports/reports';

export const gerenteRoutes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'home', component: HomeComponent },
  { path: 'dishes', component: DishesComponent },
  { path: 'categories', component: CategoriesComponent },
  { path: 'menu', component: MenuComponent },
  { path: 'stock', component: StockComponent },
  { path: 'reports', component: ReportsComponent },
];