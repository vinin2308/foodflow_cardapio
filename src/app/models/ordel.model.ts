export enum OrderStatus {
  PENDING   = 'pendente',
  PREPARING = 'em_preparo',
  READY     = 'pronto'
}

export interface OrderItem {
  prato_nome: string;
  quantidade: number;
  observacao?: string;
}

export interface Order {
  id: number;
  mesa: number;
  nome_cliente: string;
  status: OrderStatus;
  tempo_estimado?: number;   // veio de `tempo_estimado`
  itens: OrderItem[];
  data: string;  
  codigo_acesso: string;          // mapeia `criado_em`
}
