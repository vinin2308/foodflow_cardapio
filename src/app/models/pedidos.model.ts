export interface PedidoItemPayload {
  prato: number;
  quantidade: number;
  observacao: string;
}

export interface PedidoPayload {
  mesa: number;
  nome_cliente: string;
  status: string;
  itens: PedidoItemPayload[];
}
