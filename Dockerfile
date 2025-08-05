# Stage 1: Build the Angular application
FROM node:20-alpine as builder

WORKDIR /app

COPY package.json package-lock.json ./ 
ENV CYPRESS_INSTALL_BINARY=0

RUN npm install


COPY . .
RUN npm run build --configuration foodflow

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

COPY --from=builder /app/dist/foodflow/browser /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]