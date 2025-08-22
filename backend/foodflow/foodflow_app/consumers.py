from channels.generic.websocket import AsyncJsonWebsocketConsumer
from asgiref.sync import sync_to_async
import json



class ComandaConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.codigo_comanda = self.scope['url_route']['kwargs']['codigoComanda']
        self.group_name = f'comanda_{self.codigo_comanda}'

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()


    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    # Recebe mensagens do frontend
    async def receive_json(self, content):
        """
        O frontend envia um payload indicando qual ação foi realizada
        Exemplo de payload:
        {
            "action": "adicionar_item",
            "comanda": {...comanda atualizada...}
        }
        """
        # Envia para todos do grupo
        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "comanda_atualizada",
                "data": content["comanda"]
            }
        )

    # Envia a comanda atualizada para todos
    async def comanda_atualizada(self, event):
        await self.send_json(event["data"])