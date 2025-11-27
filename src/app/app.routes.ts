import { Routes } from '@angular/router';
import { HomeComponent } from './home/home';
import { CardapioComponent } from './cardapio/cardapio';
import { CozinhaComponent } from './cozinha/cozinha';
import { GarcomComponent } from './garcom/garcom';

// 1. IMPORTE O COMPONENTE DE ACOMPANHAR
// (Verifique se o caminho da pasta está certo, crie o componente se não existir)
import { AcompanharPedidoComponent } from './acompanhar-pedido/acompanhar-pedido';

import { gerenteRoutes } from './gerente/gerente.routes';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'cardapio', component: CardapioComponent },
  { path: 'cozinha', component: CozinhaComponent },
  { path: 'garcom', component: GarcomComponent },

  // 2. ADICIONE A ROTA AQUI (Fora do children do gerente)
  { path: 'acompanhar', component: AcompanharPedidoComponent },

  // Rota pai para todas as rotas do gerente
  { path: 'gerente', children: gerenteRoutes },

  // Redirecionamento para a raiz (Isso é o que te jogava para a Home antes)
  { path: '**', redirectTo: '' }
];