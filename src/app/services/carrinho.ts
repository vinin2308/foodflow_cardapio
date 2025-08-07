import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ItemCardapio } from '../models/item-cardapio.model';
import { Comanda } from '../models/carrinho.model';
import { PedidoPayload } from '../models/pedidos.model';
import { Order } from '../models/ordel.model';
@Injectable({
  providedIn: 'root'
})
export class CarrinhoService {
  private apiUrl = 'http://localhost:8000/api/pedidos/';
  private comandaAtual: Comanda | null = null;
  private comandaSubject = new BehaviorSubject<Comanda | null>(null);
  private pratosCardapioSubject = new BehaviorSubject<ItemCardapio[]>([]);
  private carrinhoAbertoSubject = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient) {
    this.carregarComandaLocal();
    this.carregarPratosCardapio();
  }

  get comanda$(): Observable<Comanda | null> {
    return this.comandaSubject.asObservable();
  }

  get pratosCardapio$(): Observable<ItemCardapio[]> {
    return this.pratosCardapioSubject.asObservable();
  }

  get carrinhoAberto$(): Observable<boolean> {
    return this.carrinhoAbertoSubject.asObservable();
  }

  carregarPratosCardapio(): void {
    // Aqui faça a requisição para buscar os pratos (exemplo):
    this.http.get<ItemCardapio[]>('http://localhost:8000/api/pratos/')
      .subscribe(pratos => {
        this.pratosCardapioSubject.next(pratos);
      });
  }

  iniciarComanda(mesa: number): void {
    const nome = localStorage.getItem('nome') || '';
    const comandaId = `mesa-${mesa}-${Date.now()}`;
    this.comandaAtual = {
      id: comandaId,
      mesa,
      nome_cliente: nome,
      status: 'pendente',
      itens: []
    };
    localStorage.setItem('mesa-atual', String(mesa));
    this.salvarComandaLocal();
    this.comandaSubject.next(this.comandaAtual);
  }

  conectarComanda(mesa: number): boolean {
    const comandaExistente = this.buscarComandaPorMesa(mesa);
    if (comandaExistente) {
      this.comandaAtual = comandaExistente;
      this.comandaSubject.next(this.comandaAtual);
      return true;
    }
    return false;
  }

  adicionarItem(pratoId: number, quantidade: number, observacao?: string): void {
    if (!this.comandaAtual) return;

    const itemExistente = this.comandaAtual.itens.find(
      i => i.prato === pratoId && i.observacao === (observacao || '')
    );

    if (itemExistente) {
      itemExistente.quantidade += quantidade;
    } else {
      this.comandaAtual.itens.push({
        prato: pratoId,
        quantidade,
        observacao: observacao || ''
      });
    }

    this.salvarComandaLocal();
    this.comandaSubject.next(this.comandaAtual);
  }

  removerItem(pratoId: number, observacao = ''): void {
    if (!this.comandaAtual) return;

    this.comandaAtual.itens = this.comandaAtual.itens.filter(
      item => !(item.prato === pratoId && item.observacao === observacao)
    );

    this.salvarComandaLocal();
    this.comandaSubject.next(this.comandaAtual);
  }

  atualizarQuantidade(pratoId: number, novaQuantidade: number, observacao = ''): void {
    if (!this.comandaAtual) return;

    const item = this.comandaAtual.itens.find(
      i => i.prato === pratoId && i.observacao === observacao
    );

    if (item) {
      if (novaQuantidade <= 0) {
        this.removerItem(pratoId, observacao);
      } else {
        item.quantidade = novaQuantidade;
        this.salvarComandaLocal();
        this.comandaSubject.next(this.comandaAtual);
      }
    }
  }

  confirmarPedidoNoCozinha(pedido: PedidoPayload): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}cozinha/`, pedido);
  }

  toggleCarrinho(): void {
    this.carrinhoAbertoSubject.next(!this.carrinhoAbertoSubject.value);
  }

  abrirCarrinho(): void {
    this.carrinhoAbertoSubject.next(true);
  }

  fecharCarrinho(): void {
    this.carrinhoAbertoSubject.next(false);
  }

  private salvarComandaLocal(): void {
    if (this.comandaAtual) {
      localStorage.setItem(`comanda-${this.comandaAtual.mesa}`, JSON.stringify(this.comandaAtual));
    }
  }

  private carregarComandaLocal(): void {
    const mesaAtual = localStorage.getItem('mesa-atual');
    if (mesaAtual) {
      const comandaSalva = localStorage.getItem(`comanda-${mesaAtual}`);
      if (comandaSalva) {
        this.comandaAtual = JSON.parse(comandaSalva);
        this.comandaSubject.next(this.comandaAtual);
      }
    }
  }

  private buscarComandaPorMesa(mesa: number): Comanda | null {
    const comandaSalva = localStorage.getItem(`comanda-${mesa}`);
    return comandaSalva ? JSON.parse(comandaSalva) : null;
  }
}
