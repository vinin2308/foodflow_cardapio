from rest_framework import serializers
from django.db import transaction
from .models import Usuario, Mesa, Categoria, Prato, Pedido, PedidoItem, Pagamento

# ----------------------------
# SERIALIZERS BÁSICOS
# ----------------------------

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = '__all__'

class MesaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mesa
        fields = '__all__'

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ['id', 'nome', 'icone']

class PratoSerializer(serializers.ModelSerializer):
    categoria = CategoriaSerializer()

    class Meta:
        model = Prato
        fields = ['id', 'nome', 'descricao', 'preco', 'categoria']

# ----------------------------
# PEDIDO ITEM
# ----------------------------

# leitura (com nome do prato)
class PedidoItemSerializer(serializers.ModelSerializer):
    prato_nome = serializers.SerializerMethodField()

    class Meta:
        model = PedidoItem
        fields = ['prato_nome', 'quantidade', 'observacao']

    def get_prato_nome(self, obj):
        return obj.prato.nome if obj.prato else None

# escrita (com ID do prato)
class PedidoItemWriteSerializer(serializers.ModelSerializer):
    prato = serializers.PrimaryKeyRelatedField(queryset=Prato.objects.all())
    observacao = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = PedidoItem
        fields = ['prato', 'quantidade', 'observacao']


# ----------------------------
# PEDIDO
# ----------------------------

# leitura
class PedidoReadSerializer(serializers.ModelSerializer):
    itens = PedidoItemSerializer(many=True, read_only=True)
    mesa_numero = serializers.SerializerMethodField()
    comanda_pai_id = serializers.SerializerMethodField()
    eh_principal = serializers.SerializerMethodField()

    class Meta:
        model = Pedido
        fields = [
            'id',
            'mesa',
            'mesa_numero',
            'nome_cliente',
            'status',
            'tempo_estimado',
            'codigo_acesso',
            'criado_em',
            'atualizado_em',
            'comanda_pai_id',
            'eh_principal',
            'itens',
        ]

    def get_mesa_numero(self, obj):
        return obj.mesa.numero if obj.mesa else None

    def get_comanda_pai_id(self, obj):
        return obj.comanda_pai.id if obj.comanda_pai else None

    def get_eh_principal(self, obj):
        return obj.comanda_pai is None

# escrita
class PedidoWriteSerializer(serializers.ModelSerializer):
    itens = PedidoItemWriteSerializer(many=True)

    class Meta:
        model = Pedido
        fields = ['mesa', 'nome_cliente', 'status', 'tempo_estimado', 'itens']

    def create(self, validated_data):
        itens_data = validated_data.pop('itens', [])
        request = self.context.get('request')
        user = request.user if request and request.user.is_authenticated else None

        validated_data['criado_por'] = user

        with transaction.atomic():
            pedido = Pedido.objects.create(**validated_data)

            for item in itens_data:
                prato = item['prato']
                PedidoItem.objects.create(
                    pedido=pedido,
                    prato=prato,
                    usuario=user,
                    quantidade=item['quantidade'],
                    observacao=item.get('observacao', ''),
                    preco_unitario=prato.preco
                )

            # 🔔 Emitir pedido via WebSocket
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

        return pedido

    def update(self, instance, validated_data):
        instance.status = validated_data.get('status', instance.status)
        instance.tempo_estimado = validated_data.get('tempo_estimado', instance.tempo_estimado)
        instance.save()
        return instance

# ----------------------------
# PAGAMENTO
# ----------------------------

class PagamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pagamento
        fields = '__all__'

class ComandaSerializer(serializers.ModelSerializer):
    comanda_pai_id = serializers.SerializerMethodField()
    eh_principal = serializers.SerializerMethodField()

    class Meta:
        model = Pedido
        fields = [
            'id',
            'mesa',
            'nome_cliente',
            'status',
            'codigo_acesso',
            'comanda_pai_id',
            'eh_principal',
        ]

    def get_comanda_pai_id(self, obj):
        return obj.comanda_pai.id if obj.comanda_pai else None

    def get_eh_principal(self, obj):
        return obj.comanda_pai is None


