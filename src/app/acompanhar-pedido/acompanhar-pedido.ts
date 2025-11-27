import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router'; // Adicionado ActivatedRoute
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
    private router: Router,
    private route: ActivatedRoute // Adicionado
  ) {}

  ngOnInit() {
    // Lógica robusta de busca do código (Rota > Query > Storage)
    const idQuery = this.route.snapshot.queryParamMap.get('id');
    const idMatrix = this.route.snapshot.paramMap.get('id');

    if (idQuery) {
        this.codigo = idQuery;
    } else if (idMatrix) {
        this.codigo = idMatrix;
    } else {
        this.codigo = localStorage.getItem('pedido_ativo');
    }

    if (this.codigo) {
      this.carregarDados();
      this.intervalo = setInterval(() => this.carregarDados(), 5000);
    } else {
      console.warn('Código não encontrado, redirecionando...');
      setTimeout(() => {
        this.router.navigate(['/cardapio']);
      }, 1000);
    }
  }

  ngOnDestroy() {
    if (this.intervalo) clearInterval(this.intervalo);
  }

  carregarDados() {
    if (!this.codigo) return;
    
    this.apiService.consultarStatusPedido(this.codigo).subscribe({
      next: (dados: any) => {
        if (Array.isArray(dados) && dados.length > 0) {
          this.pedido = dados[0];
          
          // ATUALIZA O LOCAL STORAGE para o monitor flutuante
          if (this.pedido && this.pedido.status !== 'entregue') {
             localStorage.setItem('pedido_em_background', this.pedido.codigo_acesso);
             localStorage.setItem('status_pedido_background', this.pedido.status);
             if(this.pedido.tempo_estimado) {
                localStorage.setItem('tempo_estimado_background', String(this.pedido.tempo_estimado));
             } else {
                localStorage.removeItem('tempo_estimado_background');
             }
          }
        }
      },
      error: (err: any) => console.error('Erro ao buscar pedido', err)
    });
  }

  getStatusLabel(status: string): string {
    const map: any = {
      'pendente': 'Aguardando confirmação...',
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

  // Dentro de src/app/acompanhar-pedido/acompanhar-pedido.component.ts

voltarCardapio() {
    if (this.pedido && this.pedido.status !== 'entregue') {
        // Se ainda está ativo/em preparo, salva para monitoramento
        localStorage.setItem('pedido_em_background', this.pedido.codigo_acesso);
        localStorage.setItem('status_pedido_background', this.pedido.status);
        if(this.pedido.tempo_estimado) {
             localStorage.setItem('tempo_estimado_background', String(this.pedido.tempo_estimado));
        } else {
            localStorage.removeItem('tempo_estimado_background');
        }
        localStorage.removeItem('pedido_ativo');
    } else {
        // AÇÃO CRÍTICA: Se o pedido foi entregue/finalizado, LIMPA TODAS AS CHAVES DE MONITORAMENTO
        localStorage.removeItem('pedido_ativo');
        localStorage.removeItem('pedido_em_background');
        localStorage.removeItem('status_pedido_background');
        localStorage.removeItem('tempo_estimado_background');
    }
    
    this.router.navigate(['/cardapio']);
}
}