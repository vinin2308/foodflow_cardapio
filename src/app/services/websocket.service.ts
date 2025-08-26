import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { ComandaService } from './comanda.service';
import { Comanda } from '../models/comanda.model';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private socket: WebSocket | null = null;
  private comandaSubject = new Subject<Comanda>();
  comanda$ = this.comandaSubject.asObservable();

  constructor(private comandaService: ComandaService) {} 

  conectar(codigoComanda: string): void {
    if (this.socket) return;
    this.socket = new WebSocket(`ws://localhost:8000/ws/comanda/${codigoComanda}/`);

    this.socket.onmessage = (event) => {
      const msg = JSON.parse(event.data); 
      if (msg.tipo === 'atualizacao_comanda') {
        const comandaAtualizada = msg.dados;
        const comandaLocal = this.comandaService.comandaAtualValue;
        this.comandaSubject.next(comandaAtualizada);
        this.comandaService.setComanda(comandaAtualizada);

        if (comandaLocal) {
          const itensMesclados = [...comandaAtualizada.itens];
          for (const item of comandaLocal.itens) {
            if (!itensMesclados.find(i => i.prato === item.prato && i.observacao === item.observacao)) {
              itensMesclados.push(item);
            }
          }
          this.comandaService.setComanda({ ...comandaAtualizada, itens: itensMesclados });
        } else {
          this.comandaService.setComanda(comandaAtualizada);
        }
      }
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
