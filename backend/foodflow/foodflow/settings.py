"""
Django settings for foodflow project.
"""

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'django-insecure-r3xnt(4ik!t^qq^-mft6hr7mjky$f=om^p#9nhz0gieh5%+$!5'

DEBUG = True

ALLOWED_HOSTS = []

# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Apps de terceiros
    'rest_framework',
    'corsheaders',  # <--- 1. ADICIONE ISSO (pip install django-cors-headers)

    # Seus apps
    'foodflow_app',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware', # <--- 2. ADICIONE ISSO NO TOPO (Fundamental para o Angular)
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'foodflow.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'foodflow.wsgi.application'


# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# --- CONFIGURAÇÃO CRÍTICA PARA CORRIGIR O SEU ERRO ---
# Isso diz ao Django: "Não use o User padrão, use o meu modelo Usuario"
AUTH_USER_MODEL = 'foodflow_app.Usuario' 
# -----------------------------------------------------

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Configuração de CORS (Permitir que o Angular na porta 4200 converse com o Django)
CORS_ALLOWED_ORIGINS = [
    "http://localhost:4200",
]

LANGUAGE_CODE = 'pt-br' # Sugestão: mudar para português

TIME_ZONE = 'America/Sao_Paulo' # Sugestão: Ajustar fuso horário

USE_I18N = True

USE_TZ = True

STATIC_URL = 'static/'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'