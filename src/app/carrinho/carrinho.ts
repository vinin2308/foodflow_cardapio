import { Component, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
// Removido WebSocketService dos imports
import { CarrinhoService } from '../services/carrinho.service';
import { ComandaService } from '../services/comanda.service';
import { ItemCardapio } from '../models/item-cardapio.model';
import { Comanda } from '../models/comanda.model';

const statusValido = ['pendente', 'enviada', 'preparando', 'pronta'];

@Component({
  selector: 'app-carrinho',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './carrinho.html',
  styleUrls: ['./carrinho.scss']
})
export class CarrinhoComponent implements OnInit, OnDestroy {
  comanda: Comanda | null = null;
  pratosCardapio: ItemCardapio[] = [];
  
  @Output() fechar = new EventEmitter<void>();
  confirmandoPedido = false;
  private destroy$ = new Subject<void>();

  constructor(
    private carrinhoService: CarrinhoService,
    // Removido: private wsService: WebSocketService,
    // Removido: private realtimeService (se ele depender de WS)
    private comandaService: ComandaService
  ) {}

  ngOnInit() {
    // 1. Ouve mudanças na comanda
    this.comandaService.comanda$
      .pipe(takeUntil(this.destroy$))
      .subscribe(comanda => {
        this.comanda = comanda;

        // ✅ LÓGICA NOVA: Recupera o nome do localStorage se estiver faltando
        if (this.comanda) {
          if (!this.comanda.nome_cliente) {
            const nomeSalvo = localStorage.getItem('nome'); // 'nome' é a chave que você usou na Home
            if (nomeSalvo) {
              this.comanda.nome_cliente = nomeSalvo;
            }
          }
        }
      });

    // 2. Carrega os pratos do cardápio para exibir nomes e preços corretos
    this.carrinhoService.pratosCardapio$
      .pipe(takeUntil(this.destroy$))
      .subscribe(pratos => {
        this.pratosCardapio = pratos;
      });
  }
    onFechar() {
      this.fechar.emit();
    }

    getNomePrato(item: { prato?: number; prato_nome?: string }): string {
    if (item.prato) {
      const pratoInfo = this.getPratoPorId(item.prato);
      return pratoInfo ? pratoInfo.nome : 'Prato desconhecido';
    }
    return item.prato_nome || 'Prato desconhecido';
  }

    getStatusTexto(status: string): string {
      const statusMap: { [key: string]: string } = {
        'pendente': 'Pendente',
        'enviada': 'Enviado',
        'preparando': 'Preparando',
        'pronta': 'Pronto'
      };
      return statusMap[status] || status;
    }

    getPratoPorId(id: number): ItemCardapio | undefined {
      return this.pratosCardapio.find(p => p.id === id);
    }

    formatarPreco(preco: number): string {
      return preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    calcularSubtotal(item: { prato?: number; prato_nome?: string; quantidade: number; observacao: string }): number {
    let preco = 0;
    if (item.prato) {
      const pratoInfo = this.getPratoPorId(item.prato);
      preco = pratoInfo ? pratoInfo.preco : 0;
    }
    return preco * item.quantidade;
  }

  calcularTotal(): number {
    if (!this.comanda) return 0;
    return this.comanda.itens.reduce((total, item) => {
      const pratoInfo = this.getPratoPorId(item.prato);
      const preco = pratoInfo ? pratoInfo.preco : 0;
      return total + preco * item.quantidade;
    }, 0);
  }



    // =========================
    // ALTERAÇÕES EM TEMPO REAL
    // =========================
    adicionarItem(pratoId: number, quantidade = 1, observacao = '') {
    if (!this.comanda) return;
    const itemExistente = this.comanda.itens.find(
      i => i.prato === pratoId && i.observacao === observacao
    );
    if (itemExistente) {
      itemExistente.quantidade += quantidade;
    } else {
      this.comanda.itens.push({ prato: pratoId, quantidade, observacao });
    }
    this.atualizarLocalmente();
  }

  diminuirQuantidade(pratoId: number, observacao = '') {
    if (!this.comanda) return;
    const item = this.comanda.itens.find(i => i.prato === pratoId && i.observacao === observacao);
    if (item && item.quantidade > 1) {
      item.quantidade--;
      this.atualizarLocalmente();
    }
  }

  removerItem(pratoId: number, observacao = '') {
    if (!this.comanda) return;
    if (confirm('Remover este item do carrinho?')) {
      this.comanda.itens = this.comanda.itens.filter(
        i => !(i.prato === pratoId && i.observacao === observacao)
      );
      this.atualizarLocalmente();
    }
  }

  private atualizarLocalmente() {
    if (!this.comanda) return;
    this.comandaService.setComanda(this.comanda);
  }

    atualizarObservacao(pratoId: number, novaObs: string) {
      if (!this.comanda) return;
      const item = this.comanda.itens.find(i => i.prato === pratoId);
      if (item) {
        item.observacao = novaObs;
        this.atualizarLocalmente();
      }
    }



    // =========================
    // CONFIRMAR PEDIDO
    // =========================
    confirmarPedido() {
    // Validações básicas
    if (!this.comanda || this.comanda.itens.length === 0) {
      alert('Carrinho vazio! Adicione itens antes de confirmar o pedido.');
      return;
    }

    if (!this.comanda.nome_cliente || this.comanda.nome_cliente.trim() === '') {
      alert('Informe o nome do cliente antes de confirmar o pedido.');
      return;
    }

    if (confirm(`Confirmar pedido no valor de ${this.formatarPreco(this.calcularTotal())}?`)) {
      this.confirmandoPedido = true;

      // ✅ CORREÇÃO AQUI: Incluindo os campos obrigatórios (mesa, nome_cliente, status)
      const payload = {
        mesa: Number(this.comanda.mesa_numero), 
        nome_cliente: this.comanda.nome_cliente,
        status: 'pendente', // Sempre envia como 'pendente' para a cozinha ver
        itens: this.comanda.itens.map(item => ({
          prato: item.prato,
          quantidade: item.quantidade,
          observacao: item.observacao || ''
        }))
      };

      this.carrinhoService.confirmarPedidoNoCozinha(payload).subscribe({
        next: (pedidoCriado) => {
          this.confirmandoPedido = false;

          // Limpa o carrinho local após sucesso
          if (this.comanda) {
            this.comanda.itens = []; // Esvazia a lista visualmente
            this.comandaService.setComanda(this.comanda); // Salva vazio no localStorage
          }

          alert('Pedido enviado com sucesso! Aguarde a cozinha.');
          this.onFechar();
        },
        error: (err: any) => {
          this.confirmandoPedido = false;
          console.error('Erro ao enviar pedido:', err);
          alert('Erro ao enviar o pedido. Tente novamente.');
        }
      });
    }
  }

    get carrinhoVazio(): boolean {
      return !this.comanda || this.comanda.itens.length === 0;
    }

    get quantidadeTotalItens(): number {
      if (!this.comanda) return 0;
      return this.comanda.itens.reduce((total, item) => total + item.quantidade, 0);
    }

    ngOnDestroy() {
      this.destroy$.next();
      this.destroy$.complete();
    }

  }
