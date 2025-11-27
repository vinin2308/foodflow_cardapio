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
  
  // --- ADICION EI ESTA LINHA PARA CORRIGIR O ERRO ---
  mesa?: number;         
  // -------------------------------------------------
  
  mesa_numero: number;
  nome_cliente: string;
  status: OrderStatus;
  tempo_estimado?: number;
  itens: OrderItem[];
  criado_em: string; 
  codigo_acesso: string;
}