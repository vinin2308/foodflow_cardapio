import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarrinhoService } from '../services/carrinho';
import { Comanda, ItemCarrinho } from '../models/item-cardapio.model';

@Component({
  selector: 'app-carrinho',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './carrinho.html',
  styleUrls: ['./carrinho.scss']
})
export class CarrinhoComponent implements OnInit {
  @Input() comanda: Comanda | null = null;
  @Output() fechar = new EventEmitter<void>();

  confirmandoPedido: boolean = false;

  constructor(private carrinhoService: CarrinhoService) {}

  ngOnInit() {
    // Componente recebe a comanda via Input
  }

  // Fechar carrinho
  onFechar() {
    this.fechar.emit();
  }

  // Aumentar quantidade de um item
  aumentarQuantidade(item: ItemCarrinho) {
    this.carrinhoService.atualizarQuantidade(item.id, item.quantidade + 1);
  }

  // Diminuir quantidade de um item
  diminuirQuantidade(item: ItemCarrinho) {
    if (item.quantidade > 1) {
      this.carrinhoService.atualizarQuantidade(item.id, item.quantidade - 1);
    }
  }

  // Remover item do carrinho
  removerItem(item: ItemCarrinho) {
    if (confirm(`Remover "${item.item.nome}" do carrinho?`)) {
      this.carrinhoService.removerItem(item.id);
    }
  }

  // Confirmar pedido
  confirmarPedido() {
    if (!this.comanda || this.comanda.itens.length === 0) {
      alert('Carrinho vazio! Adicione itens antes de confirmar o pedido.');
      return;
    }

    if (confirm(`Confirmar pedido no valor de ${this.formatarPreco(this.comanda.total)}?`)) {
      this.confirmandoPedido = true;
      
      this.carrinhoService.confirmarPedido().subscribe({
        next: (response) => {
          this.confirmandoPedido = false;
          alert('Pedido confirmado com sucesso! Aguarde a preparação.');
          this.onFechar();
        },
        error: (error) => {
          this.confirmandoPedido = false;
          alert('Erro ao confirmar pedido. Tente novamente.');
          console.error('Erro:', error);
        }
      });
    }
  }

  // Calcular subtotal de um item
  calcularSubtotal(item: ItemCarrinho): number {
    return item.item.preco * item.quantidade;
  }

  // Formatar preço
  formatarPreco(preco: number): string {
    return preco.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  // Verificar se carrinho está vazio
  get carrinhoVazio(): boolean {
    return !this.comanda || this.comanda.itens.length === 0;
  }

  // Obter quantidade total de itens
  get quantidadeTotalItens(): number {
    if (!this.comanda) return 0;
    return this.comanda.itens.reduce((total, item) => total + item.quantidade, 0);
  }

  // Obter texto do status
  getStatusTexto(status: string): string {
    const statusMap: { [key: string]: string } = {
      'ativa': 'Ativa',
      'enviada': 'Enviado',
      'preparando': 'Preparando',
      'pronta': 'Pronto'
    };
    return statusMap[status] || status;
  }
}

