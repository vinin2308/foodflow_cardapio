import { ItemCardapio } from './item-cardapio.model';

export interface ItemCarrinho {
  id: string;              // UUID ou timestamp
  item: ItemCardapio;
  quantidade: number;
  observacao?: string;
}
