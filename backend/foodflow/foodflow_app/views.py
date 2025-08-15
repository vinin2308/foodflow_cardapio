from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticatedOrReadOnly, AllowAny
from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from .models import Usuario, Mesa, Categoria, Prato, Pedido, PedidoItem, Pagamento, PedidoStatus
from .serializers import (
    UsuarioSerializer,
    MesaSerializer,
    CategoriaSerializer,
    PratoSerializer,
    PedidoReadSerializer,
    PedidoWriteSerializer,
    PedidoItemSerializer,
    PedidoItemWriteSerializer,
    PagamentoSerializer,
)

class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer

class MesaViewSet(viewsets.ModelViewSet):
    queryset = Mesa.objects.all()
    serializer_class = MesaSerializer

class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

class PratoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Prato.objects.filter(ativo=True)
    serializer_class = PratoSerializer
    permission_classes = [AllowAny]

@method_decorator(csrf_exempt, name='dispatch')
class PedidoViewSet(viewsets.ModelViewSet):
    queryset = Pedido.objects.all()
    permission_classes = [AllowAny]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return PedidoWriteSerializer
        return PedidoReadSerializer

    def get_serializer_context(self):
        return {**super().get_serializer_context(), "request": self.request}

    def get_queryset(self):
        return Pedido.objects.all()

    @action(detail=False, methods=['get', 'post'])
    def cozinha(self, request):
        status_param = request.GET.get('status')

        if request.method == 'GET':
            if status_param:
                pedidos = Pedido.objects.filter(status=status_param)
            else:
                pedidos = Pedido.objects.all()

            serializer = self.get_serializer(pedidos, many=True)
            return Response(serializer.data)

        elif request.method == 'POST':
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            pedido = serializer.save()
            read_serializer = PedidoReadSerializer(pedido)
            return Response(read_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def finalizar(self, request, pk=None):
        pedido = self.get_object()
        pedido.status = PedidoStatus.PRONTO  # ou 'READY', dependendo do seu enum
        pedido.save()
        serializer = PedidoReadSerializer(pedido)
        return Response(serializer.data)
    
    def destroy(self, request, *args, **kwargs):
        pedido = self.get_object()
        pedido.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PedidoItemViewSet(viewsets.ModelViewSet):
    queryset = PedidoItem.objects.all()
    serializer_class = PedidoItemSerializer
    permission_classes = [AllowAny]

class PagamentoViewSet(viewsets.ModelViewSet):
    queryset = Pagamento.objects.all()
    serializer_class = PagamentoSerializer
