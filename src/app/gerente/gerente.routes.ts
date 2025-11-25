import { Routes } from '@angular/router';
import { GerenteLoginComponent } from './login/login';
import { GerenteCadastroComponent } from './cadastro/cadastro';
import { GerenteEsqueceuSenhaComponent } from './esqueceu-senha/esqueceu-senha';
import { GerenteHomeComponent } from './home/home';
import { GerentePratosComponent } from './pratos/pratos';
import { GerenteCategoriasComponent } from './categorias/categorias';
import { GerentePerfilComponent } from './perfil/perfil';

export const gerenteRoutes: Routes = [
  { path: 'login', component: GerenteLoginComponent },
  { path: 'cadastro', component: GerenteCadastroComponent },
  { path: 'esqueceu-senha', component: GerenteEsqueceuSenhaComponent },
  { path: 'home', component: GerenteHomeComponent },
  { path: 'pratos', component: GerentePratosComponent },
  { path: 'categorias', component: GerenteCategoriasComponent },
  { path: 'perfil', component: GerentePerfilComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];
