from django.urls import path
from .views import *

urlpatterns = [ 
    path('api/', api_home, name='api_home'),
    path('index/', index, name='index'),
    path('how-to-use/', how_to_use, name='how_to_use'),
]