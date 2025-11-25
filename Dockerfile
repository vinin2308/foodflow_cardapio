# Estágio 1: Build da Aplicação Angular
FROM node:20-alpine as builder

WORKDIR /app

COPY package.json package-lock.json ./ 

# 'npm ci' é mais rápido e seguro para CI/CD do que 'npm install'
# Ele garante que as versões exatas do package-lock sejam usadas
RUN npm ci

COPY . .

# Compila para produção.
# CERTIFIQUE-SE que 'foodflow' é o nome do projeto no angular.json
# Se for o nome da configuração de ambiente, ok. Se não, use '--configuration production'
RUN npm run build -- --configuration production

# Estágio 2: Servidor Web (Nginx)
FROM nginx:alpine

# Remove a página padrão do Nginx para evitar conflitos
RUN rm -rf /usr/share/nginx/html/*

# Copia os arquivos compilados do Angular
# VERIFIQUE SE O CAMINHO '/dist/foodflow/browser' ESTÁ CERTO NO SEU angular.json
COPY --from=builder /app/dist/foodflow/browser /usr/share/nginx/html

# Copia a configuração customizada do Nginx (essencial para Angular)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]