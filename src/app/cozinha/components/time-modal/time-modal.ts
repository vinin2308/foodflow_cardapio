import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Order } from '../../../models/ordel.model';

@Component({
  selector: 'app-time-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './time-modal.html',
  styleUrls: ['./time-modal.scss']
})
export class TimeModalComponent implements OnChanges {
  @Input() isVisible: boolean = false;
  @Input() order: Order | null = null;
  @Input() isFinalizing: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<{ pedidoId: number; tempoEstimado: number }>();

  prepTime: number = 15;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['order'] && this.order) {
      this.prepTime = this.order?.tempo_estimado ?? 15;
    }
  }

  adjustTime(minutes: number): void {
    this.prepTime += minutes;
    if (this.prepTime < 1) this.prepTime = 1;
    if (this.prepTime > 120) this.prepTime = 120;
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  onClose(): void {
    this.close.emit();
  }

  onConfirm(): void {
    if (this.order) {
      this.confirm.emit({
        pedidoId: this.order.id,
        tempoEstimado: this.prepTime
      });
    }
  }
}
