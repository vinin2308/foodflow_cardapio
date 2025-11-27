import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service'; 

@Component({
  selector: 'app-acompanhar-pedido',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './acompanhar-pedido.html',
  styleUrls: ['./acompanhar-pedido.scss']
})
export class AcompanharPedidoComponent implements OnInit, OnDestroy {
  pedido: any = null;
  intervalo: any;
  codigo: string | null = null;

  statusProgress: any = {
    'pendente': 10,
    'em_preparo': 50,
    'pronto': 90,
    'entregue': 100
  };

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit() {
    this.codigo = localStorage.getItem('pedido_ativo');
    
    console.log('Código recuperado:', this.codigo); // Log para conferência

    if (this.codigo) {
      this.carregarDados();
      // Polling a cada 5 segundos
      this.intervalo = setInterval(() => this.carregarDados(), 5000);
    } else {
      // Pequeno delay de segurança antes de expulsar para a home
      console.warn('Código não encontrado, redirecionando...');
      setTimeout(() => {
        this.router.navigate(['/']);
      }, 1000);
    }
  }

  ngOnDestroy() {
    if (this.intervalo) clearInterval(this.intervalo);
  }

  carregarDados() {
    if (!this.codigo) return;
    
    this.apiService.consultarStatusPedido(this.codigo).subscribe({
      // ADICIONADO ': any' PARA EVITAR ERRO DE TIPAGEM
      next: (dados: any) => {
        if (Array.isArray(dados) && dados.length > 0) {
          this.pedido = dados[0];
        }
      },
      // ADICIONADO ': any' PARA EVITAR ERRO DE TIPAGEM
      error: (err: any) => console.error('Erro ao buscar pedido', err)
    });
  }

  getStatusLabel(status: string): string {
    const map: any = {
      'pendente': 'Recebemos seu pedido! Aguarde a confirmação.',
      'em_preparo': 'A cozinha está preparando seu prato 🔥',
      'pronto': 'Seu pedido está PRONTO! 🔔',
      'entregue': 'Pedido Entregue. Bom apetite! 😋'
    };
    return map[status] || 'Status desconhecido';
  }

  getProgressWidth(): string {
    if (!this.pedido) return '0%';
    return (this.statusProgress[this.pedido.status] || 5) + '%';
  }

  voltarCardapio() {
    if (this.pedido && this.pedido.status === 'entregue') {
      localStorage.removeItem('pedido_ativo');
    }
    this.router.navigate(['/cardapio']);
  }
}