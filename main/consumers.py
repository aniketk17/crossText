import json
import random
import logging
from channels.generic.websocket import AsyncWebsocketConsumer

logger = logging.getLogger(__name__)

active_users = {}

AVENGERS_NAMES = [
    "IronMan", "CaptainAmerica", "Thor", "Hulk", "BlackWidow", "Hawkeye",
    "SpiderMan", "DoctorStrange", "BlackPanther", "ScarletWitch", "AntMan",
    "Wasp", "Falcon", "WinterSoldier", "Vision", "StarLord", "Gamora", 
    "Drax", "Rocket", "Groot", "Loki", "NickFury"
]

class TextShareConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        """Assigns a unique username and adds the user to the active list."""
        self.username = random.choice([name for name in AVENGERS_NAMES if name not in active_users])
        self.channel_group_name = "text_share"

        logger.info(f"User {self.username} connected.")

        await self.channel_layer.group_add(self.channel_group_name, self.channel_name)
        await self.accept()

        active_users[self.username] = {
            "latitude": None, 
            "longitude": None, 
            "channel": self.channel_name
        }

        await self.send(json.dumps({"type": "assign_username", "username": self.username}))
        await self.broadcast_user_list()

    async def disconnect(self, close_code):
        """Removes the user from active list and updates others."""
        logger.info(f"User {self.username} disconnected.")

        if self.username in active_users:
            del active_users[self.username]

        await self.channel_layer.group_discard(self.channel_group_name, self.channel_name)
        await self.broadcast_user_list()

    async def receive(self, text_data):
        """Handles received WebSocket messages."""
        print(text_data)
        logger.info(f"Received data: {text_data}")

        try:
            data = json.loads(text_data)

            if data["action"] == "update_location":
                active_users[self.username]["latitude"] = data["latitude"]
                active_users[self.username]["longitude"] = data["longitude"]
                logger.info(f"Updated location: {self.username} -> {data['latitude']}, {data['longitude']}")
                await self.broadcast_user_list()

            elif data["action"] == "send_text":
                recipient = data["recipient"]
                if recipient in active_users:
                    logger.info(f"Sending message from {self.username} to {recipient}: {data['message']}")
                    await self.channel_layer.send(
                        active_users[recipient]["channel"],
                        {
                            "type": "text_message",
                            "sender": self.username,
                            "message": data["message"]
                        }
                    )

            elif data["action"] == "broadcast_text":
                message = data["message"]
                logger.info(f"Broadcasting message: {message}")
                for user in active_users.values():
                    await self.channel_layer.send(
                        user["channel"],
                        {
                            "type": "broadcast_message",
                            "sender": self.username,
                            "message": message
                        }
                    )
        except json.JSONDecodeError:
            logger.error("Error decoding JSON")

    async def text_message(self, event):
        """Sends text messages to the recipient."""
        logger.info(f"Message received: {event}")
        await self.send(json.dumps({
            "type": "received_text",
            "sender": event["sender"],
            "message": event["message"]
        }))

    async def broadcast_message(self, event):
        """Handles broadcasting messages to all connected users."""
        logger.info(f"Broadcasting message: {event}")
        await self.send(json.dumps({
            "type": "broadcast",
            "sender": event["sender"],
            "message": event["message"]
        }))

    async def broadcast_user_list(self):
        """Updates all users with the current active user list."""
        users = [
            {"username": u, "latitude": d["latitude"], "longitude": d["longitude"]}
            for u, d in active_users.items() if d["latitude"] is not None
        ]
        logger.info(f"Broadcasting user list: {users}")

        for user in active_users.values():
            await self.channel_layer.send(user["channel"], {
                "type": "user_list_update",
                "users": users
            })

    async def user_list_update(self, event):
        """Sends updated user list to all connected clients."""
        logger.info(f"User list update: {event['users']}")
        await self.send(json.dumps({
            "type": "user_list",
            "users": event["users"]
        }))
