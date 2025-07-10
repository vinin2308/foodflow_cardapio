export interface ItemCardapio {
  id: number;
  nome: string;
  descricao: string;
  preco: number;
  categoria: 'entradas' | 'pratos-principais' | 'bebidas' | 'sobremesas';
  imagem?: string;
}

export interface ItemCarrinho {
  item: ItemCardapio;
  quantidade: number;
  observacao?: string;
  id: string; // ID único para o item no carrinho
}

export interface Comanda {
  id: string;
  mesa: string;
  itens: ItemCarrinho[];
  total: number;
  status: 'ativa' | 'enviada' | 'preparando' | 'pronta';
  criadaEm: Date;
}

