import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Necessário para *ngIf e *ngFor
import { FormsModule } from '@angular/forms';   // Necessário para o [(ngModel)] da busca

// ... interfaces (Mesa, ItemPedido) continuam iguais ...
interface ItemPedido {
  nome: string;
  quantidade: number;
  preco: number;
}

interface Mesa {
  id: number;
  numero: number;
  status: 'pendente' | 'efetuado' | 'liberada' | 'aguardando';
  valorTotal: number;
  itens: ItemPedido[];
  garcom: string;
  tempo: string;
}

@Component({
  selector: 'app-garcom',
  standalone: true, // <--- ISSO É IMPORTANTE
  imports: [CommonModule, FormsModule], // <--- AQUI VOCÊ IMPORTA OS MÓDULOS
  templateUrl: './garcom.html',
  styleUrls: ['./garcom.scss']
})
export class GarcomComponent implements OnInit {
  
  termoBusca: string = '';
  filtroStatus: string = 'todos';
  mesaSelecionada: Mesa | null = null;

  // Dados Mockados (Exemplo baseado na imagem)
  mesas: Mesa[] = [
    {
      id: 1, numero: 1, status: 'pendente', valorTotal: 58.90, garcom: 'João', tempo: '45 min',
      itens: [{ nome: 'X-Burger', quantidade: 1, preco: 25.00 }, { nome: 'Coca-Cola', quantidade: 2, preco: 16.95 }]
    },
    {
      id: 2, numero: 2, status: 'efetuado', valorTotal: 102.00, garcom: 'Maria', tempo: '1h 10min',
      itens: [{ nome: 'Picanha Chapa', quantidade: 1, preco: 85.00 }, { nome: 'Suco Natural', quantidade: 2, preco: 17.00 }]
    },
    {
      id: 3, numero: 3, status: 'liberada', valorTotal: 0.00, garcom: '-', tempo: '-',
      itens: []
    },
    {
      id: 4, numero: 4, status: 'aguardando', valorTotal: 15.00, garcom: 'Pedro', tempo: '5 min',
      itens: [{ nome: 'Cerveja Artesanal', quantidade: 1, preco: 15.00 }]
    }
  ];

  mesasFiltradas: Mesa[] = [];

  constructor() { }

  ngOnInit(): void {
    this.atualizarLista();
  }

  // Lógica de Busca e Filtro
  atualizarLista(): void {
    this.mesasFiltradas = this.mesas.filter(mesa => {
      const matchStatus = this.filtroStatus === 'todos' || mesa.status === this.filtroStatus;
      const matchBusca = mesa.numero.toString().includes(this.termoBusca) || 
                         mesa.garcom.toLowerCase().includes(this.termoBusca.toLowerCase());
      return matchStatus && matchBusca;
    });
  }

  filtrarPor(status: string): void {
    this.filtroStatus = status;
    this.atualizarLista();
  }

  // Controle do Modal/Drawer
  abrirDetalhes(mesa: Mesa): void {
    this.mesaSelecionada = mesa;
  }

  fecharDetalhes(): void {
    this.mesaSelecionada = null;
  }

  // Ações dos Botões (Placeholders)
  adicionarItem(): void {
    console.log('Adicionar item na mesa', this.mesaSelecionada?.numero);
  }

  confirmarPagamento(): void {
    if(this.mesaSelecionada) {
      this.mesaSelecionada.status = 'efetuado';
      this.atualizarLista();
    }
  }

  liberarMesa(): void {
    if(this.mesaSelecionada) {
      this.mesaSelecionada.status = 'liberada';
      this.mesaSelecionada.valorTotal = 0;
      this.mesaSelecionada.itens = [];
      this.atualizarLista();
      this.fecharDetalhes();
    }
  }
  
  // Helper para classes CSS
  getStatusClass(status: string): string {
    switch(status) {
      case 'pendente': return 'bg-dark-red';
      case 'efetuado': return 'bg-green'; // Usando verde conforme pedido no texto
      case 'liberada': return 'bg-golden';
      case 'aguardando': return 'bg-blue';
      default: return 'bg-gray';
    }
  }
  
  getStatusLabel(status: string): string {
    switch(status) {
      case 'pendente': return 'Pagamento pendente';
      case 'efetuado': return 'Efetuado';
      case 'liberada': return 'Mesa liberada';
      case 'aguardando': return 'Confirmar pedido';
      default: return status;
    }
  }
}