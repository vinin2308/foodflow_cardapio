# Guia de Deployment - FoodFlow

## 🚀 Opções de Deployment

### 1. Build para Produção

```bash
# Gerar build otimizado
ng build --configuration production

# Os arquivos serão gerados na pasta dist/
```

### 2. Deploy em Servidor Web

#### Apache/Nginx
1. Copie os arquivos da pasta `dist/foodflow/` para o diretório do servidor
2. Configure o servidor para servir o `index.html` para todas as rotas (SPA)

#### Exemplo de configuração Nginx:
```nginx
server {
    listen 80;
    server_name seu-dominio.com;
    root /path/to/dist/foodflow;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 3. Deploy em Plataformas Cloud

#### Vercel
```bash
npm install -g vercel
vercel --prod
```

#### Netlify
1. Conecte o repositório no Netlify
2. Configure build command: `ng build --prod`
3. Configure publish directory: `dist/foodflow`

#### Firebase Hosting
```bash
npm install -g firebase-tools
firebase init hosting
firebase deploy
```

### 4. Docker

#### Dockerfile
```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN ng build --configuration production

FROM nginx:alpine
COPY --from=build /app/dist/foodflow /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🔧 Configurações de Produção

### Environment Variables
Crie arquivos de ambiente para diferentes ambientes:

```typescript
// src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://api.foodflow.com',
  qrCodeBaseUrl: 'https://foodflow.com'
};
```

### Otimizações
- **Lazy Loading**: Implementar para módulos futuros
- **Service Worker**: Para funcionalidade offline
- **CDN**: Para assets estáticos
- **Compressão**: Gzip/Brotli no servidor

## 📱 PWA (Progressive Web App)

Para transformar em PWA:

```bash
ng add @angular/pwa
```

Isso adiciona:
- Service Worker
- Manifest.json
- Ícones para instalação
- Cache strategies

## 🔒 Segurança

### Headers de Segurança
Configure no servidor:
```
Content-Security-Policy: default-src 'self'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
```

### HTTPS
- Sempre use HTTPS em produção
- Configure redirecionamento HTTP → HTTPS
- Use certificados SSL válidos

## 📊 Monitoramento

### Analytics
Integre Google Analytics ou similar:

```typescript
// No app.component.ts
gtag('config', 'GA_MEASUREMENT_ID');
```

### Error Tracking
Configure Sentry ou similar para monitoramento de erros.

## 🔄 CI/CD

### GitHub Actions
```yaml
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: ng build --prod
      - run: # Deploy commands
```

## 📋 Checklist de Deployment

- [ ] Build sem erros
- [ ] Testes passando
- [ ] Configurações de ambiente corretas
- [ ] HTTPS configurado
- [ ] Headers de segurança
- [ ] Monitoramento ativo
- [ ] Backup configurado
- [ ] DNS configurado
- [ ] Performance otimizada

---

**Lembre-se de testar em ambiente de staging antes do deploy em produção!**

