import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
// IMPORTANTE: Ajuste este caminho se sua pasta se chamar 'environments'
import { environment } from '../../enviroments/enviroment'; 
import { Comanda } from '../models/comanda.model';

@Injectable({ providedIn: 'root' })
export class ComandaService {
  private comandaSubject = new BehaviorSubject<Comanda | null>(null);
  private comandaAtual?: Comanda;
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {
    this.restaurarEstadoInicial();
  }

  get comanda$(): Observable<Comanda | null> {
    return this.comandaSubject.asObservable();
  }

  get comandaAtualValue(): Comanda | null {
    return this.comandaAtual || null;
  }

  setComanda(comanda: Comanda): void {
    this.comandaAtual = comanda;
    this.comandaSubject.next(comanda);
    localStorage.setItem('comanda_local', JSON.stringify(comanda));
    
    if (comanda.codigo_acesso) {
      localStorage.setItem('codigo-acesso', comanda.codigo_acesso);
    }
  }

  private restaurarEstadoInicial() {
    const salvo = localStorage.getItem('comanda_local');
    if (salvo) {
      try {
        this.comandaAtual = JSON.parse(salvo);
        this.comandaSubject.next(this.comandaAtual || null);
      } catch (e) {
        console.error('Erro ao restaurar comanda', e);
      }
    }
  }

  // Métodos Auxiliares
  buscarPorCodigo(codigo: string): Observable<Comanda[]> {
    return this.http.get<Comanda[]>(`${this.apiUrl}/pedido-por-codigo/${codigo}/`).pipe(
      catchError(error => of([]))
    );
  }

  criarComandaFilha(idPai: number, payload: { mesa: number; nome_cliente: string }): Observable<Comanda> {
    return this.http.post<Comanda>(`${this.apiUrl}/pedidos/${idPai}/adicionar_filha/`, payload);
  }

  normalizarComanda(comanda: any): Comanda {
    return {
      ...comanda,
      itens: Array.isArray(comanda.itens) ? comanda.itens : [],
      eh_principal: comanda.eh_principal === true,
    };
  }
}