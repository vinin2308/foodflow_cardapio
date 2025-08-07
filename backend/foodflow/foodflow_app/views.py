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
    PedidoSerializer,
    PedidoItemSerializer,
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
    permission_classes = [AllowAny]  # <-- Permite acesso público 
@method_decorator(csrf_exempt, name='dispatch')
class PedidoViewSet(viewsets.ModelViewSet):
    queryset = Pedido.objects.all()
    serializer_class = PedidoSerializer
    
    def get_permissions(self):
        if self.action == 'cozinha':
            return [AllowAny()]
        return super().get_permissions() 

    def get_serializer_context(self):
        return { **super().get_serializer_context(), "request": self.request }

    @action(detail=False, methods=['get', 'post'])
    def cozinha(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        pedido = serializer.save()  # ou algum valor fixo
        return Response(serializer.data, status=201)

        # POST: cria um pedido “pela cozinha”
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        pedido = serializer.save(criado_por=request.user)
        return Response(
            self.get_serializer(pedido).data,
            status=status.HTTP_201_CREATED
        )

def create(self, validated_data):
    itens_data = validated_data.pop('itens', [])
    request = self.context.get('request')
    user = request.user if request else None

    validated_data['criado_por'] = user

    pedido = Pedido.objects.create(**validated_data)

    for item_data in itens_data:
        prato = item_data.get('prato')
        quantidade = item_data.get('quantidade')
        observacao = item_data.get('observacao', '')

        # Buscar o preço do prato para usar no pedido item
        preco_unitario = prato.preco if prato else 0

        PedidoItem.objects.create(
            pedido=pedido,
            prato=prato,
            quantidade=quantidade,
            observacao=observacao,
            usuario=user,
            preco_unitario=preco_unitario,
        )

    return pedido

class PedidoItemViewSet(viewsets.ModelViewSet):
    queryset = PedidoItem.objects.all()
    serializer_class = PedidoItemSerializer
    permission_classes = [AllowAny] 

class PagamentoViewSet(viewsets.ModelViewSet):
    queryset = Pagamento.objects.all()
    serializer_class = PagamentoSerializer
