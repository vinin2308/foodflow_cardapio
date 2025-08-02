import { Routes } from '@angular/router';
import { HomeComponent } from './home/home';
import { CardapioComponent } from './cardapio/cardapio';
import { CozinhaComponent } from './cozinha/cozinha';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'cardapio', component: CardapioComponent },
  {path: 'cozinha', component: CozinhaComponent},
  { path: '**', redirectTo: '' }
];

