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
  imports: [CommonModule, CarrinhoComponent, ObservacaoModalComponent],
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
  tipoComanda: 'principal' | 'vinculada' | null = null;

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
    private comandaService: ComandaService,
    private apiService: ApiService
  ) {}

ngOnInit(): void {
  this.route.queryParams
    .pipe(takeUntil(this.destroy$))
    .subscribe(params => {
      this.mesa = params['mesa'] || '';
      this.nomeCliente = params['nome'] || '';
      const modoVinculado = params['principal'] === 'false';

      if (this.nomeCliente) {
        localStorage.setItem('nome', this.nomeCliente);
      }

      const mesaNum = Number(this.mesa);
      if (!isNaN(mesaNum)) {
const comandaLocal = this.comandaService.restaurarComandaLocal(mesaNum, modoVinculado);

// Ignora se houver código salvo desatualizado
if (!comandaLocal || localStorage.getItem('codigo-acesso')) {
  this.comandaService.inicializarComanda(mesaNum, this.nomeCliente, modoVinculado);
} else {
  this.comandaService.setComanda(comandaLocal);
}
        this.carregarCategorias();
        this.carregarPratos();
      }
    });

  this.comandaService.comanda$
    .pipe(takeUntil(this.destroy$))
    .subscribe(comanda => {
      this.comanda = comanda;
      this.codigoAcesso = comanda?.codigo_acesso || null;
      this.tipoComanda = comanda?.eh_principal ? 'principal' : 'vinculada';

      this.quantidadeTotalItens = Array.isArray(comanda?.itens)
        ? comanda.itens.reduce((acc, item) => acc + item.quantidade, 0)
        : 0;

      if (this.codigoAcesso) {
        localStorage.setItem('codigo-acesso', this.codigoAcesso);
      }
    });

  this.carrinhoService.carrinhoAberto$
    .pipe(takeUntil(this.destroy$))
    .subscribe(aberto => this.carrinhoAberto = aberto);
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
  const observacao = ''; // sem observação aqui, apenas adiciona normal
  const quantidade = 1;

  // Inicializa a comanda se ainda não existir
  if (!this.comandaService.comandaAtualValue) {
    this.comandaService.inicializarComanda(Number(this.mesa), this.nomeCliente);
  }

  // Adiciona item ao carrinho
  this.carrinhoService.adicionarItem(item, quantidade, observacao);
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

  chamarGarcom(): void {
    const mesaNum = Number(this.mesa);
    if (!mesaNum || isNaN(mesaNum)) {
      alert('Mesa não identificada!');
      return;
    }

    // Buscar o ID da mesa pelo número
    this.apiService.listarMesas().subscribe({
      next: (mesas) => {
        const mesaEncontrada = mesas.find(m => m.numero === mesaNum);
        if (mesaEncontrada && mesaEncontrada.id) {
          this.apiService.chamarGarcom(mesaEncontrada.id).subscribe({
            next: () => {
              alert('🔔 Garçom chamado com sucesso!');
            },
            error: (err) => {
              console.error('Erro ao chamar garçom:', err);
              alert('Erro ao chamar garçom. Tente novamente.');
            }
          });
        } else {
          alert('Mesa não encontrada!');
        }
      },
      error: (err) => {
        console.error('Erro ao buscar mesas:', err);
        alert('Erro ao buscar mesa. Tente novamente.');
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
