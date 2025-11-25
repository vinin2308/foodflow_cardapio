import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { GerenteAuthService } from '../../services/gerente-auth.service';
import { GerenteCategoriaService, Categoria } from '../../services/gerente-categoria.service';

@Component({
  selector: 'app-gerente-categorias',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './categorias.html',
  styleUrls: ['./categorias.scss']
})
export class GerenteCategoriasComponent implements OnInit {
  categorias: Categoria[] = [];
  carregando = true;
  mostrarModal = false;
  editando = false;
  
  categoriaAtual: Categoria = {
    nome: '',
    icone: '',
    ativo: true
  };

  constructor(
    private authService: GerenteAuthService,
    private categoriaService: GerenteCategoriaService,
    private router: Router
  ) {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/gerente/login']);
    }
  }

  ngOnInit(): void {
    this.carregarCategorias();
  }

  carregarCategorias(): void {
    this.carregando = true;
    this.categoriaService.listar().subscribe({
      next: (categorias) => {
        this.categorias = categorias;
        this.carregando = false;
      },
      error: () => {
        this.carregando = false;
      }
    });
  }

  abrirModal(categoria?: Categoria): void {
    if (categoria) {
      this.editando = true;
      this.categoriaAtual = { ...categoria };
    } else {
      this.editando = false;
      this.categoriaAtual = {
        nome: '',
        icone: '',
        ativo: true
      };
    }
    this.mostrarModal = true;
  }

  fecharModal(): void {
    this.mostrarModal = false;
  }

  salvarCategoria(): void {
    if (!this.categoriaAtual.nome) {
      alert('Por favor, preencha o nome da categoria');
      return;
    }

    if (this.editando && this.categoriaAtual.id) {
      this.categoriaService.atualizar(this.categoriaAtual.id, this.categoriaAtual).subscribe({
        next: () => {
          this.fecharModal();
          this.carregarCategorias();
        },
        error: () => {
          alert('Erro ao atualizar categoria');
        }
      });
    } else {
      this.categoriaService.criar(this.categoriaAtual).subscribe({
        next: () => {
          this.fecharModal();
          this.carregarCategorias();
        },
        error: () => {
          alert('Erro ao criar categoria');
        }
      });
    }
  }

  toggleCategoriaAtiva(categoria: Categoria): void {
    const categoriaAtualizada = { ...categoria, ativo: !categoria.ativo };
    this.categoriaService.atualizar(categoria.id!, categoriaAtualizada).subscribe({
      next: () => {
        this.carregarCategorias();
      }
    });
  }

  deletarCategoria(id: number): void {
    if (confirm('Tem certeza que deseja deletar esta categoria? Isso pode afetar os pratos associados.')) {
      this.categoriaService.deletar(id).subscribe({
        next: () => {
          this.carregarCategorias();
        },
        error: () => {
          alert('Erro ao deletar categoria. Pode haver pratos associados a ela.');
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
}
