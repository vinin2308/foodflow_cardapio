from rest_framework import serializers
from django.db import transaction
from .models import Usuario, Mesa, Categoria, Prato, Pedido, PedidoItem, Pagamento

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = '__all__'

class PedidoItemWriteSerializer(serializers.ModelSerializer):
    prato = serializers.PrimaryKeyRelatedField(
        queryset=Prato.objects.filter(ativo=True)
    )

    class Meta:
        model = PedidoItem
        fields = ['prato', 'quantidade', 'observacao']


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

class PedidoItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PedidoItem
        fields = ['prato', 'quantidade', 'observacao']

class PedidoSerializer(serializers.ModelSerializer):
    itens = PedidoItemWriteSerializer(many=True, write_only=True)
    itens_detail = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Pedido
        fields = [
            'id',
            'mesa',
            'nome_cliente',
            'status',
            'tempo_estimado',
            'itens',
            'itens_detail',
        ]
        read_only_fields = ['id', 'itens_detail']

    def get_itens_detail(self, pedido):
        qs = PedidoItem.objects.filter(pedido=pedido)
        return [{
            'prato': item.prato.id,
            'quantidade': item.quantidade,
            'observacao': item.observacao,
            'preco_unitario': item.preco_unitario,
            'subtotal': item.quantidade * item.preco_unitario
        } for item in qs]

    def create(self, validated_data):
        itens_data = validated_data.pop('itens', [])
        request = self.context.get('request')   
        user = getattr(request, 'user', None)

        # Se não estiver autenticado, usa None
        validated_data.pop('criado_por', None)
        criado_por = user if user and user.is_authenticated else None

        with transaction.atomic():
            pedido = Pedido.objects.create(criado_por=criado_por, **validated_data)

            for item in itens_data:
                prato = item['prato']
                PedidoItem.objects.create(
                    pedido=pedido,
                    prato=prato,
                    usuario=criado_por,
                    quantidade=item['quantidade'],
                    observacao=item.get('observacao', ''),
                    preco_unitario=prato.preco
                )
        return pedido

    def update(self, instancia, validated_data):
        instancia.status = validated_data.get('status', instancia.status)
        instancia.save()
        return instancia


class PagamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pagamento
        fields = '__all__'

