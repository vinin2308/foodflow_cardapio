from rest_framework import serializers
from django.db import transaction
from .models import Usuario, Mesa, Categoria, Prato, Pedido, PedidoItem, Pagamento

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

# 🔹 Item do pedido para leitura (com nome do prato)
class PedidoItemSerializer(serializers.ModelSerializer):
    prato_nome = serializers.SerializerMethodField()

    class Meta:
        model = PedidoItem
        fields = ['prato_nome', 'quantidade', 'observacao']

    def get_prato_nome(self, obj):
        return obj.prato.nome if obj.prato else None

# 🔹 Item do pedido para escrita (com ID do prato)
class PedidoItemWriteSerializer(serializers.ModelSerializer):
    prato = serializers.PrimaryKeyRelatedField(queryset=Prato.objects.filter(ativo=True))

    class Meta:
        model = PedidoItem
        fields = ['prato', 'quantidade', 'observacao']

# 🔹 Pedido para leitura
class PedidoReadSerializer(serializers.ModelSerializer):
    itens = PedidoItemSerializer(many=True, read_only=True)
    class Meta:
        model = Pedido
        fields = '__all__'

# 🔹 Pedido para escrita
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
        return pedido

    def update(self, instance, validated_data):
        instance.status = validated_data.get('status', instance.status)
        instance.tempo_estimado = validated_data.get('tempo_estimado', instance.tempo_estimado)
        instance.save()
        return instance


class PagamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pagamento
        fields = '__all__'
