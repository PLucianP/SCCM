from django.contrib.auth import login, logout
from django.shortcuts import redirect, render
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.generic import TemplateView
from django.contrib.auth.views import LoginView
from django.urls import reverse_lazy
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.renderers import TemplateHTMLRenderer, JSONRenderer
from .models import User
from .serializers import UserSerializer, LoginSerializer, RegisterSerializer


class CustomLoginView(LoginView):
    template_name = 'authentication/login.html'
    redirect_authenticated_user = True

    def get_success_url(self):
        next_url = self.request.GET.get('next')
        if next_url:
            return next_url
        return '/carpet/dashboard/'

    def form_valid(self, form):
        """Security check complete. Log the user in."""
        login(self.request, form.get_user(),
              backend='authentication.backends.ABACBackend')
        return redirect(self.get_success_url())


class AuthViewSet(viewsets.GenericViewSet):
    permission_classes = [AllowAny]
    serializer_class = UserSerializer
    renderer_classes = [JSONRenderer, TemplateHTMLRenderer]
    template_name = 'authentication/login.html'

    @action(detail=False, methods=['post'])
    def login(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            login(request, user, backend='authentication.backends.ABACBackend')
            return Response(UserSerializer(user).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def register(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            if user:
                login(request, user, backend='authentication.backends.ABACBackend')
                return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def logout(self, request):
        logout(request)
        return Response(status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    @method_decorator(login_required)
    def me(self, request):
        return Response(UserSerializer(request.user).data)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return User.objects.all()
        if user.role in ['ADMIN', 'MANAGER']:
            return User.objects.filter(workspace=user.workspace)
        return User.objects.none()


class CustomRegisterView(TemplateView):
    template_name = 'authentication/register.html'

    def get(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            return redirect('service-carpet-washing:dashboard')
        return super().get(request, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        data = request.POST.copy()  # Make a mutable copy

        # Check for required fields
        required_fields = ['username', 'email', 'password1', 'password2']
        missing_fields = [field for field in required_fields if not data.get(field)]
        if missing_fields:
            context = {
                'form': {
                    'errors': {field: ['This field is required'] for field in missing_fields}
                }
            }
            return render(request, self.template_name, context)

        # Map password1 and password2 to password and confirm_password
        data['password'] = data.get('password1')
        data['confirm_password'] = data.get('password2')

        # Remove workspace from data if it's empty
        if 'workspace' in data and not data['workspace']:
            del data['workspace']

        # Set default values for optional fields
        data.setdefault('role', 'WORKER')
        data.setdefault('first_name', '')
        data.setdefault('last_name', '')
        data.setdefault('phone', '')

        serializer = RegisterSerializer(data=data)
        if serializer.is_valid():
            try:
                user = serializer.save()
                # Use the ABAC backend for authentication
                login(request, user, backend='authentication.backends.ABACBackend')
                return redirect('service-carpet-washing:dashboard')
            except Exception as e:
                context = {'form': {'errors': {'__all__': [str(e)]}}}
                return render(request, self.template_name, context)

        # If we get here, there were validation errors
        context = {'form': serializer}
        return render(request, self.template_name, context)
