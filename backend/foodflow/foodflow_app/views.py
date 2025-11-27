from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes, authentication_classes
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.db import transaction
from django.shortcuts import get_object_or_404

from .models import (
    Usuario, Mesa, Categoria, Prato, Pedido, PedidoItem, Pagamento,
    PedidoStatus
)
from .serializers import (
    UsuarioSerializer, MesaSerializer, CategoriaSerializer, PratoSerializer,
    PedidoReadSerializer, PedidoWriteSerializer,
    PedidoItemSerializer,
    PagamentoSerializer,
    GerenteRegistroSerializer, GerenteLoginSerializer, GerentePerfilSerializer,
    CategoriaGerenteSerializer, PratoGerenteSerializer
)

# ============================================================================
# 1. AUTENTICAÇÃO E GERENTE
# ============================================================================

@csrf_exempt
@api_view(['POST'])
@authentication_classes([])  
@permission_classes([AllowAny])
def gerente_registro(request):
    serializer = GerenteRegistroSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': GerentePerfilSerializer(user).data
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@csrf_exempt
@api_view(['POST'])
@authentication_classes([])  # login público
@permission_classes([AllowAny])
def gerente_login(request):
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
    try:
        request.user.auth_token.delete()
        return Response({'mensagem': 'Logout realizado com sucesso'})
    except:
        return Response({'erro': 'Erro ao fazer logout'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def gerente_perfil(request):
    if request.method == 'GET':
        serializer = GerentePerfilSerializer(request.user)
        return Response(serializer.data)
    serializer = GerentePerfilSerializer(request.user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@csrf_exempt
@api_view(['POST'])
@authentication_classes([])  # recuperação de senha pública
@permission_classes([AllowAny])
def gerente_esqueceu_senha(request):
    email = request.data.get('email')
    if not email:
        return Response({'erro': 'Email é obrigatório'}, status=status.HTTP_400_BAD_REQUEST)
    return Response({'mensagem': 'Funcionalidade simulada: Email enviado.'})


# ============================================================================
# 2. CRUD DE PRODUTOS (GERENTE)
# ============================================================================

class CategoriaGerenteViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all().order_by('-criado_em')
    serializer_class = CategoriaGerenteSerializer
    permission_classes = [IsAuthenticated]


class PratoGerenteViewSet(viewsets.ModelViewSet):
    serializer_class = PratoGerenteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Filtra apenas os pratos do gerente logado
        user = self.request.user
        return Prato.objects.filter(criado_por=user).order_by('-criado_em')

    def perform_create(self, serializer):
        # Garante que o prato criado seja do gerente logado
        serializer.save(criado_por=self.request.user)



# ============================================================================
# 3. CORE DA APLICAÇÃO (GARÇOM / MESA)
# ============================================================================

class MesaViewSet(viewsets.ModelViewSet):
    queryset = Mesa.objects.all().order_by('numero')
    serializer_class = MesaSerializer
    permission_classes = [AllowAny]

    # --- AÇÃO: Adicionar Item (Garçom de Emergência) ---
    @action(detail=True, methods=['post'])
    def adicionar_item(self, request, pk=None):
        mesa = self.get_object()
        prato_id = request.data.get('prato_id')
        quantidade = int(request.data.get('quantidade', 1))
        observacao = request.data.get('observacao', '')

        if not prato_id:
            return Response({'error': 'ID do prato obrigatório'}, status=400)
        
        prato = get_object_or_404(Prato, pk=prato_id)
        usuario_atual = request.user if request.user.is_authenticated else Usuario.objects.filter(is_superuser=True).first()

        try:
            with transaction.atomic():
                pedido = Pedido.objects.filter(mesa=mesa).exclude(status__in=['pago', 'cancelado']).first()
                if not pedido:
                    pedido = Pedido.objects.create(
                        mesa=mesa,
                        criado_por=usuario_atual,
                        status=PedidoStatus.PENDENTE,
                        nome_cliente=f"Mesa {mesa.numero}"
                    )
                    mesa.status = 'ocupada'
                    mesa.save()

                PedidoItem.objects.create(
                    pedido=pedido,
                    prato=prato,
                    usuario=usuario_atual,
                    quantidade=quantidade,
                    preco_unitario=prato.preco,
                    observacao=observacao
                )
                return Response({'status': 'Item adicionado', 'pedido_id': pedido.id, 'item': f"{quantidade}x {prato.nome}"})

        except Exception as e:
            return Response({'error': str(e)}, status=500)

    @action(detail=True, methods=['post'])
    def liberar(self, request, pk=None):
        mesa = self.get_object()
        pedidos = Pedido.objects.filter(mesa=mesa).exclude(status__in=['pago', 'cancelado'])
        for pedido in pedidos:
            pedido.status = PedidoStatus.PAGO
            pedido.save()
        mesa.status = 'disponivel'
        mesa.solicitou_atencao = False
        mesa.save()
        return Response({'status': 'Mesa liberada'})
    
    @action(detail=True, methods=['post'])
    def chamar_garcom(self, request, pk=None):
        mesa = self.get_object()
        mesa.solicitou_atencao = True
        mesa.save()
        return Response({'status': 'Garçom solicitado'})

    @action(detail=True, methods=['post'])
    def atender_chamado(self, request, pk=None):
        mesa = self.get_object()
        mesa.solicitou_atencao = False
        mesa.save()
        return Response({'status': 'Chamado atendido'})


# ============================================================================
# 4. CORE DA APLICAÇÃO (CLIENTE / COZINHA / PEDIDOS)
# ============================================================================

@api_view(['GET'])
@permission_classes([AllowAny])
def pedido_por_codigo(request, codigo):
    pedidos = Pedido.objects.filter(codigo_acesso=codigo)
    if not pedidos.exists():
        return Response({'erro': 'Nenhuma comanda encontrada.'}, status=404)
    serializer = PedidoReadSerializer(pedidos, many=True)
    return Response(serializer.data)


# No seu arquivo views.py

@api_view(['POST'])
@permission_classes([AllowAny]) # Mantém permissão pública para clientes
def iniciar_comanda(request):
    nome_cliente = request.data.get('nome_cliente')
    mesa_numero = request.data.get('mesa') # O frontend envia o NÚMERO da mesa

    # 1. VALIDAÇÃO DE ENTRADA
    if not mesa_numero:
        return Response({'erro': 'O número da mesa é obrigatório.'}, status=status.HTTP_400_BAD_REQUEST)

    # 2. BUSCA SEGURA DA MESA (A CORREÇÃO PRINCIPAL ESTÁ AQUI)
    try:
        # Busca pelo campo 'numero' e garante que 'ativo' seja True
        mesa = Mesa.objects.get(numero=mesa_numero, ativo=True)
    except Mesa.DoesNotExist:
        # Se a mesa não foi criada pelo gerente ou está inativa, bloqueia aqui.
        return Response(
            {'erro': f'A Mesa {mesa_numero} não está cadastrada ou não está ativa.'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except ValueError:
        return Response({'erro': 'Formato de mesa inválido.'}, status=status.HTTP_400_BAD_REQUEST)

    # 3. VERIFICA SE JÁ EXISTE COMANDA ABERTA NA MESA
    comanda_existente = Pedido.objects.filter(
        mesa=mesa
    ).exclude(
        status__in=[PedidoStatus.PAGO, PedidoStatus.CANCELADO]
    ).first()

    if comanda_existente:
        # Se o cliente enviou um nome, atualiza a comanda existente
        if nome_cliente and not comanda_existente.nome_cliente:
            comanda_existente.nome_cliente = nome_cliente
            comanda_existente.save()
        return Response({'codigo_acesso': comanda_existente.codigo_acesso})

    # 4. CRIAÇÃO DA NOVA COMANDA
    usuario = request.user if request.user.is_authenticated else None
    
    pedido = Pedido.objects.create(
        mesa=mesa, 
        criado_por=usuario, 
        nome_cliente=nome_cliente, 
        status=PedidoStatus.PENDENTE
    )
    
    # Atualiza status da mesa
    mesa.status = 'ocupada'
    mesa.save()

    return Response({'codigo_acesso': pedido.codigo_acesso}, status=status.HTTP_201_CREATED)

class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer


class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.filter(ativo=True)
    serializer_class = CategoriaSerializer
    permission_classes = [AllowAny]


class PratoViewSet(viewsets.ModelViewSet):
    queryset = Prato.objects.filter(ativo=True)
    serializer_class = PratoSerializer
    permission_classes = [AllowAny]


class PedidoItemViewSet(viewsets.ModelViewSet):
    queryset = PedidoItem.objects.all()
    serializer_class = PedidoItemSerializer
    permission_classes = [AllowAny]


class PagamentoViewSet(viewsets.ModelViewSet):
    queryset = Pagamento.objects.all()
    serializer_class = PagamentoSerializer


@method_decorator(csrf_exempt, name='dispatch')
class PedidoViewSet(viewsets.ModelViewSet):
    queryset = Pedido.objects.all()
    permission_classes = [AllowAny]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update', 'adicionar_filha', 'cozinha']:
            return PedidoWriteSerializer
        return PedidoReadSerializer

    @action(detail=False, methods=['get', 'post'])
    def cozinha(self, request):
        if request.method == 'GET':
            status_param = request.GET.get('status')
            pedidos = self.get_queryset()
            if status_param:
                pedidos = pedidos.filter(status=status_param)
            serializer = PedidoReadSerializer(pedidos, many=True)
            return Response(serializer.data)
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        pedido = serializer.save()
        return Response(PedidoReadSerializer(pedido).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def finalizar(self, request, pk=None):
        pedido = self.get_object()
        pedido.status = PedidoStatus.PRONTO
        pedido.save()
        return Response(PedidoReadSerializer(pedido).data)

    @action(detail=True, methods=['post'])
    def entregar(self, request, pk=None):
        pedido = self.get_object()
        if pedido.status != PedidoStatus.PRONTO:
            return Response({'erro': 'Apenas pedidos prontos podem ser entregues.'}, status=400)
        pedido.status = PedidoStatus.ENTREGUE
        pedido.save()
        return Response(PedidoReadSerializer(pedido).data)

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
        return Response(PedidoReadSerializer(pedidos_relacionados, many=True).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'])
    def entrar_comanda(self, request):
        codigo = request.data.get('codigo_acesso')
        if not codigo: 
            return Response({'erro': 'Código obrigatório'}, status=400)
        pedido = Pedido.objects.filter(codigo_acesso=codigo).first()
        if not pedido: 
            return Response({'erro': 'Pedido não encontrado'}, status=404)
        return Response(PedidoReadSerializer(pedido).data)
