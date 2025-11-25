import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';

export interface ItemPedido {
  id: number;
  prato_nome: string;
  quantidade: number;
  preco_unitario: number;
  observacao: string;
}

export interface Pedido {
  id: number;
  codigo_acesso: string;
  status: string;
  itens: ItemPedido[];
  criado_por_nome: string;
}

export interface Mesa {
  id: number;
  numero: number;
  status: 'disponivel' | 'ocupada' | 'reservada';
  valor_total_mesa: number;
  pedidos: Pedido[];
  garcom?: string;
  solicitou_atencao: boolean; // Importante para o alerta amarelo
}

@Component({
  selector: 'app-garcom',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './garcom.html',
  styleUrls: ['./garcom.scss']
})
export class GarcomComponent implements OnInit, OnDestroy {
  
  termoBusca: string = '';
  filtroStatus: string = 'todos';
  mesaSelecionada: Mesa | null = null;
  mesas: Mesa[] = [];
  mesasFiltradas: Mesa[] = [];
  private pollingInterval: any;

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    this.carregarDados();
    this.pollingInterval = setInterval(() => this.carregarDados(), 5000);
  }

  ngOnDestroy(): void {
    if (this.pollingInterval) clearInterval(this.pollingInterval);
  }

  carregarDados(): void {
    this.apiService.listarMesas().subscribe({
      next: (dados: any[]) => {
        this.mesas = dados as Mesa[]; 
        this.atualizarLista();
        if (this.mesaSelecionada) {
          const atualizada = this.mesas.find(m => m.id === this.mesaSelecionada?.id);
          if (atualizada) this.mesaSelecionada = atualizada;
        }
      },
      error: (err) => console.error('Erro ao buscar mesas:', err)
    });
  }

  atualizarLista(): void {
    this.mesasFiltradas = this.mesas.filter(mesa => {
      const matchStatus = this.filtroStatus === 'todos' || mesa.status === this.filtroStatus;
      const numeroStr = mesa.numero ? mesa.numero.toString() : ''; 
      return matchStatus && numeroStr.includes(this.termoBusca);
    });
  }

  filtrarPor(status: string): void {
    this.filtroStatus = status;
    this.atualizarLista();
  }

  abrirDetalhes(mesa: Mesa): void { this.mesaSelecionada = mesa; }
  fecharDetalhes(): void { this.mesaSelecionada = null; }

  // --- AÇÕES ---

  atenderChamado(): void {
    if (!this.mesaSelecionada) return;
    this.apiService.atenderChamado(this.mesaSelecionada.id).subscribe(() => {
      this.carregarDados();
      this.fecharDetalhes(); // Fecha o modal após atender
    });
  }

  confirmarEntrega(pedido: Pedido): void {
    this.apiService.confirmarEntrega(pedido.id).subscribe(() => {
      alert(`Pedido #${pedido.id} entregue!`);
      this.carregarDados();
    });
  }

  liberarMesa(): void {
    if (this.mesaSelecionada && confirm(`Liberar Mesa ${this.mesaSelecionada.numero}?`)) {
      this.apiService.liberarMesa(this.mesaSelecionada.id).subscribe(() => {
        this.carregarDados();
        this.fecharDetalhes();
      });
    }
  }

  // Apenas para teste (Botão Cinza)
  simularChamado(): void {
    if (!this.mesaSelecionada) return;
    this.apiService.chamarGarcom(this.mesaSelecionada.id).subscribe(() => {
      alert('Chamado simulado! Veja o card laranja.');
      this.carregarDados();
    });
  }

  // --- HELPERS VISUAIS ---

  temPedidoPronto(mesa: Mesa): boolean {
    return mesa.pedidos ? mesa.pedidos.some(p => p.status === 'pronto') : false;
  }

  getPedidosProntos(mesa: Mesa): Pedido[] {
    return mesa.pedidos ? mesa.pedidos.filter(p => p.status === 'pronto') : [];
  }

  getItensDaMesa(mesa: Mesa): ItemPedido[] {
    if (!mesa.pedidos) return [];
    return mesa.pedidos.flatMap(pedido => pedido.itens);
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'ocupada': return 'bg-dark-red';
      case 'disponivel': return 'bg-green';
      case 'reservada': return 'bg-golden';
      default: return 'bg-gray';
    }
  }
  
  getStatusLabel(status: string): string {
    switch(status) {
      case 'ocupada': return 'Ocupada';
      case 'disponivel': return 'Livre';
      default: return status;
    }
  }
}