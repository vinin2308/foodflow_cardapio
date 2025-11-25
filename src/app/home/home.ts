import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { ApiService } from '../services/api.service'; 
import { ComandaService } from '../services/comanda.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './home.html',
  styleUrls: ['./home.scss']
})
export class HomeComponent implements OnInit {
  mesa: string = '';
  nome: string = '';
  numeroPessoas: number = 1;
  codigoAcesso: string = '';
  modo: 'iniciar' | 'entrar' = 'iniciar';
  isComandaPrincipal: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private comandaService: ComandaService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['mesa']) {
        this.mesa = params['mesa'];
      }
    });
  }

  // --- MODO 1: INICIAR COMANDA NOVA ---
  iniciarPedido() {
    const mesaNumero = Number(this.mesa);
    if (isNaN(mesaNumero) || mesaNumero <= 0) {
      alert('Por favor, insira um número de mesa válido.');
      return;
    }

    if (!this.nome) {
      alert('Por favor, insira seu nome.');
      return;
    }

    localStorage.clear(); 

    // Salva dados apenas localmente. O pedido nasce no Carrinho.
    this.salvarDadosSessao(mesaNumero, this.nome, '');

    this.router.navigate(['/cardapio']);
  }

  // --- MODO 2: ENTRAR EM COMANDA EXISTENTE ---
  entrarPorCodigo() {
    if (!this.codigoAcesso.trim()) {
      alert('Digite o código de acesso.');
      return;
    }

    this.apiService.consultarStatusPedido(this.codigoAcesso).subscribe({
      next: (dados: any) => {
        const pedido = Array.isArray(dados) ? dados[0] : dados;

        if (pedido) {
          const mesaDoPedido = pedido.mesa_numero || pedido.mesa;
          
          this.salvarDadosSessao(mesaDoPedido, this.nome, this.codigoAcesso);
          
          localStorage.setItem('pedido_ativo', this.codigoAcesso);

          alert(`Vinculado à mesa ${mesaDoPedido} com sucesso!`);
          this.router.navigate(['/cardapio']);
        } else {
          alert('Código não encontrado ou comanda já fechada.');
        }
      },
      error: (err) => {
        console.error(err);
        alert('Erro ao validar código.');
      }
    });
  }

  // --- Helper para salvar no navegador ---
  private salvarDadosSessao(mesa: number, nome: string, codigo: string) {
    localStorage.setItem('mesa-atual', mesa.toString());
    localStorage.setItem('nome', nome);
    
    if (codigo) {
      localStorage.setItem('codigo_acesso_vinculado', codigo);
    }

    if (this.comandaService) {
        // CORREÇÃO AQUI: Removi o 'get' e os parênteses '()'
        const comandaAtual = this.comandaService.comandaAtualValue; 
        
        if (comandaAtual) {
            comandaAtual.nome_cliente = nome;
            comandaAtual.mesa_numero = mesa;
            this.comandaService.setComanda(comandaAtual);
        }
    }
  }
}