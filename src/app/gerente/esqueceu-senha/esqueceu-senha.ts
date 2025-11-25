import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { GerenteAuthService } from '../../services/gerente-auth.service';

@Component({
  selector: 'app-gerente-esqueceu-senha',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './esqueceu-senha.html',
  styleUrls: ['./esqueceu-senha.scss']
})
export class GerenteEsqueceuSenhaComponent {
  email = '';
  erro = '';
  sucesso = '';
  carregando = false;

  constructor(private authService: GerenteAuthService) {}

  recuperarSenha(): void {
    if (!this.email) {
      this.erro = 'Por favor, digite seu email';
      return;
    }

    this.carregando = true;
    this.erro = '';
    this.sucesso = '';

    this.authService.esqueceuSenha(this.email).subscribe({
      next: () => {
        this.carregando = false;
        this.sucesso = 'Instruções de recuperação enviadas para seu email!';
        this.email = '';
      },
      error: (err) => {
        this.carregando = false;
        this.erro = err.error?.erro || 'Erro ao recuperar senha. Tente novamente.';
      }
    });
  }
}
