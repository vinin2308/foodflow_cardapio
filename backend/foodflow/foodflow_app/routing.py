from django.urls import re_path
from .consumers import ComandaConsumer

websocket_urlpatterns = [
    re_path(r'ws/comanda/(?P<codigoComanda>\w+)/$', ComandaConsumer.as_asgi()),
]
