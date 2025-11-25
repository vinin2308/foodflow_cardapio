from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticatedOrReadOnly, AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.db import transaction
from django.shortcuts import get_object_or_404


from .models import (
    Usuario, Mesa, Categoria, Prato, Pedido, PedidoItem, Pagamento,
    PedidoStatus, PedidoUsuario, gerar_codigo_acesso_unico
)
from .serializers import (
    UsuarioSerializer, MesaSerializer, CategoriaSerializer, PratoSerializer,
    PedidoReadSerializer, PedidoWriteSerializer,
    PedidoItemSerializer, PedidoItemWriteSerializer,
    PagamentoSerializer,
    GerenteRegistroSerializer, GerenteLoginSerializer, GerentePerfilSerializer,
    CategoriaGerenteSerializer, PratoGerenteSerializer
)


# ----------------------------
# AUTENTICAÇÃO DO GERENTE
# ----------------------------

@api_view(['POST'])
@permission_classes([AllowAny])
def gerente_registro(request):
    """Registro de novo gerente"""
    serializer = GerenteRegistroSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': GerentePerfilSerializer(user).data
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def gerente_login(request):
    """Login do gerente"""
    serializer = GerenteLoginSerializer(data=request.data)
    if serializer.is_valid():
        username = serializer.validated_data['username']
        password = serializer.validated_data['password']
        user = authenticate(username=username, password=password)
        
        if user and user.role == 'gerente':
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user': GerentePerfilSerializer(user).data
            })
        return Response({'erro': 'Credenciais inválidas ou usuário não é gerente'}, 
                       status=status.HTTP_401_UNAUTHORIZED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def gerente_logout(request):
    """Logout do gerente"""
    try:
        request.user.auth_token.delete()
        return Response({'mensagem': 'Logout realizado com sucesso'})
    except:
        return Response({'erro': 'Erro ao fazer logout'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def gerente_perfil(request):
    """Ver e atualizar perfil do gerente"""
    if request.method == 'GET':
        serializer = GerentePerfilSerializer(request.user)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = GerentePerfilSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def gerente_esqueceu_senha(request):
    """Recuperação de senha (placeholder - implementar envio de email)"""
    email = request.data.get('email')
    if not email:
        return Response({'erro': 'Email é obrigatório'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = Usuario.objects.get(email=email, role='gerente')
        # TODO: Implementar envio de email com token de recuperação
        return Response({'mensagem': 'Instruções de recuperação enviadas para o email'})
    except Usuario.DoesNotExist:
        return Response({'erro': 'Usuário não encontrado'}, status=status.HTTP_404_NOT_FOUND)

# ----------------------------
# GERENCIAMENTO DE CATEGORIAS (GERENTE)
# ----------------------------

class CategoriaGerenteViewSet(viewsets.ModelViewSet):
    """CRUD completo de categorias para o gerente"""
    queryset = Categoria.objects.all().order_by('-criado_em')
    serializer_class = CategoriaGerenteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Gerente pode ver todas as categorias (ativas e inativas)
        return Categoria.objects.all().order_by('-criado_em')

# ----------------------------
# GERENCIAMENTO DE PRATOS (GERENTE)
# ----------------------------

class PratoGerenteViewSet(viewsets.ModelViewSet):
    """CRUD completo de pratos para o gerente"""
    queryset = Prato.objects.all().order_by('-criado_em')
    serializer_class = PratoGerenteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Gerente pode ver todos os pratos (ativos e inativos)
        return Prato.objects.all().order_by('-criado_em')

# 🔔 Função para emitir eventos via WebSocket (quando cria/atualiza pedidos)

@api_view(['GET'])
def pedido_por_codigo(request, codigo):
    pedidos = Pedido.objects.filter(codigo_acesso=codigo)
    if not pedidos.exists():
        return Response({'erro': 'Nenhuma comanda encontrada.'}, status=status.HTTP_404_NOT_FOUND)

    serializer = PedidoReadSerializer(pedidos, many=True)
    return Response(serializer.data)

# 🚪 Iniciar uma nova comanda para uma mesa
@api_view(['POST'])
def iniciar_comanda(request):
    nome_cliente = request.data.get('nome_cliente')
    mesa_id = request.data.get('mesa')
    if not mesa_id:
        return Response({'erro': 'Mesa é obrigatória.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        mesa = Mesa.objects.get(id=mesa_id)
    except Mesa.DoesNotExist:
        return Response({'erro': 'Mesa não encontrada.'}, status=status.HTTP_404_NOT_FOUND)

    # 🔒 Verificar se já existe uma comanda ativa para essa mesa
    comanda_existente = Pedido.objects.filter(
        mesa=mesa,
        status__in=[PedidoStatus.PENDENTE, PedidoStatus.EM_PREPARO]
    ).order_by('-criado_em').first()

    if comanda_existente:
        return Response({'codigo_acesso': comanda_existente.codigo_acesso})

    # ✅ Criar nova comanda
    usuario = request.user if request.user.is_authenticated else None
    pedido = Pedido.objects.create(
        mesa=mesa,
        criado_por=usuario,
        nome_cliente=nome_cliente,
        status=PedidoStatus.PENDENTE  # explicitamente definido
    )

    return Response({'codigo_acesso': pedido.codigo_acesso})


# 👤 Usuários
class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer


# 🍽️ Mesas
class MesaViewSet(viewsets.ModelViewSet):
    queryset = Mesa.objects.all()
    serializer_class = MesaSerializer


# 🗂️ Categorias de pratos (para clientes - somente ativas)
class CategoriaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Categoria.objects.filter(ativo=True)
    serializer_class = CategoriaSerializer
    permission_classes = [AllowAny]


# 🥗 Pratos do cardápio (para clientes - somente ativos)
class PratoViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Somente leitura — clientes só podem visualizar os pratos ativos.
    """
    queryset = Prato.objects.filter(ativo=True)
    serializer_class = PratoSerializer
    permission_classes = [AllowAny]
    
# 🧾 Itens do pedido
class PedidoItemViewSet(viewsets.ModelViewSet):
    queryset = PedidoItem.objects.all()
    serializer_class = PedidoItemSerializer
    permission_classes = [AllowAny]


# 💳 Pagamentos
class PagamentoViewSet(viewsets.ModelViewSet):
    queryset = Pagamento.objects.all()
    serializer_class = PagamentoSerializer

@method_decorator(csrf_exempt, name='dispatch')
class PedidoViewSet(viewsets.ModelViewSet):
    queryset = Pedido.objects.all()
    permission_classes = [AllowAny]

    def retrieve(self, request, *args, **kwargs):
        pedido = self.get_object()
        pedidos_relacionados = Pedido.objects.filter(codigo_acesso=pedido.codigo_acesso)
        serializer = PedidoReadSerializer(pedidos_relacionados, many=True)
        return Response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        super().partial_update(request, *args, **kwargs)
        pedido = self.get_object()
        read_serializer = PedidoReadSerializer(pedido)
        return Response(read_serializer.data)
    
    def update(self, request, *args, **kwargs):
        super().update(request, *args, **kwargs)
        pedido = self.get_object()
        read_serializer = PedidoReadSerializer(pedido)
        return Response(read_serializer.data)

    def get_serializer_class(self):
        # Mantém o WriteSerializer para entrada de dados
        if self.action in ['create', 'update', 'partial_update', 'adicionar_filha', 'cozinha']:
            return PedidoWriteSerializer
        return PedidoReadSerializer

    def get_serializer_context(self):
        return {**super().get_serializer_context(), "request": self.request}

    # ----------------- Ações customizadas -----------------

    @action(detail=False, methods=['get', 'post'])
    def cozinha(self, request):
        status_param = request.GET.get('status')
        pedidos = Pedido.objects.all() if not status_param else Pedido.objects.filter(status=status_param)

        if request.method == 'GET':
            # ✅ CORREÇÃO 1: Forçar uso do ReadSerializer para listar na cozinha
            # Isso garante que campos como 'prato_nome', 'mesa_numero' e 'criado_em' apareçam.
            serializer = PedidoReadSerializer(pedidos, many=True)
            return Response(serializer.data)

        # Lógica do POST (Criar Pedido)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        pedido = serializer.save()
        
        # ✅ CORREÇÃO 2: WebSocket removido para evitar erro 500
        # emitir_pedido_websocket(pedido) <--- REMOVIDO
        
        # Retorna os dados completos para o Frontend
        return Response(PedidoReadSerializer(pedido).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def finalizar(self, request, pk=None):
        pedido = self.get_object()
        pedido.status = PedidoStatus.PRONTO
        pedido.save()
        
        # ✅ CORREÇÃO 3: WebSocket removido
        # emitir_pedido_websocket(pedido) <--- REMOVIDO
        
        return Response(PedidoReadSerializer(pedido).data)

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

        return Response(PedidoReadSerializer(pedido).data)

    @action(detail=False, methods=['get'])
    def pedidos_por_codigo(self, request):
        codigo = request.query_params.get('codigo_acesso')
        if not codigo:
            return Response({'erro': 'Código de acesso é obrigatório.'}, status=status.HTTP_400_BAD_REQUEST)

        pedidos = Pedido.objects.filter(codigo_acesso=codigo)
        serializer = PedidoReadSerializer(pedidos, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def adicionar_filha(self, request, pk=None):
        comanda_pai = get_object_or_404(Pedido, pk=pk)

        data = request.data.copy()
        data['comanda_pai'] = comanda_pai.id
        data['mesa'] = comanda_pai.mesa.id if comanda_pai.mesa else None
        data['codigo_acesso'] = comanda_pai.codigo_acesso

        serializer = PedidoWriteSerializer(data=data, context={'request': request})

        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            pedido_filho = serializer.save()

        pedidos_relacionados = Pedido.objects.filter(codigo_acesso=comanda_pai.codigo_acesso)
        read_serializer = PedidoReadSerializer(pedidos_relacionados, many=True)

        return Response(read_serializer.data, status=status.HTTP_201_CREATED)

    def list(self, request, *args, **kwargs):
        codigo = request.query_params.get('codigo_acesso')
        if codigo:
            pedidos = Pedido.objects.filter(codigo_acesso=codigo)
        else:
            pedidos = Pedido.objects.all()

        serializer = PedidoReadSerializer(pedidos, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def listar_filhas(self, request, pk=None):
        comanda_pai = self.get_object()
        filhas_qs = comanda_pai.comandas_filhas.all() 
        serializer = PedidoReadSerializer(filhas_qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='por-codigo')
    def por_codigo(self, request):
        codigo = request.query_params.get('codigo_acesso')
        if not codigo:
            return Response({'erro': 'Código de acesso é obrigatório.'}, status=status.HTTP_400_BAD_REQUEST)

        principal = Pedido.objects.filter(codigo_acesso=codigo, comanda_pai__isnull=True).first()
        filhas_qs = Pedido.objects.filter(codigo_acesso=codigo, comanda_pai__isnull=False)

        principal_data = PedidoReadSerializer(principal).data if principal else None
        filhas_data = PedidoReadSerializer(filhas_qs, many=True).data

        return Response({
            "codigo_acesso": codigo,
            "total_comandas": (1 if principal else 0) + filhas_qs.count(),
            "principal": principal_data,
            "filhas": filhas_data
        })

    def destroy(self, _request, *_, **__):
        pedido = self.get_object()
        pedido.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)