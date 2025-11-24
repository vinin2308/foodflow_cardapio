export interface ItemComanda {
  prato: number;
  quantidade: number;
  observacao: string;
}

// Tipo base comum para todas as comandas
export interface ComandaBase {
  id?: number;
  mesa_numero: number;
  nome_cliente: string;
  status: string;
  itens: ItemComanda[];
  codigo_acesso?: string;
  tempo_estimado?: number;
}

// Comanda principal
export interface ComandaPrincipal extends ComandaBase {
  eh_principal: true;
  codigo_acesso?: string;
  codigo_principal?: string;
  filhas?: ComandaFilha[]; // opcional, se quiser carregar junto
}

// Comanda filha
export interface ComandaFilha extends ComandaBase {
  eh_principal: false;
  comanda_pai_id: number;
  comanda_pai_nome?: string;
}

// Tipo unificado para uso genérico
export type Comanda = ComandaPrincipal | ComandaFilha;