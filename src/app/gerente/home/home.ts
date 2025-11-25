import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { GerenteAuthService, GerenteUser } from '../../services/gerente-auth.service';
import { GerentePratoService, Prato } from '../../services/gerente-prato.service';
import { FilterPipe } from '../../pipes/filter.pipe';

@Component({
  selector: 'app-gerente-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FilterPipe],
  templateUrl: './home.html',
  styleUrls: ['./home.scss']
})
export class GerenteHomeComponent implements OnInit {
  user: GerenteUser | null = null;
  pratos: Prato[] = [];
  pratosVisiveis: Prato[] = [];
  carregando = true;
  mostrarMenu = false;

  constructor(
    private authService: GerenteAuthService,
    private pratoService: GerentePratoService,
    private router: Router
  ) {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/gerente/login']);
    }
  }

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    this.carregarPratos();
  }

  carregarPratos(): void {
    this.carregando = true;
    this.pratoService.listar().subscribe({
      next: (pratos) => {
        this.pratos = pratos;
        this.pratosVisiveis = pratos.slice(0, 6); // Mostrar apenas 6 pratos na home
        this.carregando = false;
      },
      error: () => {
        this.carregando = false;
      }
    });
  }

  togglePratoAtivo(prato: Prato): void {
    const pratoAtualizado = { ...prato, ativo: !prato.ativo };
    this.pratoService.atualizar(prato.id!, pratoAtualizado).subscribe({
      next: () => {
        this.carregarPratos();
      }
    });
  }

  deletarPrato(id: number): void {
    if (confirm('Tem certeza que deseja deletar este prato?')) {
      this.pratoService.deletar(id).subscribe({
        next: () => {
          this.carregarPratos();
        }
      });
    }
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/gerente/login']);
      }
    });
  }

  toggleMenu(): void {
    this.mostrarMenu = !this.mostrarMenu;
  }
}
