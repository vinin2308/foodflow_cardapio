# Módulo Gerente - FoodFlow

## Funcionalidades Implementadas

### 🔐 Autenticação
- **Login** (`/gerente/login`)
  - Autenticação com username e senha
  - Validação de credenciais
  - Geração de token de autenticação
  
- **Cadastro** (`/gerente/cadastro`)
  - Criação de nova conta de gerente
  - Validação de senha (confirmação)
  - Campos: username, email, nome, sobrenome

- **Esqueceu Senha** (`/gerente/esqueceu-senha`)
  - Recuperação de senha por email
  - Placeholder para implementação de envio de email

### 🏠 Dashboard (Home)
- **Visão Geral** (`/gerente/home`)
  - Estatísticas de pratos (total, ativos, inativos)
  - Lista dos 6 pratos mais recentes
  - Ações rápidas: editar, habilitar/desabilitar, deletar

### 🍕 Gerenciamento de Pratos
- **Listagem** (`/gerente/pratos`)
  - Visualização de todos os pratos cadastrados
  - Filtros por status (ativo/inativo)
  - Informações: nome, descrição, preço, categoria, imagem

- **Criar Prato**
  - Formulário completo com validação
  - Upload de imagem (base64)
  - Seleção de categoria
  - Status ativo/inativo

- **Editar Prato**
  - Edição de todos os campos
  - Atualização de imagem
  - Preservação de dados existentes

- **Habilitar/Desabilitar**
  - Toggle rápido de status
  - Pratos inativos não aparecem no cardápio do cliente

- **Deletar Prato**
  - Confirmação antes de deletar
  - Remoção permanente do banco

### 📂 Gerenciamento de Categorias
- **Listagem** (`/gerente/categorias`)
  - Visualização de todas as categorias
  - Status ativo/inativo
  - Ícone emoji para cada categoria

- **Criar Categoria**
  - Nome da categoria
  - Ícone (emoji)
  - Status ativo/inativo

- **Editar Categoria**
  - Atualização de nome e ícone
  - Alteração de status

- **Habilitar/Desabilitar**
  - Toggle de status
  - Categorias inativas não aparecem no cardápio

- **Deletar Categoria**
  - Validação de pratos associados
  - Confirmação antes de deletar

### 👤 Perfil do Gerente
- **Visualizar Perfil** (`/gerente/perfil`)
  - Informações do usuário
  - Data de criação da conta
  - Função (role)

- **Editar Perfil**
  - Atualização de dados pessoais
  - Username, email, nome, sobrenome

## Integração com Cliente

### Dados Compartilhados
- **Categorias**: Apenas categorias ativas aparecem no cardápio do cliente
- **Pratos**: Apenas pratos ativos aparecem no cardápio do cliente
- **Sincronização**: Mudanças feitas pelo gerente são refletidas imediatamente no cardápio

### Endpoints da API

#### Autenticação
```
POST /api/gerente/registro/
POST /api/gerente/login/
POST /api/gerente/logout/
GET  /api/gerente/perfil/
PUT  /api/gerente/perfil/
POST /api/gerente/esqueceu-senha/
```

#### Categorias (Gerente)
```
GET    /api/gerente/categorias/
POST   /api/gerente/categorias/
GET    /api/gerente/categorias/{id}/
PUT    /api/gerente/categorias/{id}/
DELETE /api/gerente/categorias/{id}/
```

#### Pratos (Gerente)
```
GET    /api/gerente/pratos/
POST   /api/gerente/pratos/
GET    /api/gerente/pratos/{id}/
PUT    /api/gerente/pratos/{id}/
DELETE /api/gerente/pratos/{id}/
```

#### Categorias e Pratos (Cliente - Somente Leitura)
```
GET /api/categorias/  (apenas ativas)
GET /api/pratos/      (apenas ativos)
```

## Estrutura de Arquivos

```
src/app/
├── gerente/
│   ├── login/
│   │   ├── login.ts
│   │   ├── login.html
│   │   └── login.scss
│   ├── cadastro/
│   │   ├── cadastro.ts
│   │   ├── cadastro.html
│   │   └── cadastro.scss
│   ├── esqueceu-senha/
│   │   ├── esqueceu-senha.ts
│   │   ├── esqueceu-senha.html
│   │   └── esqueceu-senha.scss
│   ├── home/
│   │   ├── home.ts
│   │   ├── home.html
│   │   └── home.scss
│   ├── pratos/
│   │   ├── pratos.ts
│   │   ├── pratos.html
│   │   └── pratos.scss
│   ├── categorias/
│   │   ├── categorias.ts
│   │   ├── categorias.html
│   │   └── categorias.scss
│   ├── perfil/
│   │   ├── perfil.ts
│   │   ├── perfil.html
│   │   └── perfil.scss
│   └── gerente.routes.ts
├── services/
│   ├── gerente-auth.service.ts
│   ├── gerente-prato.service.ts
│   └── gerente-categoria.service.ts
└── pipes/
    └── filter.pipe.ts
```

## Backend

### Models (models.py)
- `Usuario`: Modelo de usuário com role (gerente, cliente, garçom, cozinheiro)
- `Categoria`: Categorias de pratos com status ativo/inativo
- `Prato`: Pratos do cardápio com categoria, preço, imagem

### Serializers (serializers.py)
- `GerenteRegistroSerializer`: Registro de gerente
- `GerenteLoginSerializer`: Login
- `GerentePerfilSerializer`: Perfil do gerente
- `CategoriaGerenteSerializer`: CRUD de categorias
- `PratoGerenteSerializer`: CRUD de pratos

### Views (views.py)
- `gerente_registro`: Criar conta
- `gerente_login`: Autenticar
- `gerente_logout`: Deslogar
- `gerente_perfil`: Ver/editar perfil
- `CategoriaGerenteViewSet`: CRUD de categorias
- `PratoGerenteViewSet`: CRUD de pratos

## Como Usar

### 1. Criar Conta de Gerente
1. Acesse `/gerente/cadastro`
2. Preencha os dados
3. Clique em "Criar Conta"

### 2. Fazer Login
1. Acesse `/gerente/login`
2. Digite username e senha
3. Clique em "Entrar"

### 3. Adicionar Categorias
1. Acesse `/gerente/categorias`
2. Clique em "+ Nova Categoria"
3. Preencha nome e ícone
4. Marque "Categoria ativa"
5. Clique em "Criar"

### 4. Adicionar Pratos
1. Acesse `/gerente/pratos`
2. Clique em "+ Novo Prato"
3. Preencha todos os campos
4. Selecione uma imagem
5. Escolha a categoria
6. Marque "Prato ativo"
7. Clique em "Criar"

### 5. Gerenciar Pratos
- **Editar**: Clique no ícone ✏️
- **Habilitar/Desabilitar**: Clique no ícone 🔴/🟢
- **Deletar**: Clique no ícone 🗑️

## Segurança

- Autenticação via Token (Django Rest Framework Token Authentication)
- Tokens armazenados no localStorage
- Endpoints protegidos com `IsAuthenticated`
- Validação de permissões por role

## Observações

- O código do cliente **não foi modificado**
- A integração funciona através dos endpoints existentes
- Pratos e categorias inativos não aparecem no cardápio do cliente
- Todas as mudanças são refletidas em tempo real
