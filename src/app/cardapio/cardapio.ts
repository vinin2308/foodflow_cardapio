import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { HttpClientModule } from '@angular/common/http';

import { CarrinhoService } from '../services/carrinho.service';
import { CarrinhoComponent } from '../carrinho/carrinho';
import { ObservacaoModalComponent } from '../cozinha/observacao-modal/observacao-modal';

import { ItemCardapio, CategoriaCardapio } from '../models/item-cardapio.model';
import { PratoService } from '../services/prato.service';
import { CategoriaService } from '../services/categoria.service';
import { Comanda } from '../models/carrinho.model';

@Component({
  selector: 'app-cardapio',
  standalone: true,
  imports: [CommonModule, HttpClientModule, CarrinhoComponent, ObservacaoModalComponent],
  templateUrl: './cardapio.html',
  styleUrls: ['./cardapio.scss']
})
export class CardapioComponent implements OnInit, OnDestroy {
  comanda: Comanda | null = null;
  private destroy$ = new Subject<void>();
  mesa = '';
  nomeCliente = '';
  
  codigoAcesso: string | null = null;
  carrinhoAberto = false;

  cardapio: ItemCardapio[] = [];
  categorias: CategoriaCardapio[] = [];
  categoriaAtiva: CategoriaCardapio | null = null;

  mostrarModalObservacao = false;
  itemSelecionadoParaObservacao: ItemCardapio | null = null;

  quantidadeTotalItens = 0;

  constructor(
    private route: ActivatedRoute,
    private carrinhoService: CarrinhoService,
    private pratoService: PratoService,
    private categoriaService: CategoriaService,
  ) {}

  ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.mesa = params['mesa'] || '';
        this.nomeCliente = params['nome'] || '';

      if (this.mesa) {
        const mesaNum = Number(this.mesa);
          if (!isNaN(mesaNum)) {
            this.carrinhoService.inicializarComanda(mesaNum, this.nomeCliente);
  }
}

        this.carregarCategorias();
        this.carregarPratos();
      });

    // Subscribes para comanda principal
    this.carrinhoService.comanda$
      .pipe(takeUntil(this.destroy$))
      .subscribe(comanda => {
        this.comanda = comanda;
        this.codigoAcesso = comanda?.codigo_acesso || null;

        this.quantidadeTotalItens = comanda?.itens.reduce((acc, item) => acc + item.quantidade, 0) || 0;
      });

    // Subscribes para abertura do carrinho
    this.carrinhoService.carrinhoAberto$
      .pipe(takeUntil(this.destroy$))
      .subscribe(aberto => this.carrinhoAberto = aberto);

    // Garante que sempre tenha código de acesso para a comanda
    const comandaExistente = this.carrinhoService.comandaAtualValue;
    if (comandaExistente && !comandaExistente.codigo_acesso) {
      this.carrinhoService.gerarCodigoAcesso().subscribe(codigo => {
        this.codigoAcesso = codigo;
        localStorage.setItem('codigo-acesso', codigo);
      });
    }
  }

  carregarPratos(): void {
    this.pratoService.listarPratos()
      .pipe(takeUntil(this.destroy$))
      .subscribe(pratos => {
        this.cardapio = pratos;

        const categoriasMap = new Map<string, CategoriaCardapio>();
        for (const prato of pratos) {
          if (prato.categoria && !categoriasMap.has(prato.categoria.id)) {
            categoriasMap.set(prato.categoria.id, prato.categoria);
          }
        }

        this.categorias = Array.from(categoriasMap.values());
        this.categoriaAtiva = this.categorias[0] || null;
      });
  }

  carregarCategorias(): void {
    this.categoriaService.listarCategorias()
      .pipe(takeUntil(this.destroy$))
      .subscribe(categorias => {
        this.categorias = categorias.map(cat => ({ ...cat, id: cat.id.toString() }));
        this.categoriaAtiva = this.categorias.length > 0 ? this.categorias[0] : null;
      });
  }

  getItensPorCategoria(categoria: CategoriaCardapio): ItemCardapio[] {
    return this.cardapio.filter(item => item.categoria.id === categoria.id);
  }

  selecionarCategoria(categoria: CategoriaCardapio): void {
    this.categoriaAtiva = categoria;
  }

  adicionarItem(item: ItemCardapio): void {
    this.carrinhoService.adicionarItem(item, 1);
  }

  abrirModalObservacao(item: ItemCardapio): void {
    this.itemSelecionadoParaObservacao = item;
    this.mostrarModalObservacao = true;
  }

  fecharModalObservacao(): void {
    this.mostrarModalObservacao = false;
    this.itemSelecionadoParaObservacao = null;
  }

  adicionarItemComObservacao(observacao: string): void {
    if (this.itemSelecionadoParaObservacao) {
      this.carrinhoService.adicionarItem(this.itemSelecionadoParaObservacao, 1, observacao);
      this.fecharModalObservacao();
    }
  }

  toggleCarrinho(): void {
    this.carrinhoService.toggleCarrinho();
  }

  formatarPreco(preco: number): string {
    return preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
