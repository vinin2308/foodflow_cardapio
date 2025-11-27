import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ItemCardapio } from '../models/item-cardapio.model';
import { ComandaService } from './comanda.service';
import { Comanda } from '../models/comanda.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CarrinhoService {
  private pratosCardapioSubject = new BehaviorSubject<ItemCardapio[]>([]);
  public carrinhoAbertoSubject = new BehaviorSubject<boolean>(false);
  private readonly apiUrl = environment.apiUrl + '/pedidos/';

  constructor(
    private http: HttpClient,
    private comandaService: ComandaService
  ) {
    this.carregarPratosCardapio();
  }

  get carrinhoAberto$(): Observable<boolean> { return this.carrinhoAbertoSubject.asObservable(); }
  get pratosCardapio$(): Observable<ItemCardapio[]> { return this.pratosCardapioSubject.asObservable(); }

  private carregarPratosCardapio(): void {
    this.http.get<ItemCardapio[]>(environment.apiUrl + '/pratos/')
      .subscribe(pratos => this.pratosCardapioSubject.next(pratos));
  }

  // --- ADICIONAR ITEM ---
  adicionarItem(item: ItemCardapio, quantidade: number = 1, observacao: string = ''): void {
  const comanda = this.comandaService.comandaAtualValue;

  // Se não tem comanda, erro (o CardapioComponent já devia ter criado o rascunho)
  if (!comanda) {
    console.error('Erro: Comanda não inicializada.');
    return;
  }

  // Garante que o array existe
  if (!Array.isArray(comanda.itens)) comanda.itens = [];

  // Lógica de adicionar ao array local
  const itemExistente = comanda.itens.find(i => i.prato === item.id && (i.observacao || '') === observacao);
  
  if (itemExistente) {
    itemExistente.quantidade += quantidade;
  } else {
    comanda.itens.push({ prato: item.id, quantidade, observacao });
  }

  // 1. Atualiza a tela (Bolinha amarela e lista)
  this.comandaService.notificarMudancaLocal();

  // 🛑 AQUI ESTÁ A CORREÇÃO: 
  // Só envia para a cozinha se a comanda JÁ EXISTIR NO SERVIDOR (ID > 0).
  // Se for rascunho (ID 0), ele SÓ salva localmente e NÃO chama a API.
  if (comanda.id && comanda.id > 0) {
      console.log('🔄 Comanda já existe, sincronizando item extra com a cozinha...');
      this.atualizarComandaRealTime(comanda);
  } else {
      console.log('📝 Item adicionado ao rascunho local. Aguardando confirmação...');
  }
} 

  removerItem(pratoId: number, observacao: string = '') {
    const comanda = this.comandaService.comandaAtualValue;
    if (!comanda) return;
    
    comanda.itens = comanda.itens.filter(i => !(i.prato === pratoId && (i.observacao || '') === observacao));
    
    this.comandaService.notificarMudancaLocal();
    
    // ✅ CORREÇÃO AQUI TAMBÉM
    if ((comanda.id ?? 0) > 0) {
      this.atualizarComandaRealTime(comanda);
    }
  }

  private atualizarComandaRealTime(comanda: Comanda) {
    const itensValidos = comanda.itens.map(i => ({
      prato: Number(i.prato),
      quantidade: i.quantidade,
      observacao: i.observacao || ''
    }));
    
    this.http.patch(`${this.apiUrl}${comanda.id}/`, { itens: itensValidos })
        .subscribe({ error: err => console.error('Erro sync:', err) });
  }

  toggleCarrinho() { this.carrinhoAbertoSubject.next(!this.carrinhoAbertoSubject.value); }
  abrirCarrinho() { this.carrinhoAbertoSubject.next(true); }
  fecharCarrinho() { this.carrinhoAbertoSubject.next(false); }
  limparCarrinhoLocal() {
    // Se quiser, pode limpar o BehaviorSubject de itens também se tiver um separado
    // Mas principalmente, garante que não tem comanda velha atrapalhando
    // Como os itens ficam dentro do objeto Comanda, ao resetar a comanda no passo anterior, 
    // teoricamente já limpa. 
    // Mas se você tiver um array `itens` solto na classe, limpe ele aqui:
    // this.itens = []; 
}
} 