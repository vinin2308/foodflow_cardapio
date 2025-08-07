from django.contrib import admin
from .models import (
    Usuario,
    Mesa,
    Categoria,
    Prato,
    Ingrediente,
    PratoIngrediente,
    Pedido,
    PedidoUsuario,
    PedidoItem,
    Pagamento,
    LogAlteracao,
)

admin.site.register(Usuario)
admin.site.register(Mesa)
admin.site.register(Categoria)
admin.site.register(Prato)
admin.site.register(Ingrediente)
admin.site.register(PratoIngrediente)
admin.site.register(Pedido)
admin.site.register(PedidoUsuario)
admin.site.register(PedidoItem)
admin.site.register(Pagamento)
admin.site.register(LogAlteracao)
