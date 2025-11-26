import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { ComandaService } from './comanda.service';
import { Comanda, ItemComanda } from '../models/comanda.model';
import { environment } from '../../enviroments/enviroment'; 

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private socket: WebSocket | null = null;
  private comandaSubject = new Subject<Comanda>();
  comanda$: Observable<Comanda> = this.comandaSubject.asObservable();

  private reconnectAttempts = 0;
  private codigoComanda = '';
  private erroCallback?: (mensagem: string) => void;

  constructor(private comandaService: ComandaService) {}

  conectar(codigoComanda: string, onErro?: (mensagem: string) => void): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) return;

    this.codigoComanda = codigoComanda;
    this.erroCallback = onErro;

    this.socket = new WebSocket(`${environment.wsUrl}/comanda/${codigoComanda}/`);

    this.socket.onopen = () => {
      this.log('WebSocket conectado');
      this.reconnectAttempts = 0;
    };

    this.socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.tipo === 'erro') {
          this.log('Erro recebido:', msg.mensagem);
          this.erroCallback?.(msg.mensagem);
          return;
        }

        if (msg.tipo === 'atualizacao_comanda') {
          const comandaAtualizada: Comanda = msg.dados;
          this.atualizarComandaLocal(comandaAtualizada);
        }
      } catch (e) {
        this.log('Erro ao processar mensagem:', e);
      }
    };

    this.socket.onclose = () => {
      this.log('WebSocket desconectado');
      this.socket = null;
      this.reconectar();
    };

    this.socket.onerror = (error) => {
      this.log('Erro no WebSocket:', error);
    };
  }

  private atualizarComandaLocal(comandaAtualizada: Comanda): void {
    const comandaLocal = this.comandaService.comandaAtualValue;

    const novaComanda = comandaLocal
      ? {
          ...comandaAtualizada,
          itens: this.mesclarItens(comandaAtualizada.itens ?? [], comandaLocal.itens ?? [])
        }
      : comandaAtualizada;

    this.comandaService.setComanda(novaComanda);
    this.comandaSubject.next(novaComanda);
  }

  private mesclarItens(recebidos: ItemComanda[], locais: ItemComanda[]): ItemComanda[] {
    const chave = (item: ItemComanda) => `${item.prato}_${item.observacao}`;
    const mapa = new Map(recebidos.map(item => [chave(item), item]));

    for (const item of locais) {
      const key = chave(item);
      if (!mapa.has(key)) {
        mapa.set(key, item);
      }
    }

    return Array.from(mapa.values());
  }

  private reconectar(): void {
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
    this.reconnectAttempts += 1;

    setTimeout(() => {
      this.log(`Tentando reconectar... (${this.reconnectAttempts})`);
      this.conectar(this.codigoComanda, this.erroCallback);
    }, delay);
  }

  enviarComandaAtualizada(comanda: Comanda): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      this.log('WebSocket não está pronto para enviar');
      return;
    }

    this.socket.send(JSON.stringify({ action: 'atualizar', comanda }));
  }

  desconectar(): void {
    this.socket?.close();
    this.socket = null;
  }

  private log(...args: any[]): void {
    console.log('[WebSocketService]', ...args);
  }
}