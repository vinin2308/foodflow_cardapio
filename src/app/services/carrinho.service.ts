import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ItemCardapio } from '../models/item-cardapio.model';
import { ComandaService } from './comanda.service';
import { PedidoPayload } from '../models/pedidos.model';
import { Comanda } from '../models/comanda.model';
import { environment } from '../../enviroments/enviroment';
@Injectable({ providedIn: 'root' })
export class CarrinhoService {
  private pratosCardapioSubject = new BehaviorSubject<ItemCardapio[]>([]);
  private carrinhoAbertoSubject = new BehaviorSubject<boolean>(false);
  private readonly apiUrl = environment.apiUrl + '/pedidos/';

  constructor(
    private http: HttpClient,
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
    this.http.get<ItemCardapio[]>(`${this.apiUrl.replace('/pedidos/', '/pratos/')}`)
      .subscribe(pratos => this.pratosCardapioSubject.next(pratos));
  }

  adicionarItem(item: ItemCardapio, quantidade: number = 1, observacao: string = ''): void {
    const comanda = this.comandaService.comandaAtualValue;
    if (!comanda) return console.warn('Comanda não inicializada.');

    if (!Array.isArray(comanda.itens)) comanda.itens = [];

    observacao = observacao || '';

    // Procura item existente
    const existente = comanda.itens.find(i => i.prato === item.id && (i.observacao || '') === observacao);
    if (existente) {
      existente.quantidade += quantidade;
    } else {
      comanda.itens.push({ prato: item.id, quantidade, observacao });
    }

    // Atualiza backend
    if (comanda.id) {
      this.atualizarComandaRealTime(comanda);
    } else {
      console.warn('Comanda ainda não criada no backend. Criando agora...');
      this.comandaService.criarComanda({ mesa: comanda.mesa_numero, nome_cliente: comanda.nome_cliente })
        .subscribe(novaComanda => {
          this.comandaService.setComanda(novaComanda);
          this.atualizarComandaRealTime(novaComanda);
        });
    }
  }

  removerItem(pratoId: number, observacao: string = ''): void {
    const comanda = this.comandaService.comandaAtualValue;
    if (!comanda) return;

    observacao = observacao || '';
    comanda.itens = comanda.itens.filter(i => !(i.prato === pratoId && (i.observacao || '') === observacao));

    // Atualiza backend mesmo se ficar vazio
    this.atualizarComandaRealTime(comanda);
  }

  atualizarQuantidade(pratoId: number, observacao: string, quantidade: number): void {
    const comanda = this.comandaService.comandaAtualValue;
    if (!comanda) return;

    observacao = observacao || '';
    const item = comanda.itens.find(i => i.prato === pratoId && (i.observacao || '') === observacao);
    if (item) {
      item.quantidade = quantidade;
      if (item.quantidade <= 0) {
        this.removerItem(pratoId, observacao);
      } else {
        this.atualizarComandaRealTime(comanda);
      }
    }
  }

  private atualizarComandaRealTime(comanda: Comanda) {
    if (!comanda || !comanda.id) return;

    const itensValidos = comanda.itens.map(i => ({
      prato: Number(i.prato),
      quantidade: i.quantidade,
      observacao: i.observacao || ''
    }));

    // Sempre envia, mesmo que vazio
    const payload = { itens: itensValidos };

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
    const urlCozinha = environment.apiUrl + '/cozinha/';
    return this.http.post(urlCozinha, payload);
  }

  atualizarComandaParcial(id: number, payload: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}${id}/`, payload);
  }
}
  