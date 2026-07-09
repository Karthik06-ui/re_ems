from django.conf import settings
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from .serializers import (
    RegisterSerializer, 
    UserSerializer, 
    CustomTokenObtainPairSerializer,
    UserRoleSerializer
)

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Auto-login upon registration by issuing JWT tokens
        refresh = RefreshToken.for_user(user)
        
        response_data = {
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }
        return Response(response_data, status=status.HTTP_201_CREATED)

class RegisterAdminView(generics.CreateAPIView):
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        admin_key = request.data.get('admin_key')
        if admin_key != settings.ADMIN_REGISTRATION_KEY:
            return Response(
                {"admin_key": ["Invalid or missing admin registration key."]},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = User.objects.create_user(
            email=serializer.validated_data['email'],
            name=serializer.validated_data['name'],
            password=serializer.validated_data['password'],
            role=User.Role.ADMIN,
            is_staff=True
        )
        
        # Auto-login upon registration by issuing JWT tokens
        refresh = RefreshToken.for_user(user)
        
        response_data = {
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }
        return Response(response_data, status=status.HTTP_201_CREATED)

class CustomTokenObtainPairView(TokenObtainPairView):
    permission_classes = (AllowAny,)
    serializer_class = CustomTokenObtainPairSerializer

class MeView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

class UsersRoleView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        users = User.objects.all().order_by('id')
        serializer = UserRoleSerializer(users, many=True)
        return Response(serializer.data)

    def post(self, request):
        if request.user.role != User.Role.ADMIN:
            return Response(
                {"detail": "You do not have permission to manage user roles."},
                status=status.HTTP_403_FORBIDDEN
            )
        email = request.data.get('user_email', '').lower()
        role = request.data.get('role')
        if not email or not role:
            return Response(
                {"detail": "user_email and role are required fields."},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"user_email": ["User with this email does not exist."]},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.role = role
        user.save()
        serializer = UserRoleSerializer(user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def delete(self, request):
        if request.user.role != User.Role.ADMIN:
            return Response(
                {"detail": "You do not have permission to manage user roles."},
                status=status.HTTP_403_FORBIDDEN
            )
        role_id = request.data.get('role_id')
        if not role_id:
            return Response(
                {"detail": "role_id is required to delete a role assignment."},
                status=status.HTTP_400_BAD_REQUEST
            )
        user = get_object_or_404(User, id=role_id)
        user.role = User.Role.PARTICIPANT
        user.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
