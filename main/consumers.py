import json, random
from channels.generic.websocket import AsyncWebsocketConsumer

class TextShareConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        """When a user connects, assign a random username and add them to the group"""

        self.username = f"User_{random.randint(1000, 9999)}"
        self.room_group_name = "active_users"

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        await self.send(text_data=json.dumps({
            "type": "assign_username",
            "username": self.username
        }))

        await self.broadcast_user_list()

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        await self.broadcast_user_list()

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get("action")

        if action == "send_message":
            receiver = data.get("receiver")
            message = data.get("message")

            if receiver and message:
                await self.channel_layer.send(
                    receiver,
                    {
                        "type": "private_message",
                        "message": message,
                        "sender": self.username
                    }
                )
        
        elif action == "send_private_message":
            message = data.get("message")
            if message:
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "broadcast_message",
                        "message": message,
                        "sender": self.username,
                    }
                )
    
    async def private_message(self, event):
        await self.send(text_data=json.dumps({
            "type": "private_message",
            "message": event["message"],
            "sender": event["sender"],
        }))

    async def broadcast_message(self, event):
        await self.send(text_data=json.dumps({
            "type": "broadcast_message",
            "message": event["message"],
            "sender": event["sender"],
        }))

    async def broadcast_user_list(self):
        users = []
        for channel in self.channel_layer.groups[self.room_group_name]:
            users.append(channel["username"])
        
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "user_list",
                "users": users,
            }
        )

    async def user_list(self, event):
        await self.send(text_data=json.dumps({
            "type": "user_list",
            "users": event["users"]
        }))