import { ItemCardapio } from '../models/item-cardapio.model';

export const CARDAPIO_MOCK: ItemCardapio[] = [
  // Entradas
  {
    id: 1,
    nome: 'Bruschetta Italiana',
    descricao: 'Pão italiano tostado com tomate, manjericão e azeite extra virgem',
    preco: 18.90,
    categoria: 'entradas'
  },
  {
    id: 2,
    nome: 'Carpaccio de Salmão',
    descricao: 'Fatias finas de salmão fresco com alcaparras e molho de mostarda',
    preco: 32.90,
    categoria: 'entradas'
  },
  {
    id: 3,
    nome: 'Tábua de Queijos',
    descricao: 'Seleção de queijos artesanais com geleia de pimenta e nozes',
    preco: 45.90,
    categoria: 'entradas'
  },

  // Pratos Principais
  {
    id: 4,
    nome: 'Risotto de Camarão',
    descricao: 'Arroz arbóreo cremoso com camarões grelhados e ervas finas',
    preco: 68.90,
    categoria: 'pratos-principais'
  },
  {
    id: 5,
    nome: 'Filé Mignon Grelhado',
    descricao: 'Filé mignon ao ponto com batatas rústicas e legumes salteados',
    preco: 89.90,
    categoria: 'pratos-principais'
  },
  {
    id: 6,
    nome: 'Salmão Grelhado',
    descricao: 'Salmão fresco grelhado com quinoa e vegetais orgânicos',
    preco: 75.90,
    categoria: 'pratos-principais'
  },
  {
    id: 7,
    nome: 'Massa Carbonara',
    descricao: 'Espaguete com bacon, ovos, queijo parmesão e pimenta do reino',
    preco: 52.90,
    categoria: 'pratos-principais'
  },

  // Bebidas
  {
    id: 8,
    nome: 'Vinho Tinto Reserva',
    descricao: 'Cabernet Sauvignon argentino, safra 2020',
    preco: 85.00,
    categoria: 'bebidas'
  },
  {
    id: 9,
    nome: 'Cerveja Artesanal IPA',
    descricao: 'Cerveja artesanal com lúpulo americano, 500ml',
    preco: 18.90,
    categoria: 'bebidas'
  },
  {
    id: 10,
    nome: 'Suco Natural de Laranja',
    descricao: 'Suco de laranja pêra fresco, 300ml',
    preco: 12.90,
    categoria: 'bebidas'
  },
  {
    id: 11,
    nome: 'Água com Gás',
    descricao: 'Água mineral com gás, 500ml',
    preco: 8.90,
    categoria: 'bebidas'
  },

  // Sobremesas
  {
    id: 12,
    nome: 'Tiramisù',
    descricao: 'Sobremesa italiana com café, mascarpone e cacau',
    preco: 24.90,
    categoria: 'sobremesas'
  },
  {
    id: 13,
    nome: 'Petit Gateau',
    descricao: 'Bolinho de chocolate quente com sorvete de baunilha',
    preco: 28.90,
    categoria: 'sobremesas'
  },
  {
    id: 14,
    nome: 'Cheesecake de Frutas Vermelhas',
    descricao: 'Torta cremosa com calda de frutas vermelhas',
    preco: 22.90,
    categoria: 'sobremesas'
  }
];

export const CATEGORIAS = [
  { id: 'entradas', nome: 'Entradas', icone: '🥗' },
  { id: 'pratos-principais', nome: 'Pratos Principais', icone: '🍽️' },
  { id: 'bebidas', nome: 'Bebidas', icone: '🍷' },
  { id: 'sobremesas', nome: 'Sobremesas', icone: '🍰' }
];

