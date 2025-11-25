import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { GerenteAuthService, GerenteUser } from '../../services/gerente-auth.service';

@Component({
  selector: 'app-gerente-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './perfil.html',
  styleUrls: ['./perfil.scss']
})
export class GerentePerfilComponent implements OnInit {
  user: GerenteUser | null = null;
  editando = false;
  carregando = false;
  sucesso = '';
  erro = '';

  dadosEdicao = {
    username: '',
    email: '',
    first_name: '',
    last_name: ''
  };

  constructor(
    private authService: GerenteAuthService,
    private router: Router
  ) {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/gerente/login']);
    }
  }

  ngOnInit(): void {
    this.carregarPerfil();
  }

  carregarPerfil(): void {
    this.authService.getPerfil().subscribe({
      next: (user) => {
        this.user = user;
        this.dadosEdicao = {
          username: user.username,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name
        };
      }
    });
  }

  ativarEdicao(): void {
    this.editando = true;
    this.sucesso = '';
    this.erro = '';
  }

  cancelarEdicao(): void {
    this.editando = false;
    if (this.user) {
      this.dadosEdicao = {
        username: this.user.username,
        email: this.user.email,
        first_name: this.user.first_name,
        last_name: this.user.last_name
      };
    }
  }

  salvarPerfil(): void {
    this.carregando = true;
    this.sucesso = '';
    this.erro = '';

    this.authService.atualizarPerfil(this.dadosEdicao).subscribe({
      next: (user) => {
        this.user = user;
        this.editando = false;
        this.carregando = false;
        this.sucesso = 'Perfil atualizado com sucesso!';
      },
      error: (err) => {
        this.carregando = false;
        this.erro = 'Erro ao atualizar perfil. Tente novamente.';
      }
    });
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/gerente/login']);
      }
    });
  }
}
