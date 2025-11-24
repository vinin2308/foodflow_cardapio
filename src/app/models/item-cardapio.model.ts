export interface CategoriaCardapio {
  id: string;
  nome: string;
  icone: string;
}

export interface ItemCardapio {
  id: number;
  nome: string;
  descricao: string;
  preco: number;
  categoria: CategoriaCardapio;
  imagem?: string;
}
