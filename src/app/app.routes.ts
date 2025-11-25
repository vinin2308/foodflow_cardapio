import { Routes } from '@angular/router';
import { HomeComponent } from './home/home';
import { CardapioComponent } from './cardapio/cardapio';
import { CozinhaComponent } from './cozinha/cozinha';

import { gerenteRoutes } from './gerente/gerente.routes';
export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'cardapio', component: CardapioComponent },
  { path: 'cozinha', component: CozinhaComponent },
  // Rota pai para todas as rotas do gerente
  { path: 'gerente', children: gerenteRoutes },
  // Redirecionamento para a raiz
  { path: '**', redirectTo: '' }
];