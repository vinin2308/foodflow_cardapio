import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ItemCardapio, ItemCarrinho, Comanda } from '../models/item-cardapio.model';

@Injectable({
  providedIn: 'root'
})
export class CarrinhoService {
  private comandaAtual: Comanda | null = null;
  private comandaSubject = new BehaviorSubject<Comanda | null>(null);
  private carrinhoAbertoSubject = new BehaviorSubject<boolean>(false);

  constructor() {
    this.carregarComandaLocal();
  }

  // Observables para componentes se inscreverem
  get comanda$(): Observable<Comanda | null> {
    return this.comandaSubject.asObservable();
  }

  get carrinhoAberto$(): Observable<boolean> {
    return this.carrinhoAbertoSubject.asObservable();
  }

  // Inicializar comanda para uma mesa
  iniciarComanda(mesa: string, clienteNome?: string): void {
    const comandaId = `mesa-${mesa}-${Date.now()}`;
    this.comandaAtual = {
      id: comandaId,
      mesa: mesa,
      itens: [],
      total: 0,
      status: 'ativa',
      criadaEm: new Date()
    };
    
    this.salvarComandaLocal();
    this.comandaSubject.next(this.comandaAtual);
  }

  // Conectar a uma comanda existente
  conectarComanda(mesa: string): boolean {
    const comandaExistente = this.buscarComandaPorMesa(mesa);
    if (comandaExistente) {
      this.comandaAtual = comandaExistente;
      this.comandaSubject.next(this.comandaAtual);
      return true;
    }
    return false;
  }

  // Adicionar item ao carrinho
  adicionarItem(item: ItemCardapio, observacao?: string): void {
    if (!this.comandaAtual) return;

    const itemId = `${item.id}-${Date.now()}`;
    const itemCarrinho: ItemCarrinho = {
      item: item,
      quantidade: 1,
      observacao: observacao,
      id: itemId
    };

    // Verificar se já existe o mesmo item com a mesma observação
    const itemExistente = this.comandaAtual.itens.find(
      i => i.item.id === item.id && i.observacao === observacao
    );

    if (itemExistente) {
      itemExistente.quantidade++;
    } else {
      this.comandaAtual.itens.push(itemCarrinho);
    }

    this.atualizarTotal();
    this.salvarComandaLocal();
    this.comandaSubject.next(this.comandaAtual);
  }

  // Remover item do carrinho
  removerItem(itemId: string): void {
    if (!this.comandaAtual) return;

    this.comandaAtual.itens = this.comandaAtual.itens.filter(
      item => item.id !== itemId
    );

    this.atualizarTotal();
    this.salvarComandaLocal();
    this.comandaSubject.next(this.comandaAtual);
  }

  // Atualizar quantidade de um item
  atualizarQuantidade(itemId: string, novaQuantidade: number): void {
    if (!this.comandaAtual) return;

    const item = this.comandaAtual.itens.find(i => i.id === itemId);
    if (item) {
      if (novaQuantidade <= 0) {
        this.removerItem(itemId);
      } else {
        item.quantidade = novaQuantidade;
        this.atualizarTotal();
        this.salvarComandaLocal();
        this.comandaSubject.next(this.comandaAtual);
      }
    }
  }

  // Abrir/fechar carrinho
  toggleCarrinho(): void {
    this.carrinhoAbertoSubject.next(!this.carrinhoAbertoSubject.value);
  }

  abrirCarrinho(): void {
    this.carrinhoAbertoSubject.next(true);
  }

  fecharCarrinho(): void {
    this.carrinhoAbertoSubject.next(false);
  }

  // Confirmar pedido
  confirmarPedido(): Observable<any> {
    if (!this.comandaAtual) {
      throw new Error('Nenhuma comanda ativa');
    }

    // Aqui seria feita a chamada para o backend
    // Por enquanto, vamos simular
    this.comandaAtual.status = 'enviada';
    this.salvarComandaLocal();
    this.comandaSubject.next(this.comandaAtual);

    // Simular resposta do backend
    return new Observable(observer => {
      setTimeout(() => {
        observer.next({ success: true, pedidoId: this.comandaAtual?.id });
        observer.complete();
      }, 1000);
    });
  }

  // Obter quantidade total de itens no carrinho
  get quantidadeTotalItens(): number {
    if (!this.comandaAtual) return 0;
    return this.comandaAtual.itens.reduce((total, item) => total + item.quantidade, 0);
  }

  // Métodos privados
  private atualizarTotal(): void {
    if (!this.comandaAtual) return;
    
    this.comandaAtual.total = this.comandaAtual.itens.reduce(
      (total, item) => total + (item.item.preco * item.quantidade), 0
    );
  }

  private salvarComandaLocal(): void {
    if (this.comandaAtual) {
      localStorage.setItem(`comanda-${this.comandaAtual.mesa}`, JSON.stringify(this.comandaAtual));
    }
  }

  private carregarComandaLocal(): void {
    // Tentar carregar comanda da mesa atual do localStorage
    const mesaAtual = localStorage.getItem('mesa-atual');
    if (mesaAtual) {
      const comandaSalva = localStorage.getItem(`comanda-${mesaAtual}`);
      if (comandaSalva) {
        this.comandaAtual = JSON.parse(comandaSalva);
        this.comandaSubject.next(this.comandaAtual);
      }
    }
  }

  private buscarComandaPorMesa(mesa: string): Comanda | null {
    const comandaSalva = localStorage.getItem(`comanda-${mesa}`);
    return comandaSalva ? JSON.parse(comandaSalva) : null;
  }
}

