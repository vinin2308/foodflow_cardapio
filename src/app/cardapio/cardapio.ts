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
  tipoComanda: 'principal' | 'vinculada' | null = null;

  cardapio: ItemCardapio[] = [];
  categorias: CategoriaCardapio[] = [];
  categoriaAtiva: CategoriaCardapio | null = null;

  mostrarModalObservacao = false;
  itemSelecionadoParaObservacao: ItemCardapio | null = null;

  quantidadeTotalItens = 0;

  constructor(
    private route: ActivatedRoute,
    public carrinhoService: CarrinhoService, // Public para acessar no template se precisar
    private pratoService: PratoService,
    private categoriaService: CategoriaService,
    private comandaService: ComandaService,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    // 1. Escuta mudanças na URL
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        console.log('🔍 Parâmetros da URL:', params);

        let mesaUrl = params['mesa'];
        if (!mesaUrl) {
          mesaUrl = localStorage.getItem('mesa_atual_cache');
        }

        this.mesa = mesaUrl ? String(mesaUrl) : '';

        if (this.mesa) {
          localStorage.setItem('mesa_atual_cache', this.mesa);
          console.log('✅ Mesa definida como:', this.mesa);

          this.nomeCliente = params['nome'] || localStorage.getItem('nome') || '';
          const modoVinculado = params['principal'] === 'false';
          const mesaNum = Number(this.mesa);

          if (!isNaN(mesaNum) && mesaNum > 0) {
            const comandaLocal = this.comandaService.restaurarComandaLocal(mesaNum, modoVinculado);

            if (!comandaLocal || localStorage.getItem('codigo-acesso')) {
              this.comandaService.inicializarComanda(mesaNum, this.nomeCliente, modoVinculado);
            } else {
              this.comandaService.setComanda(comandaLocal);
            }

            // Carrega os dados do cardápio
            this.carregarCategorias();
            this.carregarPratos();
          }
        } else {
          console.error('❌ Nenhuma mesa identificada! A URL deve ter ?mesa=X');
        }
      });

    // 2. Escuta mudanças no Carrinho (Para atualizar a bolinha amarela)
    if (this.carrinhoService.carrinhoSubject) {
        this.carrinhoService.carrinhoSubject
        .pipe(takeUntil(this.destroy$))
        .subscribe(itens => {
            this.quantidadeTotalItens = itens.reduce((acc, item) => acc + item.quantidade, 0);
        });
    }

    // 3. Escuta mudanças na Comanda (Backend)
    this.comandaService.comanda$
      .pipe(takeUntil(this.destroy$))
      .subscribe(comanda => {
        this.comanda = comanda;
        this.codigoAcesso = comanda?.codigo_acesso || null;
        this.tipoComanda = comanda?.eh_principal ? 'principal' : 'vinculada';

        // Atualiza quantidade baseada no backend também
        if (comanda && Array.isArray(comanda.itens)) {
             this.quantidadeTotalItens = comanda.itens.reduce((acc, item) => acc + item.quantidade, 0);
        }

        if (this.codigoAcesso) {
          localStorage.setItem('codigo-acesso', this.codigoAcesso);
        }
      });

    // 4. Escuta estado do carrinho (aberto/fechado)
    this.carrinhoService.carrinhoAberto$
      .pipe(takeUntil(this.destroy$))
      .subscribe(aberto => this.carrinhoAberto = aberto);
  }

  // --- MÉTODOS DE CARREGAMENTO ---

  carregarPratos(): void {
    this.pratoService.listarPratos()
      .pipe(takeUntil(this.destroy$))
      .subscribe(pratos => {
        this.cardapio = pratos;
        // Lógica para agrupar categorias se necessário...
        if (!this.categoriaAtiva && this.categorias.length > 0) {
             this.categoriaAtiva = this.categorias[0];
        }
      });
  }

  carregarCategorias(): void {
    this.categoriaService.listarCategorias()
      .pipe(takeUntil(this.destroy$))
      .subscribe(categorias => {
        // Converte ID para string se necessário para compatibilidade
        this.categorias = categorias.map(cat => ({ 
            ...cat, 
            id: String(cat.id) 
        }));
        
        if (this.categorias.length > 0) {
          this.categoriaAtiva = this.categorias[0];
        }
      });
  }

  // --- LÓGICA DA TELA ---

  getItensPorCategoria(categoria: CategoriaCardapio): ItemCardapio[] {
  if (!categoria) return [];

  return this.cardapio.filter(item => {
    // 1. Descobre o ID da categoria do prato (seja objeto ou numero)
    // O backend manda objeto {id: 1, ...}, mas as vezes pode ser só o id 1
    const categoriaDoPrato = (item.categoria && typeof item.categoria === 'object') 
      ? (item.categoria as any).id 
      : item.categoria;

    // 2. Compara tudo como STRING para evitar erro de (1 !== "1")
    return String(categoriaDoPrato) === String(categoria.id);
  });
}

  selecionarCategoria(categoria: CategoriaCardapio): void {
    this.categoriaAtiva = categoria;
  }

  // --- ADICIONAR AO CARRINHO ---

  adicionarItem(item: ItemCardapio): void {
    const mesaNum = Number(this.mesa);

    if (!this.mesa || isNaN(mesaNum) || mesaNum === 0) {
      alert('⚠️ Erro: Nenhuma mesa identificada. Atualize a página com ?mesa=X na URL.');
      return;
    }

    const observacao = '';
    const quantidade = 1;

    const comandaAtual = this.comandaService.comandaAtualValue;

    if (comandaAtual && comandaAtual.id) {
      // Já tem comanda, adiciona direto
      this.carrinhoService.adicionarItem(item, quantidade, observacao);
    } else {
      // Cria comanda primeiro
      console.log('⏳ Criando comanda para mesa ' + mesaNum + ' antes de adicionar...');
      
      this.comandaService.criarComanda({ 
        mesa: mesaNum, 
        nome_cliente: this.nomeCliente || 'Cliente' 
      }).subscribe({
        next: (comanda) => {
          console.log('✅ Comanda criada com sucesso! ID:', comanda.id);
          this.comandaService.setComanda(comanda);
          this.carrinhoService.adicionarItem(item, quantidade, observacao);
        },
        error: (err) => {
          console.error('❌ Erro ao criar comanda:', err);
          alert('Erro ao iniciar o pedido. Tente recarregar a página.');
        }
      });
    }
  }

  // --- MODAL DE OBSERVAÇÃO ---

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
      // Aqui assumimos que a comanda já existe ou será tratada pelo adicionarItem
      // Para simplificar, chamamos o carrinho direto se já tiver comanda, 
      // ou podemos adaptar a lógica do adicionarItem para aceitar observação.
      
      // Melhor prática: Reutilizar a lógica de criação de comanda
      // Mas como o modal só abre se a tela carregou, assumimos que está ok chamar direto
      this.carrinhoService.adicionarItem(this.itemSelecionadoParaObservacao, 1, observacao);
      this.fecharModalObservacao();
    }
  }

  // --- OUTRAS AÇÕES ---

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

    this.apiService.listarMesas().subscribe({
      next: (mesas) => {
        const mesaEncontrada = mesas.find(m => m.numero === mesaNum);
        if (mesaEncontrada && mesaEncontrada.id) {
          this.apiService.chamarGarcom(mesaEncontrada.id).subscribe({
            next: () => alert('🔔 Garçom chamado com sucesso!'),
            error: () => alert('Erro ao chamar garçom. Tente novamente.')
          });
        } else {
          alert('Mesa não encontrada!');
        }
      },
      error: () => alert('Erro ao buscar mesa.')
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}