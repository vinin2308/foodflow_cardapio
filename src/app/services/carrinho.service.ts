import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ItemCardapio } from '../models/item-cardapio.model';
import { ComandaService } from './comanda.service';
import { ApiService } from './api.service';
import { Comanda } from '../models/comanda.model';

@Injectable({
  providedIn: 'root'
})
export class CarrinhoService {
  // --- [NOVO] CONTROLE VISUAL DO CARRINHO (SIDEBAR) ---
  // Essas são as linhas que estão faltando no seu arquivo atual:
  private carrinhoAbertoSubject = new BehaviorSubject<boolean>(false);
  carrinhoAberto$ = this.carrinhoAbertoSubject.asObservable();

  private pratosCardapioSubject = new BehaviorSubject<ItemCardapio[]>([]);
  pratosCardapio$ = this.pratosCardapioSubject.asObservable();

  constructor(
    private comandaService: ComandaService,
    private apiService: ApiService
  ) {
    this.carregarCardapio();
  }

  // Método para abrir/fechar o carrinho visualmente
  // Esse método também está faltando no seu arquivo:
  toggleCarrinho() {
    this.carrinhoAbertoSubject.next(!this.carrinhoAbertoSubject.value);
  }

  private carregarCardapio() {
    this.apiService.listarPratos().subscribe(pratos => {
      const itens: ItemCardapio[] = pratos.map((p: any) => ({
        id: p.id,
        nome: p.nome,
        descricao: p.descricao,
        preco: Number(p.preco),
        imagem: p.imagem,
        categoria: p.categoria_nome || 'Geral',
        disponivel: p.ativo
      }));
      this.pratosCardapioSubject.next(itens);
    });
  }

  adicionarItem(prato: ItemCardapio, quantidade: number = 1, observacao: string = '') {
    let comandaAtual: Comanda | null = this.comandaService.comandaAtualValue;

    if (!comandaAtual) {
      const mesaId = localStorage.getItem('mesa-atual');
      const nomeCliente = localStorage.getItem('nome');

      if (!mesaId) {
        alert('Erro: Nenhuma mesa selecionada. Volte para o início.');
        return;
      }

      comandaAtual = {
        id: 0, 
        mesa_numero: Number(mesaId),
        nome_cliente: nomeCliente || 'Cliente',
        status: 'pendente',
        itens: [],
        criado_em: new Date().toISOString(),
        codigo_acesso: ''
      };
    }

    if (comandaAtual) {
        const itemExistente = comandaAtual.itens.find(i => i.prato === prato.id && i.observacao === observacao);

        if (itemExistente) {
          itemExistente.quantidade += quantidade;
        } else {
          comandaAtual.itens.push({
            prato: prato.id,
            prato_nome: prato.nome,
            quantidade: quantidade,
            observacao: observacao
          });
        }

        this.comandaService.setComanda(comandaAtual);
        
       
    }
  }

  getPratoPorId(id: number): ItemCardapio | undefined {
    return this.pratosCardapioSubject.value.find(p => p.id === id);
  }
}