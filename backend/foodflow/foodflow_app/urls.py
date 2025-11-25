from rest_framework import routers
from django.urls import path, include
from .views import (
    UsuarioViewSet, MesaViewSet, CategoriaViewSet, PratoViewSet, PedidoViewSet, 
    PedidoItemViewSet, PagamentoViewSet, iniciar_comanda, pedido_por_codigo,
    # Views do gerente
    gerente_registro, gerente_login, gerente_logout, gerente_perfil, gerente_esqueceu_senha,
    CategoriaGerenteViewSet, PratoGerenteViewSet,
)

router = routers.DefaultRouter()
router.register(r'usuarios', UsuarioViewSet)
router.register(r'mesas', MesaViewSet)
router.register(r'categorias', CategoriaViewSet, basename='categoria')
router.register(r'pratos', PratoViewSet, basename='prato')
router.register(r'pedidos', PedidoViewSet, basename='pedido')
router.register(r'pedido-itens', PedidoItemViewSet)
router.register(r'pagamentos', PagamentoViewSet)

# Rotas do gerente
router.register(r'gerente/categorias', CategoriaGerenteViewSet, basename='gerente-categoria')
router.register(r'gerente/pratos', PratoGerenteViewSet, basename='gerente-prato')

urlpatterns = [
    # 1. ROTAS DE FUNÇÃO (FUNCTIONS/ACTIONS) - Devem vir primeiro
    path('iniciar-comanda/', iniciar_comanda, name='iniciar-comanda'),
    path('pedidos/por-codigo/<str:codigo>/', pedido_por_codigo, name='pedido-por-codigo'),
    path('cozinha/', PedidoViewSet.as_view({'post': 'cozinha', 'get': 'cozinha'}), name='pedido-cozinha'),
    
    # 2. ROTAS DO GERENTE (AUTENTICAÇÃO) - Também são funções, melhor mantê-las separadas
    path('gerente/registro/', gerente_registro, name='gerente-registro'),
    path('gerente/login/', gerente_login, name='gerente-login'),
    path('gerente/logout/', gerente_logout, name='gerente-logout'),
    path('gerente/perfil/', gerente_perfil, name='gerente-perfil'),
    path('gerente/esqueceu-senha/', gerente_esqueceu_senha, name='gerente-esqueceu-senha'),
    
    # 3. ROTAS DE RECURSOS (ROUTER/VIEWSETS) - Devem vir por último para não interceptar as de cima
    path('', include(router.urls)),
]