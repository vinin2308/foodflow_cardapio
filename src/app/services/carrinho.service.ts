import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ItemCardapio } from '../models/item-cardapio.model';
import { ComandaService } from './comanda.service';
import { PedidoPayload } from '../models/pedidos.model';
import { Comanda } from '../models/comanda.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CarrinhoService {
  private pratosCardapioSubject = new BehaviorSubject<ItemCardapio[]>([]);
  private carrinhoAbertoSubject = new BehaviorSubject<boolean>(false);
  public carrinhoSubject = new BehaviorSubject<any[]>([]);
  private readonly apiUrl = environment.apiUrl + '/pedidos/';

  constructor(
    private http: HttpClient,
    private comandaService: ComandaService
  ) {
    // Opcional: Se o CardapioComponent já carrega os pratos, isso pode ser redundante, 
    // mas mal não faz.
    this.carregarPratosCardapio();
  }

  get pratosCardapio$(): Observable<ItemCardapio[]> {
    return this.pratosCardapioSubject.asObservable();
  }

  get carrinhoAberto$(): Observable<boolean> {
    return this.carrinhoAbertoSubject.asObservable();
  }

  private carregarPratosCardapio(): void {
    // Ajuste seguro da URL
    const urlPratos = environment.apiUrl + '/pratos/';
    this.http.get<ItemCardapio[]>(urlPratos)
      .subscribe(pratos => this.pratosCardapioSubject.next(pratos));
  }

  // --- ADICIONAR ITEM (Corrigido para não criar comanda) ---
  adicionarItem(item: ItemCardapio, quantidade: number = 1, observacao: string = ''): void {
  const comanda = this.comandaService.comandaAtualValue;

  if (!comanda || !comanda.id) {
    console.error('Erro Crítico: Tentativa de adicionar item sem comanda iniciada.');
    return;
  }

  if (!Array.isArray(comanda.itens)) comanda.itens = [];

  observacao = observacao || '';

  const existente = comanda.itens.find(i => i.prato === item.id && (i.observacao || '') === observacao);
  
  if (existente) {
    existente.quantidade += quantidade;
  } else {
    comanda.itens.push({ prato: item.id, quantidade, observacao });
  }

  // 1. Isso garante que a bolinha amarela atualize
  this.comandaService.notificarMudancaLocal(); 

  // 2. Salva no backend
  this.atualizarComandaRealTime(comanda);
  
  // 3. COMENTE OU APAGUE ESTA LINHA:
  // this.abrirCarrinho(); <--- Isso é que fazia abrir sozinho
}

  removerItem(pratoId: number, observacao: string = ''): void {
    const comanda = this.comandaService.comandaAtualValue;
    if (!comanda || !comanda.id) return;

    observacao = observacao || '';
    comanda.itens = comanda.itens.filter(i => !(i.prato === pratoId && (i.observacao || '') === observacao));

    this.atualizarComandaRealTime(comanda);
  }

  atualizarQuantidade(pratoId: number, observacao: string, quantidade: number): void {
    const comanda = this.comandaService.comandaAtualValue;
    if (!comanda || !comanda.id) return;

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

  // --- SINCRONIZAÇÃO COM BACKEND (Corrigido) ---
  private atualizarComandaRealTime(comanda: Comanda) {
    if (!comanda || !comanda.id) return;

    // Prepara o payload limpo para o Django
    const itensValidos = comanda.itens.map(i => ({
      prato: Number(i.prato),
      quantidade: i.quantidade,
      observacao: i.observacao || ''
    }));

    const payload = { itens: itensValidos };

    // 🚀 O erro estava aqui: Faltava enviar a requisição!
    this.atualizarComandaParcial(comanda.id, payload).subscribe({
      next: (comandaAtualizada) => {
        console.log('Carrinho sincronizado com sucesso');
        // Opcional: Atualizar o BehaviorSubject do ComandaService se o backend retornar algo novo
        // this.comandaService.setComanda(comandaAtualizada); 
      },
      error: (err) => console.error('Erro ao sincronizar carrinho:', err)
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
    const urlCozinha = environment.apiUrl + '/cozinha/';
    return this.http.post(urlCozinha, payload);
  }

  atualizarComandaParcial(id: number, payload: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}${id}/`, payload);
  }
}