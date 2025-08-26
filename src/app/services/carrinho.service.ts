import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ItemCardapio } from '../models/item-cardapio.model';
import { ComandaService } from './comanda.service';
import { WebSocketService } from './websocket.service';
import { PedidoPayload } from '../models/pedidos.model';
import { Comanda } from '../models/comanda.model';

@Injectable({ providedIn: 'root' })
export class CarrinhoService {
  private pratosCardapioSubject = new BehaviorSubject<ItemCardapio[]>([]);
  private carrinhoAbertoSubject = new BehaviorSubject<boolean>(false);
  private readonly apiUrl = 'http://localhost:8000/api/pedidos/';

  constructor(
    private http: HttpClient,
    private wsService: WebSocketService,
    private comandaService: ComandaService
  ) {
    this.carregarPratosCardapio();
  }

  get pratosCardapio$(): Observable<ItemCardapio[]> {
    return this.pratosCardapioSubject.asObservable();
  }

  get carrinhoAberto$(): Observable<boolean> {
    return this.carrinhoAbertoSubject.asObservable();
  }

  private carregarPratosCardapio(): void {
    this.http.get<ItemCardapio[]>(`http://localhost:8000/api/pratos/`)
      .subscribe(pratos => this.pratosCardapioSubject.next(pratos));
  }

// carrinho.service.ts
adicionarItem(item: ItemCardapio, quantidade: number, observacao: string = ''): void {
  console.log('Adicionando item no carrinho:', item, quantidade, observacao);
  const comanda = this.comandaService.comandaAtualValue;
  if (!comanda) return;

  if (!Array.isArray(comanda.itens)) comanda.itens = [];

  const existente = comanda.itens.find(i => i.prato === item.id && i.observacao === observacao);
  if (existente) {
    existente.quantidade += quantidade;
  } else {
    comanda.itens.push({ prato: item.id, quantidade, observacao });
  }

  this.atualizarComandaRealTime(comanda);
}


  removerItem(pratoId: number, observacao: string = ''): void {
    const comanda = this.comandaService.comandaAtualValue;
    if (!comanda) return;

    comanda.itens = comanda.itens.filter(i => !(i.prato === pratoId && i.observacao === observacao));
    this.atualizarComandaRealTime(comanda);
  }

  private atualizarComandaRealTime(comanda: Comanda) {
    console.log('Payload enviado para atualização da comanda:', comanda);
    this.comandaService.setComanda(comanda);
    this.comandaService.atualizarComanda(comanda).subscribe({
      next: updated => this.wsService.enviarComandaAtualizada(updated),
      error: err => console.warn('Erro ao atualizar comanda no backend:', err)
    });
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

  confirmarPedidoNoCozinha(payload: PedidoPayload): Observable<any> {
    return this.http.post(this.apiUrl, payload);
  }
}
