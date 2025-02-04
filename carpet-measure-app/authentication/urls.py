from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AuthViewSet, UserViewSet, CustomLoginView, CustomRegisterView
from django.contrib.auth.views import LogoutView

router = DefaultRouter()
router.register('users', UserViewSet, basename='user')

app_name = 'authentication'

urlpatterns = [
    # Template views
    path('login/', CustomLoginView.as_view(), name='login'),
    path('register/', CustomRegisterView.as_view(), name='register'),
    path('logout/', LogoutView.as_view(), name='logout'),

    # API endpoints
    path('api/', include(router.urls)),
    path('api/auth/login/', AuthViewSet.as_view({'post': 'login'}), name='api_login'),
    path('api/auth/register/', AuthViewSet.as_view({'post': 'register'}), name='api_register'),
    path('api/auth/logout/', AuthViewSet.as_view({'post': 'logout'}), name='api_logout'),
    path('api/auth/me/', AuthViewSet.as_view({'get': 'me'}), name='api_me'),
]
