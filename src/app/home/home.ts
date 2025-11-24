import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CarrinhoService } from '../services/carrinho.service';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { ComandaService } from '../services/comanda.service';
import { Comanda } from '../models/comanda.model';


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
    private Comandaservice: ComandaService,
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
      const chavePrincipal = `comanda-principal-mesa-${this.mesa}`;
      const chaveVinculada = `comanda-vinculada-mesa-${this.mesa}`;

      const comandaExistente = localStorage.getItem(chavePrincipal) || localStorage.getItem(chaveVinculada);
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

this.Comandaservice.criarComanda({ mesa: mesaNumero, nome_cliente: this.nome }).subscribe(comanda => {
  localStorage.setItem(`comanda-principal-mesa-${mesaNumero}`, JSON.stringify(comanda));
  localStorage.setItem(`tipo-comanda-mesa-${mesaNumero}-${comanda.codigo_acesso}`, 'principal');
  localStorage.setItem('codigo-acesso', comanda.codigo_acesso || '');
  this.Comandaservice.setComanda(comanda);

  this.router.navigate(['/cardapio'], {
    queryParams: {
      mesa: this.mesa,
      nome: this.nome,
      pessoas: this.isPrimeiroAcesso ? this.numeroPessoas : undefined,
      principal: true
    }
  });
});
    this.salvarMesaAtiva();
  }

entrarPorCodigo() {
 this.Comandaservice.buscarPorCodigo(this.codigoAcesso.trim()).subscribe(comandas => {
  if (!comandas || comandas.length === 0) {
    alert('Código inválido ou comanda não encontrada.');
    return;
  }

  // Filtra a comanda principal
  const comandaPrincipal = comandas.find(c => c.eh_principal);

  if (!comandaPrincipal) {
    alert('Nenhuma comanda principal encontrada com esse código.');
    return;
  }

  const comandaCorrigida = this.Comandaservice.normalizarComanda(comandaPrincipal);

  this.Comandaservice.criarComandaFilha(comandaCorrigida.id!, {
    mesa: Number(this.mesa),
    nome_cliente: this.nome
  }).subscribe({
    next: filha => this.finalizarEntrada(filha, Number(this.mesa)),
    error: err => {
      console.error('Erro ao criar comanda filha:', err);
      alert('Não foi possível criar a comanda vinculada. Tente novamente.');
    }
  });
});
}

private finalizarEntrada(comanda: Comanda, mesaNumero: number) {
  this.isComandaPrincipal = comanda.eh_principal ?? false;
  localStorage.setItem('mesa-atual', String(mesaNumero));
  localStorage.setItem('nome', this.nome);
  localStorage.setItem('codigo-acesso', comanda.codigo_acesso || '');
  localStorage.setItem(`tipo-comanda-mesa-${mesaNumero}-${comanda.codigo_acesso}`, comanda.eh_principal ? 'principal' : 'vinculada');

  this.Comandaservice.setComanda(comanda);

  this.router.navigate(['/cardapio'], {
    queryParams: {
      mesa: mesaNumero,
      nome: this.nome,
      codigo: comanda.codigo_acesso,
      principal: !!comanda.eh_principal
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