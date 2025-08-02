# FoodFlow

## 📋 Descrição do Projeto

O FoodFlow é uma aplicação frontend desenvolvida em Angular que permite aos clientes de restaurantes iniciar novos pedidos ou entrar em pedidos compartilhados existentes na mesa. A aplicação foi projetada com foco na experiência do usuário, utilizando um design minimalista e elegante.

## 🎨 Design e Paleta de Cores

A aplicação utiliza uma paleta de cores sofisticada e minimalista:

- **Vinho**: #722F37 (cor principal)
- **Vermelho Escuro**: #8B0000 (acentos)
- **Amarelo Dourado**: #FFD700 (destaques)
- **Cores Complementares**: Tons de creme e branco para contraste

## ✨ Funcionalidades Implementadas

### Tela Inicial
- **Logo FoodFlow**: Posicionado no topo com gradiente de cores
- **Campo Mesa**: Pré-preenchido via QR Code ou editável manualmente
- **Campo Nome**: Opcional para identificação do cliente
- **Campo Número de Pessoas**: Visível apenas no primeiro acesso da mesa
- **Botão "Iniciar Pedido"**: Cria uma nova comanda para a mesa
- **Botão "Entrar em Pedido Existente"**: Conecta à comanda ativa da mesa
- **Mensagem Explicativa**: Informa que todos os pedidos são enviados juntos

### Recursos Técnicos
- **Responsividade**: Adaptação automática para desktop e mobile
- **Animações**: Transições suaves e efeitos visuais dinâmicos
- **Validação**: Campos obrigatórios com feedback visual
- **QR Code**: Suporte para pré-preenchimento via query parameters
- **LocalStorage**: Persistência de mesas ativas

## 🚀 Como Executar

### Pré-requisitos
- Node.js (versão 18 ou superior)
- Angular CLI

### Instalação
```bash
# Instalar dependências
npm install

# Executar em modo de desenvolvimento
ng serve

# Acessar a aplicação
http://localhost:4200
```

### Teste com QR Code
Para simular o acesso via QR Code, acesse:
```
http://localhost:4200?mesa=NUMERO_DA_MESA
```

## 📱 Responsividade

A aplicação foi desenvolvida com design responsivo, garantindo uma experiência otimizada em:
- **Desktop**: Layout completo com animações
- **Tablet**: Adaptação de espaçamentos e tamanhos
- **Mobile**: Interface otimizada para toque

## 🎯 Estrutura do Projeto

```
src/
├── app/
│   ├── home/
│   │   ├── home.html          # Template do componente
│   │   ├── home.scss          # Estilos específicos
│   │   └── home.ts            # Lógica do componente
│   ├── app.routes.ts          # Configuração de rotas
│   └── app.html               # Template principal
├── styles.scss                # Estilos globais
└── index.html                 # Página principal
```

## 🔧 Tecnologias Utilizadas

- **Angular 18**: Framework principal
- **TypeScript**: Linguagem de programação
- **SCSS**: Pré-processador CSS
- **RxJS**: Programação reativa
- **Angular Router**: Navegação

## 🎨 Características do Design

### Animações
- **Fade In Up**: Entrada suave dos elementos
- **Hover Effects**: Interações visuais nos botões
- **Gradient Backgrounds**: Fundos com gradientes sutis
- **Floating Particles**: Efeitos de partículas flutuantes

### Tipografia
- **Font Family**: Segoe UI (sistema)
- **Hierarquia**: Tamanhos e pesos bem definidos
- **Legibilidade**: Alto contraste e espaçamento adequado

### Layout
- **Centralização**: Conteúdo centralizado verticalmente
- **Cards**: Formulário em card com sombras suaves
- **Espaçamento**: Margens e paddings consistentes

## 📋 Funcionalidades Futuras

- Integração com backend para persistência real
- Tela de cardápio e pedidos
- Sistema de notificações
- Histórico de pedidos
- Pagamento integrado

## 🐛 Resolução de Problemas

### Problemas Comuns
1. **Porta em uso**: Altere a porta com `ng serve --port 4201`
2. **Dependências**: Execute `npm install` se houver erros
3. **Cache**: Limpe o cache com `npm start -- --delete-output-path`

## 📞 Suporte

Para dúvidas ou sugestões sobre o projeto, consulte a documentação do Angular ou entre em contato com a equipe de desenvolvimento.

---

**Desenvolvido com ❤️ usando Angular e design minimalista**
Alteração da estruturação da pastas

