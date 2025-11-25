from channels.generic.websocket import AsyncJsonWebsocketConsumer
from asgiref.sync import sync_to_async
from .models import Pedido, PedidoItem, Prato, Usuario

class ComandaConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.codigo_comanda = self.scope['url_route']['kwargs']['codigoComanda']
        self.group_name = f'comanda_{self.codigo_comanda}'

        # Adiciona o socket ao grupo
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        print(f"Cliente conectado ao grupo {self.group_name}")

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
        print(f"Cliente desconectado do grupo {self.group_name}, código {close_code}")

    async def receive_json(self, content):
        """
        Recebe payload do frontend:
        {
            "action": "adicionar_item" | "remover_item" | "atualizar_quantidade",
            "item": {
                "prato": 1,
                "quantidade": 2,
                "observacao": "sem cebola"
            }
        }
        """
        action = content.get("action")
        item = content.get("item")

        if not action or not item:
            await self.send_json({
                "tipo": "erro",
                "mensagem": "Payload inválido. 'action' e 'item' são obrigatórios."
            })
            return

        # Processa a ação no backend
        updated_comanda = await self.process_action(action, item)

        if updated_comanda:
            # Envia para todos do grupo
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "comanda_atualizada",
                    "data": {
                        "tipo": "atualizacao_comanda",
                        "dados": updated_comanda
                    }
                }
            )

    async def comanda_atualizada(self, event):
        await self.send_json(event["data"])

    # ----------------------------
    # Lógica para atualizar backend
    # ----------------------------
    @sync_to_async
    def process_action(self, action, item):
        try:
            # Busca a comanda pelo código
            pedido = Pedido.objects.get(codigo_acesso=self.codigo_comanda)

            # Verifica se o item já existe
            prato_id = item.get("prato")
            quantidade = item.get("quantidade", 1)
            observacao = item.get("observacao", "")

            existente = PedidoItem.objects.filter(
                pedido=pedido,
                prato_id=prato_id,
                observacao=observacao
            ).first()

            if action == "adicionar_item":
                if existente:
                    existente.quantidade += quantidade
                    existente.save()
                else:
                    prato_obj = Prato.objects.get(id=prato_id)
                    PedidoItem.objects.create(
                        pedido=pedido,
                        prato=prato_obj,
                        quantidade=quantidade,
                        observacao=observacao
                    )

            elif action == "remover_item" and existente:
                existente.delete()

            elif action == "atualizar_quantidade" and existente:
                existente.quantidade = quantidade
                existente.save()

            # Retorna a comanda atualizada serializada
            return {
                "id": pedido.id,
                "codigo_acesso": pedido.codigo_acesso,
                "mesa_numero": pedido.mesa.numero if pedido.mesa else None,
                "itens": [
                    {
                        "prato": i.prato.id,
                        "quantidade": i.quantidade,
                        "observacao": i.observacao
                    } for i in pedido.itens.all()
                ]
            }
        except Pedido.DoesNotExist:
            return {"tipo": "erro", "mensagem": "Comanda não encontrada"}
        except Prato.DoesNotExist:
            return {"tipo": "erro", "mensagem": "Prato não encontrado"}
        except Exception as e:
            return {"tipo": "erro", "mensagem": str(e)}
