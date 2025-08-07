import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { HttpClientModule } from '@angular/common/http';

import { CarrinhoService } from '../services/carrinho';
import { CarrinhoComponent } from '../carrinho/carrinho';
import { ObservacaoModalComponent } from '../cozinha/observacao-modal/observacao-modal';

import { ItemCardapio, CategoriaCardapio } from '../models/item-cardapio.model';
import { PratoService } from '../services/prato';
import { CategoriaService } from '../services/categoria';
import { Comanda } from '../models/carrinho.model';

@Component({
  selector: 'app-cardapio',
  standalone: true,
  imports: [CommonModule, CarrinhoComponent, ObservacaoModalComponent, HttpClientModule],
  templateUrl: './cardapio.html',
  styleUrls: ['./cardapio.scss']
})
export class CardapioComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  mesa = '';
  nomeCliente = '';
  comanda: Comanda | null = null;
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
          const conectou = this.carrinhoService.conectarComanda(mesaNum);
          if (!conectou) {
            this.carrinhoService.iniciarComanda(mesaNum);
          }
        }

        this.carregarCategorias();
        this.carregarPratos();
      });

    this.carrinhoService.comanda$
      .pipe(takeUntil(this.destroy$))
      .subscribe(comanda => {
        this.comanda = comanda;

        if (comanda && comanda.itens) {
          this.quantidadeTotalItens = comanda.itens.reduce((acc, item) => acc + item.quantidade, 0);
        } else {
          this.quantidadeTotalItens = 0;
        }
      });

    this.carrinhoService.carrinhoAberto$
      .pipe(takeUntil(this.destroy$))
      .subscribe(aberto => {
        this.carrinhoAberto = aberto;
      });
  }

  carregarPratos(): void {
    this.pratoService.listarPratos()
      .pipe(takeUntil(this.destroy$))
      .subscribe(pratos => {
        this.cardapio = pratos;

        // Extrair categorias únicas com base no ID
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
        this.categorias = categorias.map(cat => ({
          ...cat,
          id: cat.id.toString()
        }));
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
    this.carrinhoService.adicionarItem(item.id, 1);
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
      this.carrinhoService.adicionarItem(this.itemSelecionadoParaObservacao.id, 1, observacao);
      this.fecharModalObservacao();
    }
  }

  toggleCarrinho(): void {
    this.carrinhoService.toggleCarrinho();
  }

  formatarPreco(preco: number): string {
    return preco.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
