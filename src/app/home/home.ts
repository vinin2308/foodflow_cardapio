import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

// Importações dos Serviços e Interfaces
import { ApiService, Mesa } from '../services/api.service'; 
import { ComandaService } from '../services/comanda.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './home.html',
  styleUrls: ['./home.scss']
})
export class HomeComponent implements OnInit {

  // Variáveis de Estado da Tela
  numeroPessoas: number = 1;
  codigoAcesso: string = '';
  modo: 'iniciar' | 'entrar' = 'iniciar';
  isComandaPrincipal: boolean = false;

  // Variáveis do Formulário de Início
  mesa: number | null = null;
  nome: string = '';

  // Lista para validação (Preenchida via API)
  mesasExistentes: number[] = []; 

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private comandaService: ComandaService
  ) {}

  ngOnInit() {
    // 1. Carrega as mesas válidas do backend assim que a tela abre
    this.carregarMesasParaValidacao();

    // 2. Verifica se veio número de mesa na URL (QR Code)
    this.route.queryParams.subscribe(params => {
      if (params['mesa']) {
        this.mesa = Number(params['mesa']);
      }
    });
  }

  // --- LÓGICA DE CARREGAMENTO (Executada no início) ---
  carregarMesasParaValidacao(): void {
    this.apiService.listarMesas().subscribe({
      next: (mesas: Mesa[]) => {
        // Filtra apenas mesas ativas e extrai o número
        this.mesasExistentes = mesas
          .filter(m => m.ativo)
          .map(m => Number(m.numero));
        
        console.log('Mesas ativas carregadas:', this.mesasExistentes);
      },
      error: (err) => {
        console.error('Erro ao carregar lista de mesas:', err);
      }
    });
  }

  // --- MODO 1: INICIAR COMANDA NOVA (CORRIGIDO) ---
  iniciarPedido(): void {
    const mesaId = Number(this.mesa); 

    // 1. Validação Básica
    if (!this.mesa || this.mesa < 1) {
      alert('Por favor, insira um número de mesa válido.');
      return;
    }

    // 2. Validação Otimista (Frontend)
    // Se a lista já carregou e a mesa não está nela, bloqueia imediatamente.
    if (this.mesasExistentes.length > 0 && !this.mesasExistentes.includes(mesaId)) {
      alert(`A Mesa ${mesaId} não está cadastrada ou não está ativa no sistema.`);
      return; 
    }

    const nomeCliente = this.nome || ''; 

    // 3. Validação Real (Backend)
    // Usamos 'criarComanda' para ter acesso ao Observable e esperar a resposta
    this.comandaService.criarComanda({ mesa: mesaId, nome_cliente: nomeCliente })
      .subscribe({
        next: (comanda) => {
          // SUCESSO: Backend confirmou que a mesa existe e criou o pedido.
          console.log('Comanda criada com sucesso:', comanda);

          // Atualiza o estado global da aplicação
          this.comandaService.setComanda(comanda);

          // 🚀 SOMENTE AQUI fazemos a navegação
          this.router.navigate(['/cardapio'], { queryParams: { mesa: mesaId, nome: nomeCliente } });
        },
        error: (err) => {
          // ERRO: Backend rejeitou (404 ou 400)
          console.error('Erro ao iniciar comanda:', err);
          
          const msgErro = err.error?.erro || 'Não foi possível iniciar a comanda. Verifique se a mesa existe.';
          alert(msgErro);
          
          // NADA ACONTECE (O usuário continua na Home)
        }
      });
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
        alert('Erro ao validar código. Verifique sua conexão.');
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

    // Atualiza o estado global da comanda (BehaviorSubject) se existir
    const comandaAtual = this.comandaService.comandaAtualValue; 
    
    if (comandaAtual) {
        comandaAtual.nome_cliente = nome;
        comandaAtual.mesa_numero = mesa;
        this.comandaService.setComanda(comandaAtual);
    }
  }
}