import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of} from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Comanda, ComandaBase, ComandaFilha } from '../models/comanda.model';
import { catchError, tap } from 'rxjs/operators';


@Injectable({ providedIn: 'root' })
export class ComandaService {
  private comandaSubject = new BehaviorSubject<Comanda | null>(null);
  private comandaAtual?: Comanda;
  private readonly apiUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  get comanda$(): Observable<Comanda | null> {
    return this.comandaSubject.asObservable();
  }

  get comandaAtualValue(): Comanda | null {
    return this.comandaAtual || null;
  }

  public obterComandaPrincipal(comandas: Comanda[]): Comanda | null {
  return comandas.find(c => c.eh_principal) || null;
}

normalizarComanda(comanda: any): Comanda {
  const itensCorrigidos = Array.isArray(comanda.itens) ? comanda.itens : [];

  return {
    ...comanda,
    itens: itensCorrigidos,
    eh_principal: comanda.eh_principal === true,
  };
}



setComanda(comanda: Comanda): void {
  const comandaCorrigida = this.normalizarComanda(comanda);
  const chave = comanda.eh_principal
    ? `comanda-${comanda.mesa_numero}`
    : `comanda-vinculada-${comanda.mesa_numero}`;

  this.comandaAtual = comandaCorrigida;
  this.comandaSubject.next(comandaCorrigida);
  localStorage.setItem(chave, JSON.stringify(comandaCorrigida));

  // ⚡ Sempre salva o código do backend
  if (comanda.eh_principal && comanda.codigo_acesso) {
    localStorage.setItem('codigo-acesso', comanda.codigo_acesso);
  }

  console.log('✅ Comanda salva no localStorage para mesa:', comanda.mesa_numero);
}



inicializarComanda(mesa: number, nomeCliente?: string, modoVinculado = false): void {
  const chave = modoVinculado
    ? `comanda-vinculada-${mesa}`
    : `comanda-${mesa}`;

  // Limpa localStorage antigo para não usar código desatualizado
  const codigoSalvo = localStorage.getItem('codigo-acesso');

  const comandaLocal = this.restaurarComandaLocal(mesa, modoVinculado);
  if (comandaLocal && !codigoSalvo) {
    this.setComanda(comandaLocal);
    return;
  }

  const nome = nomeCliente || localStorage.getItem('nome') || '';

  // Se tiver código salvo, tenta buscar no backend
  if (codigoSalvo) {
    this.buscarPorCodigo(codigoSalvo).subscribe(comandas => {
      const comandaPrincipal = this.obterComandaPrincipal(comandas);

      if (comandaPrincipal && !modoVinculado) {
        this.setComanda(this.normalizarComanda(comandaPrincipal));
        return;
      }

      if (modoVinculado && comandas.length > 1) {
        const vinculada = comandas.find(c => !c.eh_principal);
        if (vinculada) {
          this.setComanda(this.normalizarComanda(vinculada));
          return;
        }
      }

      // Código não existe no backend → criar nova comanda sem usar código antigo
      this.criarNovaComanda(mesa, nome, modoVinculado, comandaPrincipal?.id);
    });
  } else {
    // Nenhum código salvo → cria comanda normalmente
    this.criarNovaComanda(mesa, nome, modoVinculado);
  }
}



private criarNovaComanda(
  mesa: number,
  nome: string,
  modoVinculado: boolean,
  idPai?: number
): void {
  if (modoVinculado && idPai) {
    this.criarComandaFilha(idPai, {mesa, nome_cliente: nome }).subscribe(filha => {
      this.setComanda(this.normalizarComanda(filha));
    });
  } else {
    // Cria a comanda principal no backend e pega o código real retornado
    this.criarComanda({ mesa, nome_cliente: nome }).subscribe(comanda => {
      this.setComanda(this.normalizarComanda(comanda));
      // Salva o código correto no localStorage
      if (comanda.eh_principal && comanda.codigo_acesso) {
        localStorage.setItem('codigo-acesso', comanda.codigo_acesso);
      }
    });
  } 
}


criarComanda(payload: { mesa: number; nome_cliente: string }): Observable<Comanda> {
  return this.http.post<Comanda>(`${this.apiUrl}/iniciar-comanda/`, payload);
}

criarComandaFilha(idPai: number, payload: { mesa: number; nome_cliente: string }): Observable<Comanda> {
  return this.http.post<Comanda>(`${this.apiUrl}/pedidos/${idPai}/adicionar_filha/`, payload);
}


  buscarPorCodigo(codigo: string): Observable<Comanda[]> {
  return this.http.get<Comanda[]>(`${this.apiUrl}/pedidos/por-codigo/${codigo}/`).pipe(
    catchError(error => {
      console.error('Erro ao buscar comanda por código:', error);
      return of([]);
    })
  );
}


atualizarComandaParcial(id: number, payload: Partial<Comanda>): Observable<Comanda> {
  return this.http.patch<Comanda>(
    `${this.apiUrl}/pedidos/${id}/`,
    payload
  ).pipe(
    tap((comandaAtualizada) => {
      this.setComanda(this.normalizarComanda(comandaAtualizada));
    })
  );
}

restaurarComandaLocal(mesa: number, modoVinculado = false): Comanda | null {
  const chave = modoVinculado
    ? `comanda-vinculada-${mesa}`
    : `comanda-${mesa}`;

  try {
    const comandaSalva = localStorage.getItem(chave);
    if (!comandaSalva) return null;

    const comanda: Comanda = JSON.parse(comandaSalva);
    return this.normalizarComanda(comanda);
  } catch (error) {
    console.warn('Erro ao restaurar comanda local:', error);
    return null;
  }
}
atualizarComanda(comanda: Comanda): Observable<Comanda> {
  console.log('Comanda recebida para atualização:', comanda);
  if (!comanda.id) {
    throw new Error('Comanda sem ID não pode ser atualizada');
  }

const payload = {
  nome_cliente: comanda.nome_cliente ?? '',
  status: comanda.status ?? 'pendente',
  itens: Array.isArray(comanda.itens)
    ? comanda.itens.map(item => ({
        prato: Number(item.prato),
        quantidade: Number(item.quantidade),
        observacao: item.observacao || ''
      }))
    : []
};
  console.log('Payload de itens enviado para atualizarComanda:', payload);
  return this.atualizarComandaParcial(comanda.id, payload);
}

}