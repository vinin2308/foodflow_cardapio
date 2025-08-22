import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Comanda } from '../models/carrinho.model';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private socket: WebSocket | null = null;
  private comandaSubject = new Subject<Comanda>();
  comanda$ = this.comandaSubject.asObservable();

  conectar(codigoComanda: string): void {
    if (this.socket) return; // já conectado
    this.socket = new WebSocket(`ws://localhost:8000/ws/comanda/${codigoComanda}/`);

    this.socket.onmessage = (event) => {
      const comandaAtualizada: Comanda = JSON.parse(event.data);
      this.comandaSubject.next(comandaAtualizada);
    };

    this.socket.onclose = () => {
      console.log('WebSocket desconectado');
      this.socket = null;
    };
  }

  enviarComandaAtualizada(comanda: Comanda): void {
    this.socket?.send(JSON.stringify({ action: 'atualizar', comanda }));
  }

  desconectar(): void {
    this.socket?.close();
  }
}
