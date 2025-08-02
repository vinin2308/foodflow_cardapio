import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Comanda } from '../models/item-cardapio.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cozinha',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cozinha.html',
  styleUrls: ['./cozinha.scss'],
})
export class CozinhaComponent {
  pedidos: (Comanda & { tempoEstimado?: number; tempoEstimadoConfirmado?: boolean })[] = [];

  constructor() {
    this.pedidos = [
      {
        id: '1',
        mesa: '5',
        itens: [
          {
            id: 'a',
            item: { id: 1, nome: 'Hambúrguer', descricao: '', preco: 25, categoria: 'pratos-principais' },
            quantidade: 2
          }
        ],
        total: 50,
        status: 'enviada',
        criadaEm: new Date(),
        tempoEstimado: 1,
        tempoEstimadoConfirmado: false
      }
    ];
  }

  confirmarTempo(pedido: any) {
    if (pedido.tempoEstimado && pedido.tempoEstimado > 0) {
      pedido.tempoEstimadoConfirmado = true;
    }
  }
}
