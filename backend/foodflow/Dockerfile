# Dockerfile para backend Django + Channels
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .

# Expõe a porta do Django
EXPOSE 8000

# Comando padrão para rodar Daphne
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "foodflow.asgi:application"]
