# ----------------------------
# Estágio 1: Build Angular
# ----------------------------
FROM node:20-alpine as builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Build Angular
RUN npm run build -- --configuration production

# ----------------------------
# Estágio 2: Nginx
# ----------------------------
FROM nginx:alpine

# Remove conteúdo default do Nginx
RUN rm -rf /usr/share/nginx/html/*

# --- CORREÇÃO AQUI ---
# Adicionamos '/browser' no final para pegar os arquivos certos.
# Certifique-se que 'foodflow' é o nome exato da pasta gerada na dist.
COPY --from=builder /app/dist/foodflow/browser /usr/share/nginx/html

# Copia a configuração customizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Ajuste de permissões (segurança extra para evitar 403 por permissão)
RUN chmod -R 755 /usr/share/nginx/html && \
    chown -R nginx:nginx /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]