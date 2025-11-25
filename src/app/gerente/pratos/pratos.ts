import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { GerenteAuthService } from '../../services/gerente-auth.service';
import { GerentePratoService, Prato } from '../../services/gerente-prato.service';
import { GerenteCategoriaService, Categoria } from '../../services/gerente-categoria.service';

@Component({
  selector: 'app-gerente-pratos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './pratos.html',
  styleUrls: ['./pratos.scss']
})
export class GerentePratosComponent implements OnInit {
  pratos: Prato[] = [];
  categorias: Categoria[] = [];
  carregando = true;
  mostrarModal = false;
  editando = false;
  
  pratoAtual: Prato = {
    nome: '',
    descricao: '',
    preco: 0,
    imagem: '',
    categoria: 0,
    ativo: true
  };

  imagemPreview: string | null = null;

  constructor(
    private authService: GerenteAuthService,
    private pratoService: GerentePratoService,
    private categoriaService: GerenteCategoriaService,
    private router: Router
  ) {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/gerente/login']);
    }
  }

  ngOnInit(): void {
    this.carregarDados();
  }

  carregarDados(): void {
    this.carregando = true;
    this.pratoService.listar().subscribe({
      next: (pratos) => {
        this.pratos = pratos;
        this.carregarCategorias();
      }
    });
  }

  carregarCategorias(): void {
    this.categoriaService.listar().subscribe({
      next: (categorias) => {
        this.categorias = categorias.filter(c => c.ativo);
        this.carregando = false;
      }
    });
  }

  abrirModal(prato?: Prato): void {
    if (prato) {
      this.editando = true;
      this.pratoAtual = { ...prato };
      this.imagemPreview = prato.imagem;
    } else {
      this.editando = false;
      this.pratoAtual = {
        nome: '',
        descricao: '',
        preco: 0,
        imagem: '',
        categoria: this.categorias.length > 0 ? this.categorias[0].id! : 0,
        ativo: true
      };
      this.imagemPreview = null;
    }
    this.mostrarModal = true;
  }

  fecharModal(): void {
    this.mostrarModal = false;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagemPreview = e.target.result;
        this.pratoAtual.imagem = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  salvarPrato(): void {
    if (!this.pratoAtual.nome || !this.pratoAtual.categoria) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (this.editando && this.pratoAtual.id) {
      this.pratoService.atualizar(this.pratoAtual.id, this.pratoAtual).subscribe({
        next: () => {
          this.fecharModal();
          this.carregarDados();
        },
        error: (err) => {
          alert('Erro ao atualizar prato');
        }
      });
    } else {
      this.pratoService.criar(this.pratoAtual).subscribe({
        next: () => {
          this.fecharModal();
          this.carregarDados();
        },
        error: (err) => {
          alert('Erro ao criar prato');
        }
      });
    }
  }

  togglePratoAtivo(prato: Prato): void {
    const pratoAtualizado = { ...prato, ativo: !prato.ativo };
    this.pratoService.atualizar(prato.id!, pratoAtualizado).subscribe({
      next: () => {
        this.carregarDados();
      }
    });
  }

  deletarPrato(id: number): void {
    if (confirm('Tem certeza que deseja deletar este prato?')) {
      this.pratoService.deletar(id).subscribe({
        next: () => {
          this.carregarDados();
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
