import { ItemCardapio } from './item-cardapio.model';

export interface ItemCarrinho {
  id: string;              // UUID ou timestamp
  item: ItemCardapio;
  quantidade: number;
  observacao?: string;
}

export interface Comanda {
  id?: string;              // ID local da comanda
  mesa: number;
  nome_cliente: string;
  status: string;
  itens: {
    prato: number;         // refere-se ao ItemCardapio.id
    quantidade: number;
    observacao: string;
  }[];
}
