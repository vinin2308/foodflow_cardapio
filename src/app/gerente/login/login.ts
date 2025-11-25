import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { GerenteAuthService } from '../../services/gerente-auth.service';

@Component({
  selector: 'app-gerente-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class GerenteLoginComponent {
  username = '';
  password = '';
  erro = '';
  carregando = false;

  constructor(
    private authService: GerenteAuthService,
    private router: Router
  ) {
    // Se já estiver autenticado, redirecionar para home
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/gerente/home']);
    }
  }

  login(): void {
    if (!this.username || !this.password) {
      this.erro = 'Por favor, preencha todos os campos';
      return;
    }

    this.carregando = true;
    this.erro = '';

    this.authService.login(this.username, this.password).subscribe({
      next: () => {
        this.router.navigate(['/gerente/home']);
      },
      error: (err) => {
        this.carregando = false;
        this.erro = err.error?.erro || 'Erro ao fazer login. Verifique suas credenciais.';
      }
    });
  }
}
