from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticatedOrReadOnly, AllowAny
from rest_framework.response import Response
from rest_framework.decorators import action, api_view
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from .models import (
    Usuario, Mesa, Categoria, Prato, Pedido, PedidoItem, Pagamento,
    PedidoStatus, PedidoUsuario, gerar_codigo_acesso_unico
)
from .serializers import (
    UsuarioSerializer, MesaSerializer, CategoriaSerializer, PratoSerializer,
    PedidoReadSerializer, PedidoWriteSerializer,
    PedidoItemSerializer, PedidoItemWriteSerializer,
    PagamentoSerializer,
)


# 🔔 Função para emitir eventos via WebSocket (quando cria/atualiza pedidos)
def emitir_pedido_websocket(pedido):
    channel_layer = get_channel_layer()
    payload = {
        'type': 'pedido_novo',
        'pedido': {
            'id': pedido.id,
            'codigo_acesso': pedido.codigo_acesso,
            'nome_cliente': pedido.nome_cliente,
            'mesa': pedido.mesa.numero,
            'status': pedido.status,
            'itens': [
                {
                    'prato': item.prato.id,
                    'quantidade': item.quantidade,
                    'observacao': item.observacao,
                    'usuario': item.usuario.username if item.usuario else None
                } for item in pedido.itens.all()
            ]
        }
    }
    async_to_sync(channel_layer.group_send)(
        f'comanda_{pedido.codigo_acesso}',
        payload
    )


# 🚪 Iniciar uma nova comanda para uma mesa
@api_view(['POST'])
def iniciar_comanda(request):
    """
    Cria um pedido inicial para a mesa escolhida e retorna o código de acesso.
    """
    mesa_id = request.data.get('mesa')
    if not mesa_id:
        return Response({'erro': 'Mesa é obrigatória.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        mesa = Mesa.objects.get(id=mesa_id)
    except Mesa.DoesNotExist:
        return Response({'erro': 'Mesa não encontrada.'}, status=status.HTTP_404_NOT_FOUND)

    codigo = gerar_codigo_acesso_unico()
    pedido = Pedido.objects.create(codigo_acesso=codigo, mesa=mesa)
    return Response({'codigo_acesso': pedido.codigo_acesso})


# 👤 Usuários
class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer


# 🍽️ Mesas
class MesaViewSet(viewsets.ModelViewSet):
    queryset = Mesa.objects.all()
    serializer_class = MesaSerializer


# 🗂️ Categorias de pratos
class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


# 🥗 Pratos do cardápio
class PratoViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Somente leitura — clientes só podem visualizar os pratos ativos.
    """
    queryset = Prato.objects.filter(ativo=True)
    serializer_class = PratoSerializer
    permission_classes = [AllowAny]


# 📋 Pedidos
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

    # 🍳 Criar ou listar pedidos na cozinha
    @action(detail=False, methods=['get', 'post'])
    def cozinha(self, request):
        status_param = request.GET.get('status')
        pedidos = Pedido.objects.all() if not status_param else Pedido.objects.filter(status=status_param)

        if request.method == 'GET':
            serializer = self.get_serializer(pedidos, many=True)
            return Response(serializer.data)

        elif request.method == 'POST':
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            pedido = serializer.save()
            emitir_pedido_websocket(pedido)
            return Response(PedidoReadSerializer(pedido).data, status=status.HTTP_201_CREATED)

    # ✅ Finalizar pedido (marcar como PRONTO)
    @action(detail=True, methods=['post'])
    def finalizar(self, request, pk=None):
        pedido = self.get_object()
        pedido.status = PedidoStatus.PRONTO
        pedido.save()
        emitir_pedido_websocket(pedido)
        return Response(PedidoReadSerializer(pedido).data)

    # 🔑 Entrar em uma comanda pelo código
    @action(detail=False, methods=['post'])
    def entrar_comanda(self, request):
        codigo = request.data.get('codigo_acesso')
        if not codigo:
            return Response({'erro': 'Código de acesso é obrigatório.'}, status=status.HTTP_400_BAD_REQUEST)

        pedido = Pedido.objects.filter(codigo_acesso=codigo).first()
        if not pedido:
            return Response({'erro': 'Pedido não encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        usuario = request.user if request.user.is_authenticated else None
        if usuario:
            PedidoUsuario.objects.get_or_create(pedido=pedido, usuario=usuario)

        return Response(PedidoReadSerializer(pedido).data, status=status.HTTP_200_OK)

    # 📦 Listar todos os pedidos com o mesmo código (mesma comanda)
    @action(detail=False, methods=['get'])
    def pedidos_por_codigo(self, request):
        codigo = request.query_params.get('codigo_acesso')
        if not codigo:
            return Response({'erro': 'Código de acesso é obrigatório.'}, status=status.HTTP_400_BAD_REQUEST)

        pedidos = Pedido.objects.filter(codigo_acesso=codigo)
        return Response(PedidoReadSerializer(pedidos, many=True).data)

    # 🗑️ Deletar pedido
    def destroy(self, request, *args, **kwargs):
        pedido = self.get_object()
        pedido.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# 🧾 Itens do pedido
class PedidoItemViewSet(viewsets.ModelViewSet):
    queryset = PedidoItem.objects.all()
    serializer_class = PedidoItemSerializer
    permission_classes = [AllowAny]


# 💳 Pagamentos
class PagamentoViewSet(viewsets.ModelViewSet):
    queryset = Pagamento.objects.all()
    serializer_class = PagamentoSerializer
