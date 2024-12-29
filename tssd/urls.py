# urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('', views.home_page, name='home'),
    path('api/upload/', views.upload_media, name='upload_media'),
    path('api/process-live/', views.process_live_frame, name='process_live_frame'),
]
