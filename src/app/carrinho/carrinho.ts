import { Component, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { HttpClientModule } from '@angular/common/http';
import { CarrinhoService } from '../services/carrinho.service';
import { WebSocketService } from '../services/websocket.service';
import { PedidosRealtimeService } from '../services/pedidostemporeal.service';
import { ItemCardapio } from '../models/item-cardapio.model';
import { Comanda } from '../models/comanda.model';
import { Order } from '../models/ordel.model';
import { ComandaService } from '../services/comanda.service';

const statusValido = ['pendente', 'enviada', 'preparando', 'pronta'];

@Component({
  selector: 'app-carrinho',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './carrinho.html',
  styleUrls: ['./carrinho.scss']
})
export class CarrinhoComponent implements OnInit, OnDestroy {
  comanda: Comanda | null = null;
  pratosCardapio: ItemCardapio[] = [];
  pedidosRecebidos: Order[] = [];
  @Output() fechar = new EventEmitter<void>();
  confirmandoPedido = false;

  private destroy$ = new Subject<void>();

  constructor(
    private carrinhoService: CarrinhoService,
    private wsService: WebSocketService,
    private realtimeService: PedidosRealtimeService,
    private comandaService: ComandaService
  ) {}

  ngOnInit() {
this.comandaService.comanda$
  .pipe(takeUntil(this.destroy$))
  .subscribe(comanda => {
    this.comanda = comanda;
    if (comanda) {
      this.wsService.conectar(comanda.codigo_acesso ?? String(comanda.mesa_numero));
    }
  });


    // Subscribes para pratos do cardápio
    this.carrinhoService.pratosCardapio$
      .pipe(takeUntil(this.destroy$))
      .subscribe(pratos => {
        this.pratosCardapio = pratos;
      });

    // Recebe pedidos em tempo real do WebSocket
    this.wsService.comanda$
      .pipe(takeUntil(this.destroy$))
      .subscribe(comandaAtualizada => {
        this.comanda = comandaAtualizada;
      });

    // Mantém pedidos em tempo real
    this.realtimeService.pedidos$
      .pipe(takeUntil(this.destroy$))
      .subscribe(pedidos => {
        this.pedidosRecebidos = pedidos;
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

    this.atualizarComandaRealTime();
  }

  diminuirQuantidade(pratoId: number, observacao = '') {
    if (!this.comanda) return;
    const item = this.comanda.itens.find(i => i.prato === pratoId && i.observacao === observacao);
    if (item && item.quantidade > 1) {
      item.quantidade--;
      this.atualizarComandaRealTime();
    }
  }

  removerItem(pratoId: number, observacao = '') {
    if (!this.comanda) return;
    if (confirm('Remover este item do carrinho?')) {
      this.comanda.itens = this.comanda.itens.filter(
        i => !(i.prato === pratoId && i.observacao === observacao)
      );
      this.atualizarComandaRealTime();
    }
  }

  atualizarObservacao(pratoId: number, novaObs: string) {
    if (!this.comanda) return;
    const item = this.comanda.itens.find(i => i.prato === pratoId);
    if (item) {
      item.observacao = novaObs;
      this.atualizarComandaRealTime();
    }
  }

private atualizarComandaRealTime() {
  if (!this.comanda) return;

  // 🔹 Atualiza localStorage
  this.comandaService.setComanda(this.comanda);

  // 🔹 Atualiza backend e WebSocket
  this.comandaService.atualizarComanda(this.comanda).subscribe({
    next: (comandaAtualizada) => {
      this.comanda = comandaAtualizada;
      this.wsService.enviarComandaAtualizada(comandaAtualizada);
    },
    error: (err) => {
      console.warn('Erro ao atualizar comanda no backend, mas localStorage foi salvo:', err);
    }
  });
}


  // =========================
  // CONFIRMAR PEDIDO
  // =========================
  confirmarPedido() {
    if (!this.comanda || this.comanda.itens.length === 0) {
      alert('Carrinho vazio! Adicione itens antes de confirmar o pedido.');
      return;
    }

    if (!this.comanda.nome_cliente || this.comanda.nome_cliente.trim() === '') {
      alert('Informe o nome do cliente antes de confirmar o pedido.');
      return;
    }

    const statusAtual = this.comanda.status ?? '';
    const statusParaEnviar = statusValido.includes(statusAtual) ? statusAtual : 'pendente';

    if (confirm(`Confirmar pedido no valor de ${this.formatarPreco(this.calcularTotal())}?`)) {
      this.confirmandoPedido = true;

      const payload = {
        mesa: Number(this.comanda.mesa_numero),
        nome_cliente: this.comanda.nome_cliente,
        status: statusParaEnviar,
        itens: this.comanda.itens.map(item => ({
          prato: item.prato,
          quantidade: item.quantidade,
          observacao: item.observacao || ''
        }))
      };

      this.carrinhoService.confirmarPedidoNoCozinha(payload).subscribe({
        next: (pedidoCriado) => {
          this.confirmandoPedido = false;

          if (this.comanda) {
            this.comanda.codigo_acesso = pedidoCriado.codigo_acesso ?? this.comanda.codigo_acesso;
            this.atualizarComandaRealTime();
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
