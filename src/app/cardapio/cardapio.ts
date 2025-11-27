import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, interval, switchMap, startWith } from 'rxjs'; // Imports para Polling
import { HttpClientModule } from '@angular/common/http';

import { CarrinhoService } from '../services/carrinho.service';
import { PedidosService } from '../services/pedidos.service'; // NOVO IMPORT OBRIGATÓRIO
import { CarrinhoComponent } from '../carrinho/carrinho';
import { ObservacaoModalComponent } from '../cozinha/observacao-modal/observacao-modal';

import { ItemCardapio, CategoriaCardapio } from '../models/item-cardapio.model';
import { PratoService } from '../services/prato.service';
import { CategoriaService } from '../services/categoria.service';
import { Comanda } from '../models/comanda.model';
import { ComandaService } from '../services/comanda.service';
import { ApiService } from '../services/api.service';

// Interface para o objeto do monitoramento
interface PedidoStatusBackground {
  status: string;
  tempo_estimado: number | null;
  codigo: string;
}

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

  // Variável para o monitor flutuante
  pedidoMonitor: PedidoStatusBackground | null = null;
  private readonly POLLING_INTERVAL = 5000; // 5 segundos

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public carrinhoService: CarrinhoService,
    private pratoService: PratoService,
    private categoriaService: CategoriaService,
    private comandaService: ComandaService,
    private apiService: ApiService,
    private pedidosService: PedidosService // Injeção do PedidosService
  ) {}

  ngOnInit(): void {
// 1. Inicia o monitoramento. Ele buscará o que está no localStorage
    this.iniciarMonitoramentoStatus(); 

    // 2. Antes de carregar os parâmetros da mesa...
    
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
            const comandaLocal = this.comandaService.restaurarComandaLocal(mesaNum);
            
            // VERIFICAÇÃO CRÍTICA
            if (comandaLocal && (comandaLocal.id ?? 0) > 0 && comandaLocal.status !== 'pago') {
                // Cenário A: Comanda ativa encontrada. OK.
                this.comandaService.setComanda(comandaLocal);
            } else {
                // Cenário B: Nenhuma comanda ativa (ID=0) ou paga. Começa do zero.
                this.comandaService.setComandaLocalVazia(mesaNum, this.nomeCliente);
                
                // AÇÃO CRÍTICA: Se estamos começando uma comanda VAZIA,
                // o monitoramento de background de qualquer pedido anterior deve ser parado.
                this.pararMonitoramentoStatus();
            }
            this.carregarCategorias();
            this.carregarPratos();
          }
        } else {
            console.error('❌ Nenhuma mesa identificada! A URL deve ter ?mesa=X');
        }
      });

    this.comandaService.comanda$
      .pipe(takeUntil(this.destroy$))
      .subscribe(comanda => {
        this.comanda = comanda;
        if (comanda && Array.isArray(comanda.itens)) {
             this.quantidadeTotalItens = comanda.itens.reduce((acc, item) => acc + item.quantidade, 0);
        }
      });

    this.carrinhoService.carrinhoAberto$
      .pipe(takeUntil(this.destroy$))
      .subscribe(aberto => this.carrinhoAberto = aberto);
  }

  // --- LÓGICA DE MONITORAMENTO (POLLING) ---

  getDadosMonitoramentoLocal(): PedidoStatusBackground | null {
    const id = localStorage.getItem('pedido_em_background');
    const status = localStorage.getItem('status_pedido_background');
    const tempo = localStorage.getItem('tempo_estimado_background');
    
    if (id && status) {
        if (status === 'entregue' || status === 'pago') {
            this.pararMonitoramentoStatus();
            return null;
        }
        return { codigo: id, status: status, tempo_estimado: tempo ? Number(tempo) : null };
    }
    return null;
  }

  iniciarMonitoramentoStatus(): void {
    this.pedidoMonitor = this.getDadosMonitoramentoLocal();
    
    if (this.pedidoMonitor) {
      interval(this.POLLING_INTERVAL).pipe(
        startWith(0), // Executa a primeira vez imediatamente
        takeUntil(this.destroy$),
        switchMap(() => this.pedidosService.consultarStatusResumido(this.pedidoMonitor!.codigo)) 
      ).subscribe(dados => {
        // Assume que 'dados' é o objeto resumido retornado pelo backend
        const novoStatus = Array.isArray(dados) && dados.length > 0 ? dados[0] : dados;
        
        this.pedidoMonitor = {
          codigo: novoStatus.codigo_acesso || this.pedidoMonitor!.codigo,
          status: novoStatus.status,
          tempo_estimado: novoStatus.tempo_estimado || null
        };
        
        if (novoStatus.status === 'entregue' || novoStatus.status === 'pago') {
          this.pararMonitoramentoStatus();
        }
      }, err => {
          console.error('Erro no Polling de Status:', err);
          // Opcional: Parar o monitoramento se o pedido sumir (404)
      });
    }
  }

  pararMonitoramentoStatus(): void {
    localStorage.removeItem('pedido_em_background');
    localStorage.removeItem('status_pedido_background');
    localStorage.removeItem('tempo_estimado_background');
    this.pedidoMonitor = null;
  }

  getStatusTexto(): string {
    const s = this.pedidoMonitor?.status;
    if (s === 'pendente') return 'Aguardando Confirmação';
    if (s === 'em_preparo') return 'Em Preparo 🔥';
    if (s === 'pronto') return 'Pedido Pronto! 🔔';
    return 'Aguardando...';
  }

  irParaPedidoAnterior() {
    // FALLBACK para a tela de acompanhamento completa
    if (this.pedidoMonitor) {
        this.router.navigate(['/acompanhar-pedido'], { 
            queryParams: { id: this.pedidoMonitor.codigo } 
        });
    }
  }
  
  // --- CARREGAMENTO DE DADOS (Inalterado) ---
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

  adicionarItem(item: ItemCardapio): void {
    const mesaNum = Number(this.mesa);
    if (!this.mesa || isNaN(mesaNum) || mesaNum === 0) {
      alert('Erro: Nenhuma mesa identificada.');
      return;
    }
    const comandaAtual = this.comandaService.comandaAtualValue;
    if (!comandaAtual) {
      this.comandaService.setComandaLocalVazia(mesaNum, this.nomeCliente);
    }
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
  chamarGarcom() { /* ... */ }
  
  ngOnDestroy() { 
    this.destroy$.next(); 
    this.destroy$.complete(); 
  }
}