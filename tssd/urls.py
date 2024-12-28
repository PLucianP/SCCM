# urls.py
from django.contrib import admin
from django.contrib.auth.views import LogoutView
from django.urls import path, include
from . import views

urlpatterns = [
    path('', views.home_page, name='home'),
    path('account_settings/', views.account_settings, name='account_settings'),
    path('signup/', views.signup_page, name='signup_page'),
    path('login/', views.login_page, name='login_page'),
    path('logout/', LogoutView.as_view(next_page='login_page'), name='logout'),
    path('api/signup/', views.SignUpView.as_view(), name='signup'),
    path('api/login/', views.LoginView.as_view(), name='login'),
    path('api/user/update/', views.UserUpdateView.as_view(), name='user-update'),
]
