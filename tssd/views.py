# views.py
from django.contrib.auth.decorators import login_required
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import authenticate, login
from django.shortcuts import render
from .serializers import SignUpSerializer, UserUpdateSerializer


def home_page(request):
    return render(request, 'home.html')


@login_required
def account_settings(request):
    return render(request, 'account_settings.html')


def signup_page(request):
    return render(request, 'auth/signup.html')


def login_page(request):
    return render(request, 'auth/login.html')


class SignUpView(generics.CreateAPIView):
    serializer_class = SignUpSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                "message": "User created successfully",
                "user": {
                    "id": user.id,
                    "email": user.email
                }
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        # Since we're using email as username, we pass email to the username field
        user = authenticate(username=email, password=password)
        if user is not None:
            login(request, user)
            return Response({
                "message": "Login successful",
                "user": {
                    "id": user.id,
                    "email": user.email
                }
            })
        else:
            return Response({
                "message": "Invalid email or password"
            }, status=status.HTTP_401_UNAUTHORIZED)


class UserUpdateView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserUpdateSerializer

    def get(self, request):
        serializer = self.serializer_class(request.user, context={'request': request})
        return Response(serializer.data)

    def patch(self, request):
        serializer = self.serializer_class(
            request.user,
            data=request.data,
            partial=True,
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
