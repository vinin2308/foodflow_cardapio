import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarrinhoService } from '../services/carrinho.service';
import {ItemCardapio } from '../models/item-cardapio.model';
import { Comanda } from '../models/carrinho.model';

const statusValido = ['pendente', 'enviada', 'preparando', 'pronta'];

@Component({
  selector: 'app-carrinho',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './carrinho.html',
  styleUrls: ['./carrinho.scss']
})
export class CarrinhoComponent implements OnInit {
  comanda: Comanda | null = null;

  @Output() fechar = new EventEmitter<void>();

  confirmandoPedido = false;

  // Recebe o cardápio para buscar preços e nomes
  pratosCardapio: ItemCardapio[] = [];

  constructor(private carrinhoService: CarrinhoService) {}

  ngOnInit() {
    this.carrinhoService.comanda$.subscribe(comanda => {
      this.comanda = comanda;
    });
    this.carrinhoService.pratosCardapio$.subscribe(pratos => {
      this.pratosCardapio = pratos;
    });
  }

  onFechar() {
    this.fechar.emit();
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

  aumentarQuantidade(pratoId: number, observacao = '') {
    if (!this.comanda) return;
    const item = this.comanda.itens.find(i => i.prato === pratoId && i.observacao === observacao);
    if (item) {
      this.carrinhoService.atualizarQuantidade(pratoId, item.quantidade + 1, observacao);
    }
  }

  diminuirQuantidade(pratoId: number, observacao = '') {
    if (!this.comanda) return;
    const item = this.comanda.itens.find(i => i.prato === pratoId && i.observacao === observacao);
    if (item && item.quantidade > 1) {
      this.carrinhoService.atualizarQuantidade(pratoId, item.quantidade - 1, observacao);
    }
  }

  removerItem(pratoId: number, observacao = '') {
    if (confirm('Remover este item do carrinho?')) {
      this.carrinhoService.removerItem(pratoId, observacao);
    }
  }

  getPratoPorId(id: number): ItemCardapio | undefined {
    return this.pratosCardapio.find(p => p.id === id);
  }

  formatarPreco(preco: number): string {
    return preco.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  calcularSubtotal(item: { prato: number; quantidade: number; observacao: string }): number {
    const pratoInfo = this.getPratoPorId(item.prato);
    const preco = pratoInfo ? pratoInfo.preco : 0;
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
        mesa: Number(this.comanda.mesa),
        nome_cliente: this.comanda.nome_cliente,
        status: statusParaEnviar,
        itens: this.comanda.itens.map(item => ({
          prato: item.prato,
          quantidade: item.quantidade,
          observacao: item.observacao || ''
        }))
      };
      console.log('Payload enviando para /api/pedidos/:', JSON.stringify(payload, null, 2));

      this.carrinhoService.confirmarPedidoNoCozinha(payload).subscribe({
  next: () => {
    this.confirmandoPedido = false;
    alert('Pedido enviado com sucesso! Aguarde a cozinha.');
    this.onFechar();
  },
  error: (err: any) => {
    this.confirmandoPedido = false;
    console.error('Erro ao enviar pedido:', err);
    if (err.error) {
      console.error('Detalhes do erro retornado pelo servidor:', JSON.stringify(err.error, null, 2));   
     }
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
}
