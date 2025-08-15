from django.db import models
from django.contrib.auth.models import AbstractUser, Group, Permission
from django.utils import timezone


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
    mesa = models.ForeignKey(Mesa, on_delete=models.PROTECT)
    nome_cliente = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=20, choices=PedidoStatus.choices, default=PedidoStatus.PENDENTE)
    tempo_estimado = models.IntegerField(null=True, blank=True)
    criado_por = models.ForeignKey(Usuario, on_delete=models.PROTECT, null=True, blank=True)
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)
    data = models.DateTimeField(default=timezone.now)



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
