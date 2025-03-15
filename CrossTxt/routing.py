from django.urls import re_path
from main.consumers import TextShareConsumer

websocket_urlpatterns = [
    re_path(r"ws/chat/$", TextShareConsumer.as_asgi()),
]
