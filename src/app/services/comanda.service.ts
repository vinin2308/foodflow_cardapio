import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Comanda } from '../models/comanda.model';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ComandaService {
  private comandaSubject = new BehaviorSubject<Comanda | null>(null);
  private comandaAtual?: Comanda;
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  get comanda$(): Observable<Comanda | null> {
    return this.comandaSubject.asObservable();
  }

  get comandaAtualValue(): Comanda | null {
    return this.comandaAtual || null;
  }

  // --- NOVO MÉTODO: Cria o rascunho local sem ir no backend ---
  setComandaLocalVazia(mesa: number, nomeCliente: string, modoVinculado = false): void {
    // Usamos 'any' temporariamente no objeto para montar, depois o TypeScript valida como Comanda
    // Ou simplesmente adicionamos a propriedade faltante:
    const comandaLocal: any = { 
      id: 0, 
      mesa_numero: mesa,
      nome_cliente: nomeCliente,
      status: 'rascunho',
      codigo_acesso: undefined, 
      eh_principal: !modoVinculado,
      
      // ✅ CORREÇÃO: Adicionando a propriedade obrigatória
      comanda_pai_id: undefined, 
      
      itens: []
    };

    // Agora garantimos que é uma Comanda válida
    this.setComanda(comandaLocal as Comanda);
  } 

  // Atualiza o estado da aplicação e o LocalStorage
  setComanda(comanda: Comanda): void {
    // Normaliza para evitar erros de array undefined
    const comandaCorrigida = {
        ...comanda,
        itens: Array.isArray(comanda.itens) ? comanda.itens : []
    };

    const chave = comanda.eh_principal
      ? `comanda-${comanda.mesa_numero}`
      : `comanda-vinculada-${comanda.mesa_numero}`;

    this.comandaAtual = comandaCorrigida;
    this.comandaSubject.next(comandaCorrigida);
    
    // Só salva no localStorage se tiver ID real ou se quisermos persistir o rascunho
    // (Opcional: você pode optar por não salvar rascunho no storage para limpar no F5)
    localStorage.setItem(chave, JSON.stringify(comandaCorrigida));

    if (comanda.eh_principal && comanda.codigo_acesso) {
      localStorage.setItem('codigo-acesso', comanda.codigo_acesso);
    }
  }

  // Método auxiliar para notificar mudanças feitas no array de itens (bolinha amarela)
  notificarMudancaLocal(): void {
    if (this.comandaAtual) {
      this.comandaSubject.next(this.comandaAtual);
      // Atualiza o storage para não perder os itens se der F5
      this.setComanda(this.comandaAtual); 
    }
  }

  restaurarComandaLocal(mesa: number, modoVinculado = false): Comanda | null {
    const chave = modoVinculado
      ? `comanda-vinculada-${mesa}`
      : `comanda-${mesa}`;

    try {
      const comandaSalva = localStorage.getItem(chave);
      if (!comandaSalva) return null;
      return JSON.parse(comandaSalva);
    } catch (error) {
      return null;
    }
  }

  // --- MÉTODOS DE API (Só serão chamados na confirmação) ---

  criarComanda(payload: { mesa: number; nome_cliente: string }): Observable<Comanda> {
    return this.http.post<Comanda>(`${this.apiUrl}/iniciar-comanda/`, payload);
  }

  atualizarComandaParcial(id: number, payload: Partial<Comanda>): Observable<Comanda> {
    return this.http.patch<Comanda>(`${this.apiUrl}/pedidos/${id}/`, payload)
      .pipe(tap(atualizada => this.setComanda(atualizada)));
  }
}