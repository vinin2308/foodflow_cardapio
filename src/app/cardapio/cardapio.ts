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
import { Comanda } from '../models/comanda.model';
import { ComandaService } from '../services/comanda.service';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-cardapio',
  standalone: true,
  imports: [CommonModule, CarrinhoComponent, ObservacaoModalComponent, HttpClientModule],
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
    public carrinhoService: CarrinhoService,
    private pratoService: PratoService,
    private categoriaService: CategoriaService,
    private comandaService: ComandaService,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        let mesaUrl = params['mesa'];
        if (!mesaUrl) mesaUrl = localStorage.getItem('mesa_atual_cache');
        
        this.mesa = mesaUrl ? String(mesaUrl) : '';

        if (this.mesa) {
          localStorage.setItem('mesa_atual_cache', this.mesa);
          this.nomeCliente = params['nome'] || localStorage.getItem('nome') || '';
          
          const mesaNum = Number(this.mesa);

          if (!isNaN(mesaNum) && mesaNum > 0) {
            // Tenta recuperar do cache local
            const comandaLocal = this.comandaService.restaurarComandaLocal(mesaNum);

            // Verifica se a comanda local é válida e não está paga
            if (comandaLocal && (comandaLocal.id ?? 0) > 0 && comandaLocal.status !== 'pago') {
                console.log('🔄 Recuperando comanda existente:', comandaLocal.id);
                this.comandaService.setComanda(comandaLocal);
            } else {
                // Se não tem comanda válida, cria rascunho ZERO km.
                console.log('✨ Iniciando novo rascunho local (ID=0)...');
                this.comandaService.setComandaLocalVazia(mesaNum, this.nomeCliente);
                
                // Limpa carrinho antigo se necessário
                // this.carrinhoService.limparCarrinhoLocal(); 
            }

            this.carregarCategorias();
            this.carregarPratos();
          }
        } else {
            console.error('❌ Nenhuma mesa identificada! A URL deve ter ?mesa=X');
        }
      });

    // Atualiza a bolinha amarela ouvindo o ComandaService
    this.comandaService.comanda$
      .pipe(takeUntil(this.destroy$))
      .subscribe(comanda => {
        this.comanda = comanda;
        if (comanda && Array.isArray(comanda.itens)) {
             this.quantidadeTotalItens = comanda.itens.reduce((acc, item) => acc + item.quantidade, 0);
        }
      });

    // Ouve abertura/fechamento do carrinho
    this.carrinhoService.carrinhoAberto$
      .pipe(takeUntil(this.destroy$))
      .subscribe(aberto => this.carrinhoAberto = aberto);
  }

  // --- CARREGAMENTO DE DADOS ---
  carregarPratos(): void {
    this.pratoService.listarPratos().pipe(takeUntil(this.destroy$)).subscribe(pratos => {
        this.cardapio = pratos;
        if (!this.categoriaAtiva && this.categorias.length > 0) this.categoriaAtiva = this.categorias[0];
    });
  }

  carregarCategorias(): void {
    this.categoriaService.listarCategorias().pipe(takeUntil(this.destroy$)).subscribe(cats => {
        this.categorias = cats.map(c => ({...c, id: String(c.id)}));
        if (this.categorias.length > 0) this.categoriaAtiva = this.categorias[0];
    });
  }

  getItensPorCategoria(cat: CategoriaCardapio): ItemCardapio[] {
    if (!cat) return [];
    return this.cardapio.filter(item => {
        const catId = (typeof item.categoria === 'object') ? (item.categoria as any).id : item.categoria;
        return String(catId) === String(cat.id);
    });
  }

  selecionarCategoria(cat: CategoriaCardapio): void {
    this.categoriaAtiva = cat;
  }

  // --- ADICIONAR ITEM (Puramente Local) ---
  adicionarItem(item: ItemCardapio): void {
  const mesaNum = Number(this.mesa);

  if (!this.mesa || isNaN(mesaNum) || mesaNum === 0) {
    alert('Erro: Nenhuma mesa identificada.');
    return;
  }

  // Verifica se já existe comanda (seja rascunho ou real)
  const comandaAtual = this.comandaService.comandaAtualValue;

  // Se NÃO existe nada, cria o RASCUNHO LOCAL (ID=0)
  if (!comandaAtual) {
    console.log('✨ Criando rascunho local (ID=0)...');
    this.comandaService.setComandaLocalVazia(mesaNum, this.nomeCliente);
  }

  // Chama o carrinho (que agora tem a trava e não vai mandar pro backend)
  this.carrinhoService.adicionarItem(item, 1, '');
}

  // --- OUTROS ---
  abrirModalObservacao(item: ItemCardapio) { this.itemSelecionadoParaObservacao = item; this.mostrarModalObservacao = true; }
  fecharModalObservacao() { this.mostrarModalObservacao = false; this.itemSelecionadoParaObservacao = null; }
  
  adicionarItemComObservacao(obs: string) {
    if (this.itemSelecionadoParaObservacao) {
        this.carrinhoService.adicionarItem(this.itemSelecionadoParaObservacao, 1, obs);
        this.fecharModalObservacao();
    }
  }

  toggleCarrinho() { this.carrinhoService.toggleCarrinho(); }
  formatarPreco(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
  
  chamarGarcom() { /* ... mantém seu código de garçom ... */ }

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }
}