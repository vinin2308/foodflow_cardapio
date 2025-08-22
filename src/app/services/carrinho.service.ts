import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ItemCardapio } from '../models/item-cardapio.model';
import { Comanda, ItemCarrinho } from '../models/carrinho.model';
import { PedidoPayload } from '../models/pedidos.model';
import { Order } from '../models/ordel.model';
import { WebSocketService } from './websocket.service';

@Injectable({ providedIn: 'root' })
export class CarrinhoService {
  private apiUrl = 'http://localhost:8000/api/pedidos/';
  private comandaAtual: Comanda | null = null;
  private comandaSubject = new BehaviorSubject<Comanda | null>(null);
  private pratosCardapioSubject = new BehaviorSubject<ItemCardapio[]>([]);
  private carrinhoAbertoSubject = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient, private wsService: WebSocketService) {
    this.carregarComandaLocal();
    this.carregarPratosCardapio();

    // escuta atualizações em tempo real via WebSocket
    this.wsService.comanda$.subscribe((comandaAtualizada) => {
      if (comandaAtualizada?.mesa === this.comandaAtual?.mesa) {
        this.comandaAtual = comandaAtualizada;
        this.comandaSubject.next(this.comandaAtual);
        this.salvarComandaLocal();
      }
    });
  }

  // -------- GETTERS --------
  get comanda$(): Observable<Comanda | null> {
    return this.comandaSubject.asObservable();
  }
  get pratosCardapio$(): Observable<ItemCardapio[]> {
    return this.pratosCardapioSubject.asObservable();
  }
  get carrinhoAberto$(): Observable<boolean> {
    return this.carrinhoAbertoSubject.asObservable();
  }
  get comandaAtualValue(): Comanda | null {
    return this.comandaAtual;
  }

  // -------- CARDÁPIO --------
  carregarPratosCardapio(): void {
    this.http.get<ItemCardapio[]>('http://localhost:8000/api/pratos/')
      .subscribe(pratos => this.pratosCardapioSubject.next(pratos));
  }

  // -------- COMANDA --------
  iniciarComandaPrincipal(mesa: number, nomeCliente?: string): void {
    localStorage.removeItem(`comanda-${mesa}`);
    localStorage.removeItem('mesa-atual');

    const nome = nomeCliente || localStorage.getItem('nome') || '';
    const comandaId = `mesa-${mesa}-${Date.now()}`;

    this.comandaAtual = {
      id: comandaId,
      mesa,
      nome_cliente: nome,
      status: 'pendente',
      itens: [],
      eh_principal: true
    };

    localStorage.setItem('mesa-atual', String(mesa));
    this.salvarComandaLocal();
    this.comandaSubject.next(this.comandaAtual);
  }

  iniciarComandaVinculada(mesa: number, codigoAcesso: string, nomeCliente?: string): void {
    localStorage.removeItem(`comanda-${mesa}`);
    localStorage.removeItem('mesa-atual');

    const nome = nomeCliente || localStorage.getItem('nome') || '';
    const comandaId = `mesa-${mesa}-${Date.now()}`;

    this.comandaAtual = {
      id: comandaId,
      mesa,
      nome_cliente: nome,
      status: 'pendente',
      itens: [],
      codigo_acesso: codigoAcesso,
      eh_principal: false
    };

    localStorage.setItem('mesa-atual', String(mesa));
    this.salvarComandaLocal();
    this.comandaSubject.next(this.comandaAtual);

    this.wsService.conectar(codigoAcesso.trim());
  }

  conectarComanda(mesa: number): boolean {
    const comandaExistente = this.buscarComandaPorMesa(mesa);
    if (comandaExistente) {
      this.comandaAtual = comandaExistente;
      this.comandaSubject.next(this.comandaAtual);
      if (this.comandaAtual.codigo_acesso) {
        this.wsService.conectar(this.comandaAtual.codigo_acesso.trim());
      }
      return true;
    }
    return false;
  }

  adicionarItem(item: ItemCardapio, quantidade: number, observacao: string = ''): void {
    if (!this.comandaAtual) return;

    const itemExistente = this.comandaAtual.itens.find(
      i => i.prato === item.id && i.observacao === observacao
    );

    if (itemExistente) {
      itemExistente.quantidade += quantidade;
    } else {
      this.comandaAtual.itens.push({ prato: item.id, quantidade, observacao });
    }

    this.atualizarComandas(this.comandaAtual);
    this.wsService.enviarComandaAtualizada(this.comandaAtual);
  }

  removerItem(pratoId: number, observacao: string = ''): void {
    if (!this.comandaAtual) return;

    this.comandaAtual.itens = this.comandaAtual.itens.filter(
      item => !(item.prato === pratoId && item.observacao === observacao)
    );

    this.atualizarComandas(this.comandaAtual);
    this.wsService.enviarComandaAtualizada(this.comandaAtual);
  }

  atualizarComandas(update: Partial<Comanda>): void {
    if (!this.comandaAtual) return;

    this.comandaAtual = { ...this.comandaAtual, ...update };
    this.comandaSubject.next(this.comandaAtual);
    this.salvarComandaLocal();
  }

  // -------- UI --------
  toggleCarrinho(): void {
    this.carrinhoAbertoSubject.next(!this.carrinhoAbertoSubject.value);
  }

  abrirCarrinho(): void { this.carrinhoAbertoSubject.next(true); }
  fecharCarrinho(): void { this.carrinhoAbertoSubject.next(false); }

  // -------- BACKEND --------
  confirmarPedidoNoCozinha(): Observable<Order> {
    if (!this.comandaAtual) throw new Error('Comanda não definida.');

    const payload: PedidoPayload = {
      mesa: this.comandaAtual.mesa,
      nome_cliente: this.comandaAtual.nome_cliente,
      status: this.comandaAtual.status,
      itens: this.comandaAtual.itens.map(i => ({
        prato: i.prato!,
        quantidade: i.quantidade,
        observacao: i.observacao || ''
      }))
    };

    return this.http.post<Order>(this.apiUrl, payload);
  }

  gerarCodigoAcesso(): Observable<string> {
    return new Observable(observer => {
      const mesaId = this.comandaAtual?.mesa;

      if (!mesaId || isNaN(mesaId)) {
        observer.error('Mesa inválida ou não definida.');
        return;
      }

      this.http.post<{ codigo_acesso: string }>('http://localhost:8000/api/iniciar-comanda/', {
        mesa: mesaId
      }).subscribe({
        next: res => {
          if (!this.comandaAtual) return;
          this.comandaAtual.codigo_acesso = res.codigo_acesso;
          this.atualizarComandas(this.comandaAtual);
          this.wsService.conectar(res.codigo_acesso.trim());
          observer.next(res.codigo_acesso);
          observer.complete();
        },
        error: err => observer.error(err)
      });
    });
  }

  // -------- LOCAL STORAGE --------
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

        if (this.comandaAtual?.codigo_acesso) {
          this.wsService.conectar(this.comandaAtual.codigo_acesso.trim());
        }
      }
    }
  }

  private buscarComandaPorMesa(mesa: number): Comanda | null {
    const comandaSalva = localStorage.getItem(`comanda-${mesa}`);
    return comandaSalva ? JSON.parse(comandaSalva) : null;
  }
  inicializarComanda(mesa: number, nomeCliente?: string): void {
  const comandaSalva = this.buscarComandaPorMesa(mesa);

  if (comandaSalva) {
    this.comandaAtual = comandaSalva;
    this.comandaSubject.next(this.comandaAtual);

    if (comandaSalva.codigo_acesso) {
      this.wsService.conectar(comandaSalva.codigo_acesso.trim());
    }
    return;
  }

  const codigoSalvo = localStorage.getItem('codigo-acesso');
  const nome = nomeCliente || localStorage.getItem('nome') || '';

  if (codigoSalvo) {
    this.iniciarComandaVinculada(mesa, codigoSalvo, nome);
  } else {
    this.iniciarComandaPrincipal(mesa, nome);
  }
}
}
