from rest_framework import routers
from django.urls import path, include
from .views import (
    # ViewSets principais
    UsuarioViewSet,
    MesaViewSet,
    CategoriaViewSet,
    PratoViewSet,
    PedidoViewSet,
    PedidoItemViewSet,
    PagamentoViewSet,

    # Funções
    iniciar_comanda,
    pedido_por_codigo,

    # Views do gerente
    gerente_registro,
    gerente_login,
    gerente_logout,
    gerente_perfil,
    gerente_esqueceu_senha,

    # ViewSets do gerente
    CategoriaGerenteViewSet,
    PratoGerenteViewSet,
)

# -------------------------------------------------------------------

# -------------------------------------------------------------------

router = routers.DefaultRouter()

# ViewSets gerais
router.register(r'usuarios', UsuarioViewSet)
router.register(r'mesas', MesaViewSet)
router.register(r'categorias', CategoriaViewSet, basename='categoria')
router.register(r'pratos', PratoViewSet, basename='prato')
router.register(r'pedidos', PedidoViewSet, basename='pedido')
router.register(r'pedido-itens', PedidoItemViewSet)
router.register(r'pagamentos', PagamentoViewSet)

# ViewSets exclusivos do gerente
router.register(r'gerente/categorias', CategoriaGerenteViewSet, basename='gerente-categoria')
router.register(r'gerente/pratos', PratoGerenteViewSet, basename='gerente-prato')

# -------------------------------------------------------------------
# URLS FINAIS — ORDEM CORRETA
# -------------------------------------------------------------------

urlpatterns = [
    # 1. Funções (devem vir antes dos routers)
    path('iniciar-comanda/', iniciar_comanda, name='iniciar-comanda'),
    path('pedido-por-codigo/<str:codigo>/', pedido_por_codigo, name='pedido-por-codigo'),
    path('cozinha/', PedidoViewSet.as_view({'post': 'cozinha', 'get': 'cozinha'}), name='pedido-cozinha'),

    # 2. Rotas de login/cadastro do gerente
    path('gerente/registro/', gerente_registro, name='gerente-registro'),
    path('gerente/login/', gerente_login, name='gerente-login'),
    path('gerente/logout/', gerente_logout, name='gerente-logout'),
    path('gerente/perfil/', gerente_perfil, name='gerente-perfil'),
    path('gerente/esqueceu-senha/', gerente_esqueceu_senha, name='gerente-esqueceu-senha'),

    # 3. Rotas de viewsets (sempre por último)
    path('', include(router.urls)),
]
