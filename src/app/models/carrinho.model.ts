import { ItemCardapio } from './item-cardapio.model';

export interface ItemCarrinho {
  id: string;              // UUID ou timestamp
  item: ItemCardapio;
  quantidade: number;
  observacao?: string;
}

export interface Comanda {
  id?: string;
  mesa: number;
  nome_cliente: string;
  status: string;
  codigo_acesso?: string;
  itens: {
    prato: number;
    quantidade: number;
    observacao: string;
  }[];
  comanda_pai_id?: string;
  comanda_pai_nome?: string; 
  eh_principal: boolean;// opcional, se quiser exibir nome
}
