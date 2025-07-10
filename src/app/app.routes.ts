import { Routes } from '@angular/router';
import { HomeComponent } from './home/home';
import { CardapioComponent } from './cardapio/cardapio';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'cardapio', component: CardapioComponent },
  { path: '**', redirectTo: '' }
];

