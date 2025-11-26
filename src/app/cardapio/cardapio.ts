import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// Services
import { CarrinhoService } from '../services/carrinho.service';
import { ApiService } from '../services/api.service';
import { ComandaService } from '../services/comanda.service';

// Models
import { ItemCardapio } from '../models/item-cardapio.model';

// Componentes
import { CarrinhoComponent } from '../carrinho/carrinho'; 

@Component({
  selector: 'app-cardapio',
  standalone: true,
  imports: [CommonModule, FormsModule, CarrinhoComponent], 
  templateUrl: './cardapio.html',
  styleUrls: ['./cardapio.scss']
})
export class CardapioComponent implements OnInit {
  categorias: string[] = [];
  pratos: ItemCardapio[] = [];
  pratosFiltrados: ItemCardapio[] = [];
  categoriaSelecionada: string = 'Todos';
  
  carrinhoAberto = false;
  nomeCliente: string = '';
  mesa: string = '';

  // [NOVO] Variável para mostrar na bolinha vermelha
  totalItens: number = 0;

  constructor(
    private carrinhoService: CarrinhoService,
    private apiService: ApiService,
    private comandaService: ComandaService,
    private router: Router
  ) {}

  ngOnInit() {
    this.nomeCliente = localStorage.getItem('nome') || 'Cliente';
    this.mesa = localStorage.getItem('mesa-atual') || '';

    if (!this.mesa) {
      alert('Mesa não identificada. Voltando para o início.');
      this.router.navigate(['/']);
      return;
    }

    this.carrinhoService.carrinhoAberto$.subscribe((aberto: boolean) => {
      this.carrinhoAberto = aberto;
    });

    // [NOVO] Escuta alterações no carrinho para atualizar o contador
    this.comandaService.comanda$.subscribe((comanda: any) => {
      if (comanda && comanda.itens) {
        this.totalItens = comanda.itens.reduce((acc: number, item: any) => acc + item.quantidade, 0);
      } else {
        this.totalItens = 0;
      }
    });

    this.carregarDados();
  }

  carregarDados() {
    this.carrinhoService.pratosCardapio$.subscribe((pratos: ItemCardapio[]) => {
      this.pratos = pratos;
      this.filtrarPorCategoria('Todos');
      this.extrairCategorias();
    });
  }

  extrairCategorias() {
    const cats = new Set(this.pratos.map(p => String(p.categoria)));
    this.categorias = ['Todos', ...Array.from(cats)];
  }

  filtrarPorCategoria(categoria: string) {
    this.categoriaSelecionada = categoria;
    if (categoria === 'Todos') {
      this.pratosFiltrados = this.pratos;
    } else {
      this.pratosFiltrados = this.pratos.filter(p => String(p.categoria) === categoria);
    }
  }

  adicionarItem(prato: ItemCardapio) {
    // Apenas adiciona (o Service já foi configurado para NÃO abrir o carrinho sozinho)
    this.carrinhoService.adicionarItem(prato);
  }

  toggleCarrinho() {
    this.carrinhoService.toggleCarrinho();
  }
}