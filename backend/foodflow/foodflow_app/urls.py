from rest_framework import routers
from django.urls import path, include
from .views import (
    UsuarioViewSet,
    MesaViewSet,
    CategoriaViewSet,
    PratoViewSet,
    PedidoViewSet,
    PedidoItemViewSet,
    PagamentoViewSet,
)

router = routers.DefaultRouter()
router.register(r'usuarios', UsuarioViewSet)
router.register(r'mesas', MesaViewSet)
router.register(r'categorias', CategoriaViewSet, basename='categoria')
router.register(r'pratos', PratoViewSet, basename='prato')
router.register(r'pedidos', PedidoViewSet, basename='pedido')
router.register(r'pedido-itens', PedidoItemViewSet)
router.register(r'pagamentos', PagamentoViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
