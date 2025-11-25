import { Component, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
// IMPORTE O ROUTER PARA PODER MUDAR DE TELA
import { Router } from '@angular/router'; 

import { CarrinhoService } from '../services/carrinho.service';
import { ComandaService } from '../services/comanda.service';
import { ApiService } from '../services/api.service'; 
import { ItemCardapio } from '../models/item-cardapio.model';
import { Comanda } from '../models/comanda.model';

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
    private comandaService: ComandaService,
    private apiService: ApiService,
    private router: Router // <--- INJETADO AQUI
  ) {}

  ngOnInit() {
    this.comandaService.comanda$
      .pipe(takeUntil(this.destroy$))
      .subscribe(comanda => {
        this.comanda = comanda;
        if (this.comanda && !this.comanda.nome_cliente) {
            const nomeSalvo = localStorage.getItem('nome'); 
            if (nomeSalvo) this.comanda.nome_cliente = nomeSalvo;
        }
      });

    this.carrinhoService.pratosCardapio$
      .pipe(takeUntil(this.destroy$))
      .subscribe(pratos => {
        this.pratosCardapio = pratos;
      });
  }

  onFechar() {
    this.fechar.emit();
  }

  // ... (Métodos auxiliares getNomePrato, getStatusTexto, getPratoPorId, etc. continuam iguais) ...
  getNomePrato(item: any): string {
    if (item.prato) {
      const pratoInfo = this.getPratoPorId(item.prato);
      return pratoInfo ? pratoInfo.nome : 'Prato desconhecido';
    }
    return item.prato_nome || 'Prato desconhecido';
  }

  getStatusTexto(status: string): string { return status; } // Simplificado
  
  getPratoPorId(id: number): ItemCardapio | undefined {
    return this.pratosCardapio.find(p => p.id === id);
  }

  formatarPreco(preco: number): string {
    return preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  calcularSubtotal(item: any): number {
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

  // ... (Métodos adicionarItem, diminuirQuantidade, removerItem, etc. continuam iguais) ...
  adicionarItem(pratoId: number, quantidade = 1, observacao = '') {
    if (!this.comanda) return;
    const itemExistente = this.comanda.itens.find(i => i.prato === pratoId && i.observacao === observacao);
    if (itemExistente) itemExistente.quantidade += quantidade;
    else this.comanda.itens.push({ prato: pratoId, quantidade, observacao });
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
    if (confirm('Remover este item?')) {
        this.comanda.itens = this.comanda.itens.filter(i => !(i.prato === pratoId && i.observacao === observacao));
        this.atualizarLocalmente();
    }
  }

  atualizarObservacao(pratoId: number, novaObs: string) {
    if (!this.comanda) return;
    const item = this.comanda.itens.find(i => i.prato === pratoId);
    if (item) {
        item.observacao = novaObs;
        this.atualizarLocalmente();
    }
  }

  private atualizarLocalmente() {
    if (!this.comanda) return;
    this.comandaService.setComanda(this.comanda);
  }

  // =========================
  // CONFIRMAR PEDIDO (FINAL)
  // =========================
  confirmarPedido() {
    // Validações
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

      // Payload formatado para o Django
      const payload = {
        mesa: this.comanda.mesa_numero ? Number(this.comanda.mesa_numero) : 1, 
        nome_cliente: this.comanda.nome_cliente,
        itens: this.comanda.itens.map(item => ({
          prato: item.prato,
          quantidade: item.quantidade,
          observacao: item.observacao || ''
        }))
      };

      // Envia para a rota /iniciar-comanda/
      this.apiService.iniciarComanda(payload).subscribe({
        next: (pedidoCriado) => {
          this.confirmandoPedido = false;

          // 1. Salvar código no navegador
          localStorage.setItem('pedido_ativo', pedidoCriado.codigo_acesso);

          // 2. Limpar carrinho local
          if (this.comanda) {
            this.comanda.itens = []; 
            this.comandaService.setComanda(this.comanda); 
          }

          // --- O PULO DO GATO ESTÁ AQUI ---
          // Navega PRIMEIRO e só fecha o modal DEPOIS que a navegação começar.
          // Isso impede que a tela pisque ou volte para a Home errado.
          this.router.navigate(['/acompanhar']).then(() => {
             this.onFechar(); 
          });
        },
        error: (err: any) => {
          this.confirmandoPedido = false;
          console.error('Erro ao enviar:', err);
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