"""
URL configuration for measure project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.shortcuts import redirect
from django.contrib.auth.decorators import login_required

def root_redirect(request):
    if request.user.is_authenticated:
        return redirect('service-carpet-washing:dashboard')
    return redirect('authentication:login')

urlpatterns = [
    path('', root_redirect, name='root'),
    path('admin/', admin.site.urls),
    path('carpet/', include('carpet.urls')),  # Now all carpet URLs will be prefixed with 'carpet/'
    path('auth/', include('authentication.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)  # Add this for serving media files
