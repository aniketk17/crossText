from django.http import JsonResponse
from django.shortcuts import render

def api_home(request):
    return JsonResponse({"message": "Welcome to the CrossTxt API!"})

def index(request):
    return render(request, "main/index.html")

def how_to_use(request):
    return render(request, "main/use.html")
