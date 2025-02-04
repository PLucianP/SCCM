from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'workspaces', views.WorkspaceViewSet)
router.register(r'clients', views.ClientViewSet)
router.register(r'orders', views.OrderViewSet)
router.register(r'items', views.ItemViewSet)
router.register(r'measurements', views.MeasurementViewSet)
router.register(r'deliveries', views.DeliveryViewSet)
router.register(r'documents', views.DocumentViewSet)
router.register(r'companies', views.CompanyViewSet)

app_name = 'service-carpet-washing'

urlpatterns = [
    path('api/', include(router.urls)),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('orders/', views.orders, name='orders'),
    path('orders/<uuid:order_id>/', views.order_detail, name='order_detail'),
    path('measure/', views.measure, name='measure'),
    path('qr/', views.create_qr, name='create_qr'),
    path('qr/test/', views.test_qr, name='test_qr'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('security/', views.SecurityView.as_view(), name='security'),
    path('profile/update/', views.ProfileView.as_view(), name='profile_update'),
    path('security/change-password/', views.SecurityView.as_view(), name='change_password'),
    path('documents/', views.documents, name='documents'),
    path('workspaces/', views.workspaces, name='workspaces'),
    path('company/', views.CompanyView.as_view(), name='company'),
    path('api/upload/', views.upload_file, name='upload-file'),
]
