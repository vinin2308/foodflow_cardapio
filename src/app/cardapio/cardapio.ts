import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CarrinhoService } from '../services/carrinho';
import { CarrinhoComponent } from '../carrinho/carrinho';
import { ObservacaoModalComponent } from '../cozinha/observacao-modal/observacao-modal';
import { ItemCardapio, Comanda } from '../models/item-cardapio.model';
import { CARDAPIO_MOCK, CATEGORIAS } from '../data/cardapio-mock';

@Component({
  selector: 'app-cardapio',
  standalone: true,
  imports: [CommonModule, CarrinhoComponent, ObservacaoModalComponent],
  templateUrl: './cardapio.html',
  styleUrls: ['./cardapio.scss']
})
export class CardapioComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  mesa: string = '';
  nomeCliente: string = '';
  comanda: Comanda | null = null;
  carrinhoAberto: boolean = false;
  
  cardapio = CARDAPIO_MOCK;
  categorias = CATEGORIAS;
  categoriaAtiva: string = 'entradas';
  
  // Modal de observação
  mostrarModalObservacao: boolean = false;
  itemSelecionadoParaObservacao: ItemCardapio | null = null;

  constructor(
    private route: ActivatedRoute,
    private carrinhoService: CarrinhoService
  ) {}

  ngOnInit() {
    // Obter parâmetros da rota
    this.route.queryParams.subscribe(params => {
      this.mesa = params['mesa'] || '';
      this.nomeCliente = params['nome'] || '';
    });

    // Inscrever-se nas mudanças da comanda
    this.carrinhoService.comanda$
      .pipe(takeUntil(this.destroy$))
      .subscribe(comanda => {
        this.comanda = comanda;
      });

    // Inscrever-se no estado do carrinho
    this.carrinhoService.carrinhoAberto$
      .pipe(takeUntil(this.destroy$))
      .subscribe(aberto => {
        this.carrinhoAberto = aberto;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Filtrar itens por categoria
  getItensPorCategoria(categoria: string): ItemCardapio[] {
    return this.cardapio.filter(item => item.categoria === categoria);
  }

  // Mudar categoria ativa
  selecionarCategoria(categoria: string) {
    this.categoriaAtiva = categoria;
  }

  // Adicionar item diretamente ao carrinho
  adicionarItem(item: ItemCardapio) {
    this.carrinhoService.adicionarItem(item);
  }

  // Abrir modal de observação
  abrirModalObservacao(item: ItemCardapio) {
    this.itemSelecionadoParaObservacao = item;
    this.mostrarModalObservacao = true;
  }

  // Fechar modal de observação
  fecharModalObservacao() {
    this.mostrarModalObservacao = false;
    this.itemSelecionadoParaObservacao = null;
  }

  // Adicionar item com observação
  adicionarItemComObservacao(observacao: string) {
    if (this.itemSelecionadoParaObservacao) {
      this.carrinhoService.adicionarItem(this.itemSelecionadoParaObservacao, observacao);
      this.fecharModalObservacao();
    }
  }

  // Toggle do carrinho
  toggleCarrinho() {
    this.carrinhoService.toggleCarrinho();
  }

  // Obter quantidade total de itens no carrinho
  get quantidadeTotalItens(): number {
    return this.carrinhoService.quantidadeTotalItens;
  }

  // Formatar preço
  formatarPreco(preco: number): string {
    return preco.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }
}

