import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CarrinhoService } from '../services/carrinho';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.html',
  styleUrls: ['./home.scss']
})
export class HomeComponent implements OnInit {
  mesa: string = '';
  nome: string = '';
  numeroPessoas: number = 1;
  isPrimeiroAcesso: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private carrinhoService: CarrinhoService
  ) {}

  ngOnInit() {
    // Verificar se a mesa foi passada via QR Code (query parameter)
    this.route.queryParams.subscribe(params => {
      if (params['mesa']) {
        this.mesa = params['mesa'];
        this.onMesaChange();
      }
    });
  }

  onMesaChange() {
    this.verificarPrimeiroAcesso();
  }

  verificarPrimeiroAcesso() {
    if (this.mesa && this.mesa.trim() !== '') {
      const comandaExistente = localStorage.getItem(`comanda-${this.mesa}`);
      this.isPrimeiroAcesso = !comandaExistente;
    } else {
      this.isPrimeiroAcesso = true;
    }
  }

  iniciarPedido() {
    if (!this.mesa) {
      alert('Por favor, informe o número da mesa.');
      return;
    }

    localStorage.setItem('mesa-atual', this.mesa);
    localStorage.setItem('nome', this.nome);

    const mesaNumero = Number(this.mesa);
    if (isNaN(mesaNumero)) {
      alert('Número da mesa inválido.');
      return;
    }

    this.carrinhoService.iniciarComanda(mesaNumero);
    this.salvarMesaAtiva();

    console.log('Iniciando pedido para mesa:', this.mesa);
    console.log('Nome:', this.nome);
    if (this.isPrimeiroAcesso) {
      console.log('Número de pessoas:', this.numeroPessoas);
    }

    this.router.navigate(['/cardapio'], {
      queryParams: {
        mesa: this.mesa,
        nome: this.nome,
        pessoas: this.isPrimeiroAcesso ? this.numeroPessoas : undefined
      }
    });
  }

  entrarPedidoExistente() {
    if (!this.mesa) {
      alert('Por favor, informe o número da mesa.');
      return;
    }

    const mesaNumero = Number(this.mesa);
    if (isNaN(mesaNumero)) {
      alert('Número da mesa inválido.');
      return;
    }

    localStorage.setItem('mesa-atual', this.mesa);

    const conectado = this.carrinhoService.conectarComanda(mesaNumero);

    if (conectado) {
      console.log('Entrando em pedido existente da mesa:', this.mesa);
      console.log('Nome:', this.nome);

      this.router.navigate(['/cardapio'], {
        queryParams: {
          mesa: this.mesa,
          nome: this.nome
        }
      });
    } else {
      alert('Não há pedido ativo para esta mesa. Inicie um novo pedido.');
    }
  }

  private salvarMesaAtiva() {
    const mesasExistentes = localStorage.getItem('mesas_ativas');
    let mesas: string[] = [];

    if (mesasExistentes) {
      mesas = JSON.parse(mesasExistentes);
    }

    if (!mesas.includes(this.mesa)) {
      mesas.push(this.mesa);
      localStorage.setItem('mesas_ativas', JSON.stringify(mesas));
    }
  }
}
