import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { GerenteAuthService } from '../../services/gerente-auth.service';

@Component({
  selector: 'app-gerente-cadastro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './cadastro.html',
  styleUrls: ['./cadastro.scss']
})
export class GerenteCadastroComponent {
  username = '';
  email = '';
  password = '';
  password2 = '';
  first_name = '';
  last_name = '';
  erro = '';
  carregando = false;

  constructor(
    private authService: GerenteAuthService,
    private router: Router
  ) {}

  cadastrar(): void {
    if (!this.username || !this.email || !this.password || !this.password2) {
      this.erro = 'Por favor, preencha todos os campos obrigatórios';
      return;
    }

    if (this.password !== this.password2) {
      this.erro = 'As senhas não coincidem';
      return;
    }

    this.carregando = true;
    this.erro = '';

    const dados = {
      username: this.username,
      email: this.email,
      password: this.password,
      password2: this.password2,
      first_name: this.first_name,
      last_name: this.last_name
    };

    this.authService.registro(dados).subscribe({
      next: () => {
        this.router.navigate(['/gerente/home']);
      },
      error: (err) => {
        this.carregando = false;
        if (err.error) {
          const erros = Object.values(err.error).flat();
          this.erro = erros.join(', ');
        } else {
          this.erro = 'Erro ao criar conta. Tente novamente.';
        }
      }
    });
  }
}
