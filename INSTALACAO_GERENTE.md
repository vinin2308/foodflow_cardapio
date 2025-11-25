# Guia de Instalação - Módulo Gerente

## Pré-requisitos

- Python 3.11
- Node.js 22.x
- PostgreSQL
- Redis

## Instalação do Backend

### 1. Instalar dependências Python

```bash
cd backend/foodflow
pip3 install -r requirements.txt
```

### 2. Configurar variáveis de ambiente

Crie um arquivo `.env` na pasta `backend/foodflow/` com:

```env
SECRET_KEY=sua-chave-secreta-aqui
DB_NAME=foodflow
DB_USER=postgres
DB_PASSWORD=sua-senha
DB_HOST=localhost
DB_PORT=5432
REDIS_HOST=localhost
```

### 3. Criar banco de dados

```bash
psql -U postgres
CREATE DATABASE foodflow;
\q
```

### 4. Executar migrations

```bash
cd backend/foodflow
python3.11 manage.py makemigrations
python3.11 manage.py migrate
```

### 5. Criar superusuário (opcional)

```bash
python3.11 manage.py createsuperuser
```

### 6. Iniciar servidor Django

```bash
python3.11 manage.py runserver 8000
```

## Instalação do Frontend

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar ambiente

Verifique se o arquivo `src/enviroments/enviroment.ts` está configurado:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api'
};
```

### 3. Iniciar servidor de desenvolvimento

```bash
npm start
```

O aplicativo estará disponível em `http://localhost:4200`

## Acessando o Módulo Gerente

### URLs Principais

- **Login**: `http://localhost:4200/gerente/login`
- **Cadastro**: `http://localhost:4200/gerente/cadastro`
- **Home**: `http://localhost:4200/gerente/home`
- **Pratos**: `http://localhost:4200/gerente/pratos`
- **Categorias**: `http://localhost:4200/gerente/categorias`
- **Perfil**: `http://localhost:4200/gerente/perfil`

## Primeiro Acesso

### 1. Criar conta de gerente

1. Acesse `http://localhost:4200/gerente/cadastro`
2. Preencha os dados:
   - Username: gerente
   - Email: gerente@foodflow.com
   - Senha: senha123
   - Confirmar senha: senha123
3. Clique em "Criar Conta"

### 2. Fazer login

1. Você será redirecionado automaticamente para a home
2. Ou acesse `http://localhost:4200/gerente/login` e faça login

### 3. Adicionar categorias

1. Acesse "Categorias" no menu
2. Clique em "+ Nova Categoria"
3. Exemplos de categorias:
   - Nome: "Pizzas", Ícone: 🍕
   - Nome: "Bebidas", Ícone: 🥤
   - Nome: "Sobremesas", Ícone: 🍰
   - Nome: "Lanches", Ícone: 🍔

### 4. Adicionar pratos

1. Acesse "Pratos" no menu
2. Clique em "+ Novo Prato"
3. Preencha os dados:
   - Nome do prato
   - Descrição
   - Preço
   - Selecione uma imagem
   - Escolha a categoria
   - Marque "Prato ativo"
4. Clique em "Criar"

## Testando a Integração com Cliente

### 1. Adicionar pratos ativos

Certifique-se de ter pelo menos alguns pratos marcados como "ativos"

### 2. Acessar o cardápio do cliente

1. Acesse `http://localhost:4200/`
2. Inicie uma comanda
3. Acesse o cardápio
4. Você verá apenas os pratos e categorias ativos

### 3. Testar habilitar/desabilitar

1. No painel do gerente, desabilite um prato
2. Recarregue o cardápio do cliente
3. O prato não deve mais aparecer

## Troubleshooting

### Erro: "Module not found"

```bash
# Reinstalar dependências
npm install
```

### Erro: "Django not installed"

```bash
# Instalar Django
pip3 install django djangorestframework
```

### Erro: "Connection refused" (Backend)

Verifique se:
- O servidor Django está rodando na porta 8000
- O PostgreSQL está rodando
- O Redis está rodando
- As variáveis de ambiente estão corretas

### Erro: "CORS"

Verifique se no `settings.py` existe:

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:4200",
]
```

## Comandos Úteis

### Backend

```bash
# Criar migrations
python3.11 manage.py makemigrations

# Aplicar migrations
python3.11 manage.py migrate

# Criar superusuário
python3.11 manage.py createsuperuser

# Iniciar servidor
python3.11 manage.py runserver
```

### Frontend

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm start

# Build para produção
npm run build

# Executar testes
npm test
```

## Estrutura de Permissões

### Endpoints Públicos (Sem Autenticação)
- `POST /api/gerente/registro/`
- `POST /api/gerente/login/`
- `POST /api/gerente/esqueceu-senha/`
- `GET /api/categorias/` (apenas ativas)
- `GET /api/pratos/` (apenas ativos)

### Endpoints Protegidos (Requer Token)
- `POST /api/gerente/logout/`
- `GET /api/gerente/perfil/`
- `PUT /api/gerente/perfil/`
- `GET /api/gerente/categorias/`
- `POST /api/gerente/categorias/`
- `PUT /api/gerente/categorias/{id}/`
- `DELETE /api/gerente/categorias/{id}/`
- `GET /api/gerente/pratos/`
- `POST /api/gerente/pratos/`
- `PUT /api/gerente/pratos/{id}/`
- `DELETE /api/gerente/pratos/{id}/`

## Próximos Passos

1. Implementar envio de email para recuperação de senha
2. Adicionar validação de imagens (tamanho, formato)
3. Implementar paginação para listagem de pratos
4. Adicionar filtros e busca
5. Implementar relatórios e estatísticas
