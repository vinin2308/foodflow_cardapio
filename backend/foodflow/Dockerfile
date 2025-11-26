FROM python:3.11-slim

WORKDIR /app

# 1. Instalar dependências do sistema operacional
# gcc e libpq-dev são CRUCIAIS para o driver psycopg2 (PostgreSQL)
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# 2. Copiar e instalar dependências Python
COPY requirements.txt .
# O requirements.txt deve conter django, djangorestframework, gunicorn, whitenoise e psycopg2-binary
RUN pip install --no-cache-dir -r requirements.txt

# 3. Copiar o código da aplicação
COPY . .

# 4. PASSO CRUCIAL: Coletar arquivos estáticos (CSS do Admin)
# O WhiteNoise precisa desta pasta 'staticfiles' preenchida.
RUN python manage.py collectstatic --noinput

# 5. Expor a porta que o Gunicorn vai escutar
EXPOSE 8000

# 6. Comando final: Troca Daphne por Gunicorn (WSGI)
# --bind 0.0.0.0:8000: Escuta na porta do container
# foodflow.wsgi:application: Aponta para a aplicação WSGI (que é o padrão Django)
# --workers 3: Define a escalabilidade (ajuste conforme o número de CPUs)
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "foodflow.wsgi:application", "--workers", "3"]