import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { GerenteAuthService } from '../../services/gerente-auth.service';
import { ApiService, Mesa } from '../../services/api.service';

@Component({
  selector: 'app-gerente-mesas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './mesas.html',
  styleUrls: ['./mesas.scss']
})
export class GerenteMesasComponent implements OnInit {
  mesas: Mesa[] = [];
  carregando = true;
  mostrarFormulario = false;
  editando = false;
  
  mesaAtual: Partial<Mesa> = {
    numero: 1,
    capacidade: 4,
    status: 'disponivel',
    ativo: true
  };

  constructor(
    private authService: GerenteAuthService,
    private apiService: ApiService,
    private router: Router
  ) {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/gerente/login']);
    }
  }

  ngOnInit(): void {
    this.carregarMesas();
  }

  carregarMesas(): void {
    this.carregando = true;
    this.apiService.listarMesas().subscribe({
      next: (mesas) => {
        this.mesas = mesas.sort((a, b) => a.numero - b.numero);
        this.carregando = false;
      },
      error: (err) => {
        console.error('Erro ao carregar mesas:', err);
        this.carregando = false;
      }
    });
  }

  abrirFormulario(): void {
    this.mostrarFormulario = true;
    this.editando = false;
    this.mesaAtual = {
      numero: this.getProximoNumero(),
      capacidade: 4,
      status: 'disponivel',
      ativo: true
    };
  }

  editarMesa(mesa: Mesa): void {
    this.mostrarFormulario = true;
    this.editando = true;
    this.mesaAtual = { ...mesa };
  }

  fecharFormulario(): void {
    this.mostrarFormulario = false;
    this.editando = false;
  }

  salvarMesa(): void {
    if (!this.mesaAtual.numero || !this.mesaAtual.capacidade) {
      alert('Preencha todos os campos obrigatórios!');
      return;
    }

    if (this.editando && this.mesaAtual.id) {
      // Atualizar mesa existente
      this.apiService.atualizarMesa(this.mesaAtual.id, this.mesaAtual).subscribe({
        next: () => {
          this.carregarMesas();
          this.fecharFormulario();
        },
        error: (err) => {
          console.error('Erro ao atualizar mesa:', err);
          alert('Erro ao atualizar mesa. Verifique se o número já não está em uso.');
        }
      });
    } else {
      // Criar nova mesa
      this.apiService.criarMesa(this.mesaAtual).subscribe({
        next: () => {
          this.carregarMesas();
          this.fecharFormulario();
        },
        error: (err) => {
          console.error('Erro ao criar mesa:', err);
          alert('Erro ao criar mesa. Verifique se o número já não está em uso.');
        }
      });
    }
  }

  toggleMesaAtiva(mesa: Mesa): void {
    if (!mesa.id) return;
    
    const mesaAtualizada = { ...mesa, ativo: !mesa.ativo };
    this.apiService.atualizarMesa(mesa.id, mesaAtualizada).subscribe({
      next: () => {
        this.carregarMesas();
      },
      error: (err) => {
        console.error('Erro ao atualizar status da mesa:', err);
      }
    });
  }

  deletarMesa(id: number): void {
    if (confirm('Tem certeza que deseja deletar esta mesa?')) {
      this.apiService.deletarMesa(id).subscribe({
        next: () => {
          this.carregarMesas();
        },
        error: (err) => {
          console.error('Erro ao deletar mesa:', err);
          alert('Erro ao deletar mesa. Pode haver pedidos associados a ela.');
        }
      });
    }
  }

  getProximoNumero(): number {
    if (this.mesas.length === 0) return 1;
    const numeros = this.mesas.map(m => m.numero);
    return Math.max(...numeros) + 1;
  }

  getStatusLabel(status: string): string {
    const labels: any = {
      'disponivel': 'Disponível',
      'ocupada': 'Ocupada',
      'reservada': 'Reservada'
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }
}
