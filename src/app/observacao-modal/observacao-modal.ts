import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ItemCardapio } from '../models/item-cardapio.model';

@Component({
  selector: 'app-observacao-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './observacao-modal.html',
  styleUrls: ['./observacao-modal.scss']
})
export class ObservacaoModalComponent {
  @Input() item: ItemCardapio | null = null;
  @Output() confirmar = new EventEmitter<string>();
  @Output() cancelar = new EventEmitter<void>();

  observacao: string = '';

  onConfirmar() {
    this.confirmar.emit(this.observacao.trim());
    this.observacao = '';
  }

  onCancelar() {
    this.cancelar.emit();
    this.observacao = '';
  }

  formatarPreco(preco: number): string {
    return preco.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }
}

