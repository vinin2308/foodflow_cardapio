# FoodFlow - Cardápio com Carrinho Dinâmico

## 📋 Visão Geral

O FoodFlow agora conta com um sistema completo de cardápio digital com carrinho dinâmico, permitindo que clientes façam pedidos de forma intuitiva e compartilhem a comanda entre usuários da mesma mesa.

## ✨ Funcionalidades Implementadas

### 🏠 Tela Inicial (HomeComponent)
- **Campo Mesa**: Pré-preenchido via QR Code ou editável manualmente
- **Campo Nome**: Identificação opcional do cliente
- **Campo Número de Pessoas**: Visível apenas no primeiro acesso da mesa
- **Botão "Iniciar Pedido"**: Cria nova comanda para a mesa
- **Botão "Entrar em Pedido Existente"**: Conecta à comanda ativa da mesa
- **Mensagem Explicativa**: Informa sobre pedidos compartilhados

### 🍽️ Tela do Cardápio (CardapioComponent)
- **Header Dinâmico**: Mostra mesa e nome do cliente
- **Botão do Carrinho**: Ícone fixo com badge de quantidade
- **Navegação por Categorias**: Entradas, Pratos Principais, Bebidas, Sobremesas
- **Grid de Itens**: Layout responsivo com cards dos pratos
- **Informações dos Itens**: Nome, descrição e preço formatado
- **Botão "Adicionar"**: Adiciona item diretamente ao carrinho
- **Botão "Observação"**: Abre modal para observações personalizadas

### 🛒 Carrinho Dinâmico (CarrinhoComponent)
- **Sidebar Responsiva**: Desktop (lateral) / Mobile (tela cheia)
- **Informações da Mesa**: Mesa e status da comanda
- **Lista de Itens**: Todos os itens adicionados
- **Controles de Quantidade**: Botões + e - para cada item
- **Observações**: Exibição das observações por item
- **Subtotais**: Cálculo automático por item
- **Total Geral**: Soma de todos os itens
- **Botão "Confirmar Pedido"**: Finaliza e envia o pedido

### 📝 Modal de Observação (ObservacaoModalComponent)
- **Informações do Item**: Nome, descrição e preço
- **Campo de Texto**: Textarea para observações (máx. 200 caracteres)
- **Contador de Caracteres**: Feedback visual em tempo real
- **Botões de Ação**: Cancelar ou Adicionar ao Carrinho

### 🔄 Serviço de Carrinho (CarrinhoService)
- **Gerenciamento de Estado**: RxJS Observables para reatividade
- **Persistência Local**: localStorage para manter dados
- **Compartilhamento**: Múltiplos usuários na mesma mesa
- **Operações CRUD**: Adicionar, remover, alterar quantidade
- **Cálculos Automáticos**: Total e subtotais em tempo real

## 🎨 Design e UX

### Paleta de Cores
- **Vinho**: #722F37 (cor principal)
- **Vermelho Escuro**: #8B0000 (destaque)
- **Amarelo Dourado**: #FFD700 (acentos)
- **Fundo**: #FDF8F0 (creme suave)

### Características Visuais
- **Design Minimalista**: Interface limpa e focada
- **Responsividade**: Adaptação perfeita para mobile e desktop
- **Animações Suaves**: Transições elegantes entre estados
- **Feedback Visual**: Estados hover, loading e confirmação
- **Tipografia**: Hierarquia clara e legibilidade otimizada

## 🔧 Arquitetura Técnica

### Componentes
```
src/app/
├── home/                    # Tela inicial
├── cardapio/               # Tela do cardápio
├── carrinho/               # Sidebar do carrinho
├── observacao-modal/       # Modal de observações
├── services/
│   └── carrinho.ts        # Serviço de gerenciamento
├── models/
│   └── item-cardapio.model.ts  # Interfaces TypeScript
└── data/
    └── cardapio-mock.ts   # Dados mock do cardápio
```

### Tecnologias
- **Angular 18**: Framework principal
- **TypeScript**: Linguagem de desenvolvimento
- **RxJS**: Programação reativa
- **SCSS**: Estilização avançada
- **LocalStorage**: Persistência de dados

## 🚀 Como Usar

### 1. Instalação
```bash
# Clonar/extrair o projeto
cd foodflow

# Instalar dependências
npm install
```

### 2. Execução
```bash
# Iniciar servidor de desenvolvimento
ng serve

# Acessar aplicação
http://localhost:4200
```

### 3. Fluxo de Uso

#### Iniciar Pedido
1. Acesse a tela inicial
2. Preencha o número da mesa
3. Adicione seu nome (opcional)
4. Defina número de pessoas (primeiro acesso)
5. Clique em "Iniciar Pedido"

#### Navegar no Cardápio
1. Use as abas para navegar entre categorias
2. Visualize itens com descrições e preços
3. Clique em "✏️" para adicionar observações
4. Clique em "+ Adicionar" para incluir no carrinho

#### Gerenciar Carrinho
1. Clique no ícone 🛒 para abrir o carrinho
2. Ajuste quantidades com botões + e -
3. Remova itens com o botão 🗑️
4. Visualize total em tempo real
5. Confirme o pedido quando pronto

#### Compartilhar Mesa
1. Outros usuários podem "Entrar em Pedido Existente"
2. Todos compartilham a mesma comanda
3. Itens são sincronizados entre dispositivos

## 📱 Funcionalidades Avançadas

### QR Code
- Acesse via URL: `?mesa=NUMERO`
- Exemplo: `http://localhost:4200?mesa=15`
- Campo mesa é pré-preenchido automaticamente

### Persistência
- Dados salvos no localStorage
- Comanda mantida entre sessões
- Sincronização entre dispositivos da mesma mesa

### Responsividade
- **Desktop**: Sidebar lateral para carrinho
- **Mobile**: Modal em tela cheia
- **Touch**: Botões otimizados para toque
- **Viewport**: Adaptação automática

## 🔮 Próximos Passos

### Integrações Futuras
- [ ] API Backend para persistência real
- [ ] WebSocket para sincronização em tempo real
- [ ] Sistema de pagamento integrado
- [ ] Notificações push para status do pedido
- [ ] Dashboard administrativo
- [ ] Relatórios e analytics

### Melhorias UX
- [ ] Busca e filtros no cardápio
- [ ] Favoritos e histórico de pedidos
- [ ] Avaliações e comentários
- [ ] Modo escuro
- [ ] Múltiplos idiomas

## 📞 Suporte

Para dúvidas ou sugestões sobre o sistema de cardápio:
- Consulte a documentação técnica
- Verifique os comentários no código
- Teste as funcionalidades localmente

---

**FoodFlow** - Transformando a experiência gastronômica digital! 🍽️✨

