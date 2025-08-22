import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CarrinhoService } from '../services/carrinho.service';
import { HttpClientModule, HttpClient } from '@angular/common/http';

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
  isPrimeiroAcesso: boolean = true;
  isComandaPrincipal: boolean = false;
  modo: 'iniciar' | 'entrar' = 'iniciar';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private carrinhoService: CarrinhoService,
    private http: HttpClient
  ) {}

  ngOnInit() {
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
    const mesaNumero = Number(this.mesa);
    if (isNaN(mesaNumero)) {
      alert('Número da mesa inválido.');
      return;
    }

    this.codigoAcesso = '';
    this.isComandaPrincipal = true;

    localStorage.setItem('mesa-atual', this.mesa);
    localStorage.setItem('nome', this.nome);

    this.carrinhoService.iniciarComandaPrincipal(mesaNumero);
    this.salvarMesaAtiva();

    this.router.navigate(['/cardapio'], {
      queryParams: {
        mesa: this.mesa,
        nome: this.nome,
        pessoas: this.isPrimeiroAcesso ? this.numeroPessoas : undefined,
        principal: true
      }
    });
  }

  entrarPorCodigo() {
  const mesaNumero = Number(this.mesa);
  if (isNaN(mesaNumero)) {
    alert('Número da mesa inválido.');
    return;
  }

  this.isComandaPrincipal = false;

  localStorage.setItem('mesa-atual', String(mesaNumero));
  localStorage.setItem('nome', this.nome);

  // Cria comanda filha vinculada ao código informado
  this.carrinhoService.iniciarComandaVinculada(mesaNumero, this.codigoAcesso);
  this.salvarMesaAtiva();

  this.router.navigate(['/cardapio'], {
    queryParams: {
      mesa: mesaNumero,
      nome: this.nome,
      codigo: this.codigoAcesso,
      principal: false
    }
  });
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