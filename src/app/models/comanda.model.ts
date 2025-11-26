export interface ItemComanda {
  prato: number;
  quantidade: number;
  observacao?: string;
  prato_nome?: string; // Campo opcional para evitar erros visuais
}

export interface Comanda {
  id?: number;
  mesa_numero: number;
  nome_cliente: string;
  status: string;
  itens: ItemComanda[];
  criado_em?: string;
  codigo_acesso?: string;
  eh_principal?: boolean;
}