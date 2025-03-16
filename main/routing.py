from django.urls import re_path
from .consumers import TextShareConsumer

websocket_urlpatterns = [
    re_path(r'ws/share/$', TextShareConsumer.as_asgi()),
]
