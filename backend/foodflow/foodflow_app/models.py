from django.db import models
from django.contrib.auth.models import AbstractUser, Group, Permission
from django.utils import timezone
from django.utils.crypto import get_random_string
from django.core.exceptions import ValidationError

# ----------------------------
# ENUMS
# ----------------------------

class PedidoStatus(models.TextChoices):
    PENDENTE = 'pendente', 'Pendente'
    EM_PREPARO = 'em_preparo', 'Em preparo'
    PRONTO = 'pronto', 'Pronto'
    ENTREGUE = 'entregue', 'Entregue'
    PAGO = 'pago', 'Pago'
    CANCELADO = 'cancelado', 'Cancelado'

class PagamentoStatus(models.TextChoices):
    PENDENTE = 'pendente', 'Pendente'
    APROVADO = 'aprovado', 'Aprovado'
    RECUSADO = 'recusado', 'Recusado'
    CANCELADO = 'cancelado', 'Cancelado'

class MetodoPagamento(models.TextChoices):
    DINHEIRO = 'dinheiro', 'Dinheiro'
    PIX = 'pix', 'Pix'
    CARTAO = 'cartao', 'Cartão'

# ----------------------------
# Função para gerar código único
# ----------------------------

def gerar_codigo_acesso_unico():
    caracteres = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    while True:
        codigo = get_random_string(6, allowed_chars=caracteres)
        if not Pedido.objects.filter(codigo_acesso=codigo).exists():
            return codigo


# ----------------------------
# USUÁRIO
# ----------------------------

class Usuario(AbstractUser):
    ROLE_CHOICES = (
        ('cliente', 'Cliente'),
        ('gerente', 'Gerente'),
        ('garcom', 'Garçom'),
        ('cozinheiro', 'Cozinheiro'),
    )
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    groups = models.ManyToManyField(
        Group,
        related_name='foodflow_usuarios',
        blank=True,
        help_text='The groups this user belongs to.',
        related_query_name='usuario',
        verbose_name='groups',
    )
    user_permissions = models.ManyToManyField(
        Permission,
        related_name='foodflow_usuarios_permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        related_query_name='usuario',
        verbose_name='user permissions',
    )

# ----------------------------
# MESA
# ----------------------------

class Mesa(models.Model):
    numero = models.IntegerField(unique=True)
    capacidade = models.IntegerField()
    status = models.CharField(max_length=20, choices=[('disponivel', 'Disponível'), ('ocupada', 'Ocupada'), ('reservada', 'Reservada')])
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

# ----------------------------
# CATEGORIA / PRATO
# ----------------------------

class Categoria(models.Model):
    nome = models.CharField(max_length=100, unique=True)
    icone = models.CharField(max_length=10, blank=True)
    criado_por = models.ForeignKey(Usuario, on_delete=models.PROTECT)
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

class Prato(models.Model):
    nome = models.CharField(max_length=100)
    descricao = models.TextField(blank=True)
    preco = models.DecimalField(max_digits=10, decimal_places=2)
    imagem = models.TextField(blank=True)
    categoria = models.ForeignKey(Categoria, on_delete=models.PROTECT)
    criado_por = models.ForeignKey(Usuario, on_delete=models.PROTECT)
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

# ----------------------------
# INGREDIENTES / ESTOQUE
# ----------------------------

class Ingrediente(models.Model):
    nome = models.CharField(max_length=100)
    quantidade_estoque = models.DecimalField(max_digits=10, decimal_places=2)
    unidade_medida = models.CharField(max_length=20)
    estoque_minimo = models.DecimalField(max_digits=10, decimal_places=2)
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

class PratoIngrediente(models.Model):
    prato = models.ForeignKey(Prato, on_delete=models.CASCADE)
    ingrediente = models.ForeignKey(Ingrediente, on_delete=models.CASCADE)
    quantidade_utilizada = models.DecimalField(max_digits=10, decimal_places=2)

# ----------------------------
# PEDIDOS / ITENS
# ----------------------------

class Pedido(models.Model):
    id = models.BigAutoField(primary_key=True)

    # Código de acesso compartilhado entre comanda pai e filhas
    codigo_acesso = models.CharField(
        max_length=6,
        unique=True,
        editable=False
    )

    mesa = models.ForeignKey('Mesa', on_delete=models.PROTECT)
    nome_cliente = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=20, choices=[(s.value, s.label) for s in PedidoStatus], default=PedidoStatus.PENDENTE)
    tempo_estimado = models.IntegerField(null=True, blank=True)
    criado_por = models.ForeignKey('Usuario', on_delete=models.PROTECT, null=True, blank=True)
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)
    data = models.DateTimeField(default=timezone.now)

    # Comanda pai (somente um nível permitido)
    comanda_pai = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='comandas_filhas'
    )

    @property
    def is_principal(self):
        return self.comanda_pai is None

    def clean(self):
        # Impede que uma comanda filha seja pai de outra
        if self.comanda_pai and self.comanda_pai.comanda_pai:
            raise ValidationError("Uma comanda filha não pode ser pai de outra comanda.")

    def save(self, *args, **kwargs):
        # Validação de hierarquia
        self.full_clean()

        # Herança de código de acesso
        if self.comanda_pai:
            self.codigo_acesso = self.comanda_pai.codigo_acesso
        else:
            if not self.codigo_acesso:
                self.codigo_acesso = gerar_codigo_acesso_unico()

        super().save(*args, **kwargs)

    def __str__(self):
        return f"Pedido #{self.id} - Código: {self.codigo_acesso}"
    id = models.BigAutoField(primary_key=True)

    # Código de acesso compartilhado entre comanda pai e filhas
    codigo_acesso = models.CharField(
        max_length=6,
        unique=True,
        editable=False
    )

    mesa = models.ForeignKey('Mesa', on_delete=models.PROTECT)
    nome_cliente = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=20, choices=[
        ('pendente', 'Pendente'),
        ('em_preparo', 'Em preparo'),
        ('pronto', 'Pronto'),
        ('entregue', 'Entregue'),
        ('pago', 'Pago'),
        ('cancelado', 'Cancelado'),
    ], default='pendente')

    tempo_estimado = models.IntegerField(null=True, blank=True)
    criado_por = models.ForeignKey('Usuario', on_delete=models.PROTECT, null=True, blank=True)
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)
    data = models.DateTimeField(default=timezone.now)

    # Comanda pai (somente um nível permitido)
    comanda_pai = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='comandas_filhas'
    )
    
    @property
    def is_principal(self):
        return self.pedido_pai is None

    def clean(self):
        # Impede que uma comanda filha seja pai de outra
        if self.comanda_pai and self.comanda_pai.comanda_pai:
            raise ValidationError("Uma comanda filha não pode ser pai de outra comanda.")

    def save(self, *args, **kwargs):
        # Validação de hierarquia
        self.full_clean()

        # Herança de código de acesso
        if self.comanda_pai:
            self.codigo_acesso = self.comanda_pai.codigo_acesso
        else:
            if not self.codigo_acesso:
                self.codigo_acesso = gerar_codigo_acesso_unico()

        super().save(*args, **kwargs)

    def __str__(self):
        return f"Pedido #{self.id} - Código: {self.codigo_acesso}"

class PedidoUsuario(models.Model):
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE)
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('pedido', 'usuario')

class PedidoItem(models.Model):
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name='itens')    
    prato = models.ForeignKey(Prato, on_delete=models.PROTECT)
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, null=True, blank=True)
    quantidade = models.IntegerField()
    preco_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    observacao = models.TextField(blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)

# ----------------------------
# PAGAMENTOS
# ----------------------------

class Pagamento(models.Model):
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE)
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    metodo_pagamento = models.CharField(max_length=20, choices=MetodoPagamento.choices)
    status = models.CharField(max_length=20, choices=PagamentoStatus.choices, default=PagamentoStatus.PENDENTE)
    pago_em = models.DateTimeField(default=timezone.now)

# ----------------------------
# AUDITORIA
# ----------------------------

class LogAlteracao(models.Model):
    tabela_nome = models.CharField(max_length=100)
    registro_id = models.IntegerField()
    usuario = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True)
    acao = models.CharField(max_length=10)  # insert/update/delete
    dados_anteriores = models.JSONField(null=True, blank=True)
    dados_novos = models.JSONField(null=True, blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)
