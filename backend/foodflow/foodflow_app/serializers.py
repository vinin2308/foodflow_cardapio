from rest_framework import serializers
from django.db import transaction
from django.contrib.auth.password_validation import validate_password
from .models import Usuario, Mesa, Categoria, Prato, Pedido, PedidoItem, Pagamento, gerar_codigo_acesso_unico

# ----------------------------
# SERIALIZERS BÁSICOS
# ----------------------------

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = '__all__'

# ----------------------------
# AUTENTICAÇÃO DO GERENTE
# ----------------------------

class GerenteRegistroSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = Usuario
        fields = ['username', 'email', 'password', 'password2', 'first_name', 'last_name']

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "As senhas não coincidem."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = Usuario.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role='gerente'
        )
        return user

class GerenteLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

class GerentePerfilSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'criado_em']
        read_only_fields = ['id', 'role', 'criado_em']

# ----------------------------
# PEDIDO ITEM (Definido antes para usar no MesaSerializer)
# ----------------------------

class PedidoItemSerializer(serializers.ModelSerializer):
    prato_nome = serializers.CharField(source="prato.nome", read_only=True)
    prato = serializers.PrimaryKeyRelatedField(read_only=True)
    preco_unitario = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    usuario_nome = serializers.CharField(source='usuario.username', read_only=True)

    class Meta:
        model = PedidoItem
        fields = ['id', 'prato', 'prato_nome', 'quantidade', 'preco_unitario', 'observacao', 'usuario_nome']

# ----------------------------
# PEDIDO (Leitura)
# ----------------------------

class PedidoReadSerializer(serializers.ModelSerializer):
    itens = serializers.SerializerMethodField()
    mesa_numero = serializers.SerializerMethodField()
    comanda_pai_id = serializers.SerializerMethodField()
    eh_principal = serializers.SerializerMethodField()
    criado_por_nome = serializers.CharField(source='criado_por.username', read_only=True)

    class Meta:
        model = Pedido
        fields = [
            'id',
            'codigo_acesso',
            'itens',
            'mesa_numero',
            'comanda_pai_id',
            'eh_principal',
            'status',  
            'nome_cliente', 
            'criado_por_nome',
            'criado_em'     
        ]
        read_only_fields = ['codigo_acesso']

    def get_itens(self, obj):
        itens_queryset = obj.itens.all()
        return PedidoItemSerializer(itens_queryset, many=True).data

    def get_mesa_numero(self, obj):
        return obj.mesa.numero if obj.mesa else None

    def get_comanda_pai_id(self, obj):
        return obj.comanda_pai.id if obj.comanda_pai else None

    def get_eh_principal(self, obj):
        return obj.comanda_pai is None

# ----------------------------
# MESA (Atualizado para o Garçom)
# ----------------------------

class MesaSerializer(serializers.ModelSerializer):
    pedidos = serializers.SerializerMethodField()
    valor_total_mesa = serializers.SerializerMethodField()

    class Meta:
        model = Mesa
        # ADICIONADO: 'solicitou_atencao'
        fields = ['id', 'numero', 'status', 'capacidade', 'valor_total_mesa', 'pedidos', 'solicitou_atencao']

    def get_pedidos(self, obj):
        # Retorna lista de pedidos ativos desta mesa (exclui pagos/cancelados)
        pedidos = Pedido.objects.filter(mesa=obj).exclude(status__in=['pago', 'cancelado'])
        return PedidoReadSerializer(pedidos, many=True).data

    def get_valor_total_mesa(self, obj):
        # Soma todos os itens de todos os pedidos ativos da mesa
        pedidos = Pedido.objects.filter(mesa=obj).exclude(status__in=['pago', 'cancelado'])
        total = 0
        for pedido in pedidos:
            itens = pedido.itens.all()
            total += sum(item.quantidade * item.preco_unitario for item in itens)
        return total

# ----------------------------
# CATEGORIAS E PRATOS
# ----------------------------

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ['id', 'nome', 'icone', 'ativo']

class CategoriaGerenteSerializer(serializers.ModelSerializer):
    criado_por = serializers.ReadOnlyField(source='criado_por.username')
    
    class Meta:
        model = Categoria
        fields = ['id', 'nome', 'icone', 'ativo', 'criado_por', 'criado_em', 'atualizado_em']
        read_only_fields = ['criado_por', 'criado_em', 'atualizado_em']

    def create(self, validated_data):
        validated_data['criado_por'] = self.context['request'].user
        return super().create(validated_data)

class PratoGerenteSerializer(serializers.ModelSerializer):
    categoria_nome = serializers.CharField(source='categoria.nome', read_only=True)
    criado_por = serializers.ReadOnlyField(source='criado_por.username')
    
    class Meta:
        model = Prato
        fields = ['id', 'nome', 'descricao', 'preco', 'imagem', 'categoria', 'categoria_nome', 'ativo', 'criado_por', 'criado_em', 'atualizado_em']
        read_only_fields = ['criado_por', 'criado_em', 'atualizado_em']

    def create(self, validated_data):
        validated_data['criado_por'] = self.context['request'].user
        return super().create(validated_data)

class PratoSerializer(serializers.ModelSerializer):
    categoria = CategoriaSerializer()

    class Meta:
        model = Prato
        fields = ['id', 'nome', 'descricao', 'preco', 'categoria', 'imagem']


# ----------------------------
# PEDIDO (Escrita/Criação)
# ----------------------------

class PedidoItemWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = PedidoItem
        fields = ['prato', 'quantidade', 'observacao']

class PedidoWriteSerializer(serializers.ModelSerializer):
    codigo_acesso = serializers.CharField(required=False, allow_blank=True)
    itens = PedidoItemWriteSerializer(many=True, required=False)
    comanda_pai = serializers.PrimaryKeyRelatedField(
        queryset=Pedido.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = Pedido
        fields = ['mesa', 'nome_cliente', 'status', 'itens', 'comanda_pai', 'codigo_acesso']
        extra_kwargs = {
            'mesa': {'required': False}
        }

    def validate(self, data):
        codigo = data.get('codigo_acesso')
        comanda_pai = data.get('comanda_pai')

        if comanda_pai:
            if codigo and codigo != comanda_pai.codigo_acesso:
                raise serializers.ValidationError("Comanda filha deve usar o mesmo código da comanda pai.")
        else:
            pedido_id = getattr(self.instance, "id", None)
            if codigo:
                if Pedido.objects.filter(codigo_acesso=codigo, comanda_pai__isnull=True).exclude(id=pedido_id).exists():
                    raise serializers.ValidationError("Já existe uma comanda principal com esse código.")

        itens = data.get('itens', [])
        for item in itens:
            if 'prato' not in item or 'quantidade' not in item:
                raise serializers.ValidationError("Cada item deve ter 'prato' e 'quantidade'.")
            if not isinstance(item['quantidade'], int) or item['quantidade'] <= 0:
                raise serializers.ValidationError("Quantidade deve ser um número inteiro maior que zero.")

        return data

    def create(self, validated_data):
        itens_data = validated_data.pop('itens', [])
        request_user = self.context.get('request').user if self.context.get('request') else None
        usuario = request_user if request_user and request_user.is_authenticated else None
        validated_data['criado_por'] = usuario

        if not validated_data.get('codigo_acesso'):
            if validated_data.get('comanda_pai'):
                validated_data['codigo_acesso'] = validated_data['comanda_pai'].codigo_acesso
            else:
                validated_data['codigo_acesso'] = gerar_codigo_acesso_unico()

        with transaction.atomic():
            pedido = Pedido.objects.create(**validated_data)

            for item in itens_data:
                PedidoItem.objects.create(
                    pedido=pedido,
                    prato=item['prato'],
                    usuario=usuario,
                    quantidade=item['quantidade'],
                    observacao=item.get('observacao', ''),
                    preco_unitario=item['prato'].preco
                )

        return pedido

    def update(self, instance, validated_data):
        itens_data = validated_data.pop('itens', None)
        usuario = self.context.get('request').user if self.context.get('request') else None
        usuario = usuario if usuario and usuario.is_authenticated else None

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if itens_data is not None:
            instance.itens.all().delete()
            for item in itens_data:
                PedidoItem.objects.create(
                    pedido=instance,
                    prato=item['prato'],
                    usuario=usuario,
                    quantidade=item['quantidade'],
                    observacao=item.get('observacao', ''),
                    preco_unitario=item['prato'].preco
                )

        return instance

# ----------------------------
# PAGAMENTO
# ----------------------------

class PagamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pagamento
        fields = '__all__'