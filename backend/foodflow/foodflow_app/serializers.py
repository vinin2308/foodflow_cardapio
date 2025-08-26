from rest_framework import serializers
from django.db import transaction
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Usuario, Mesa, Categoria, Prato, Pedido, PedidoItem, Pagamento, gerar_codigo_acesso_unico

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

class PedidoItemSerializer(serializers.ModelSerializer):
    prato_nome = serializers.SerializerMethodField()

    class Meta:
        model = PedidoItem
        fields = ['prato_nome', 'quantidade', 'observacao']

    def get_prato_nome(self, obj):
        return obj.prato.nome if obj.prato else None

class PedidoItemWriteSerializer(serializers.ModelSerializer):
    prato = serializers.PrimaryKeyRelatedField(queryset=Prato.objects.all())
    observacao = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = PedidoItem
        fields = ['prato', 'quantidade', 'observacao']

# ----------------------------
# PEDIDO
# ----------------------------

class PedidoReadSerializer(serializers.ModelSerializer):
    itens = PedidoItemSerializer(many=True, read_only=True)
    mesa_numero = serializers.SerializerMethodField()
    comanda_pai_id = serializers.SerializerMethodField()
    eh_principal = serializers.SerializerMethodField()

    class Meta:
        model = Pedido
        fields = [
            'id',
            'codigo_acesso',
            'itens',
            'mesa_numero',
            'comanda_pai_id',
            'eh_principal'
        ]
        read_only_fields = ['codigo_acesso']
    def get_mesa_numero(self, obj):
        return obj.mesa.numero if obj.mesa else None

    def get_comanda_pai_id(self, obj):
        return obj.comanda_pai.id if obj.comanda_pai else None

    def get_eh_principal(self, obj):
        return obj.comanda_pai is None


class PedidoWriteSerializer(serializers.ModelSerializer):
    codigo_acesso = serializers.CharField(required=False, allow_blank=True)
    itens = serializers.ListField(
        child=serializers.DictField(), required=False
    )
    comanda_pai = serializers.PrimaryKeyRelatedField(
        queryset=Pedido.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = Pedido
        fields = ['mesa', 'nome_cliente', 'status', 'tempo_estimado', 'itens', 'comanda_pai', 'codigo_acesso']

    def validate(self, data):
        codigo = data.get('codigo_acesso')
        comanda_pai = data.get('comanda_pai')

        if comanda_pai:
            if codigo and codigo != comanda_pai.codigo_acesso:
                raise serializers.ValidationError("Comanda filha deve usar o mesmo código da comanda pai.")
        else:
            pedido_id = self.instance.id if self.instance else None
            if codigo and Pedido.objects.filter(codigo_acesso=codigo).exclude(id=pedido_id).exists():
                raise serializers.ValidationError("Já existe uma comanda principal com esse código.")
        return data

    def create(self, validated_data):
        itens_data = validated_data.pop('itens', [])
        request_user = self.context.get('request').user if self.context.get('request') else None
        usuario = request_user if isinstance(request_user, Usuario) else None
        validated_data['criado_por'] = usuario

        # Gerar ou herdar código de acesso
        if not validated_data.get('codigo_acesso'):
            if validated_data.get('comanda_pai'):
                validated_data['codigo_acesso'] = validated_data['comanda_pai'].codigo_acesso
            else:
                validated_data['codigo_acesso'] = gerar_codigo_acesso_unico()

        with transaction.atomic():
            pedido = Pedido.objects.create(**validated_data)

            for item in itens_data:
                prato_obj = Prato.objects.get(id=item['prato'])
                PedidoItem.objects.create(
                    pedido=pedido,
                    prato=prato_obj,
                    usuario=usuario,
                    quantidade=item['quantidade'],
                    observacao=item.get('observacao', ''),
                    preco_unitario=prato_obj.preco
                )

            # Emitir via WebSocket
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
                            'prato': i.prato.id,
                            'quantidade': i.quantidade,
                            'observacao': i.observacao,
                            'usuario': i.usuario.username if i.usuario else None
                        } for i in pedido.itens.all()
                    ]
                }
            }
            async_to_sync(channel_layer.group_send)(f'comanda_{pedido.codigo_acesso}', payload)

        return pedido

    def update(self, instance, validated_data):
        itens_data = validated_data.pop('itens', None)
        request_user = self.context.get('request').user if self.context.get('request') else None
        usuario = request_user if isinstance(request_user, Usuario) else None

        instance.status = validated_data.get('status', instance.status)
        instance.tempo_estimado = validated_data.get('tempo_estimado', instance.tempo_estimado)
        instance.nome_cliente = validated_data.get('nome_cliente', instance.nome_cliente)
        instance.save()

        if itens_data is not None:
            # Remove itens antigos e recria
            instance.itens.all().delete()
            for item in itens_data:
                prato_obj = Prato.objects.get(id=item['prato'])
                PedidoItem.objects.create(
                    pedido=instance,
                    prato=prato_obj,
                    usuario=usuario,
                    quantidade=item['quantidade'],
                    observacao=item.get('observacao', ''),
                    preco_unitario=prato_obj.preco
                )

        return instance

# ----------------------------
# PAGAMENTO
# ----------------------------

class PagamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pagamento
        fields = '__all__'
