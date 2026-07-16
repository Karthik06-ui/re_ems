from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.pagination import PageNumberPagination

from django.contrib.auth import get_user_model
from .models import AdminProfile, AuditLog
from .serializers import (
    RegisterSerializer,
    UserSerializer,
    CustomTokenObtainPairSerializer,
    AdminProfileSerializer,
    AuditLogSerializer,
)
from .permissions import IsAdminUser, RequiresActiveProfile
from .audit import log_admin_action

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """Unified registration for all users (participants and admin)."""
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


class CustomTokenObtainPairView(TokenObtainPairView):
    """Unified login endpoint. Returns is_admin flag based on email match."""
    permission_classes = (AllowAny,)
    serializer_class = CustomTokenObtainPairSerializer


class MeView(APIView):
    """Get or update the authenticated user's profile."""
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        data = UserSerializer(request.user).data
        # Include active admin profile if present
        admin_profile = getattr(request, 'admin_profile', None)
        if admin_profile:
            data['active_profile'] = AdminProfileSerializer(admin_profile).data
        return Response(data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


# ──────────────────────────────────────────────────────────────
# Admin Profile Management
# ──────────────────────────────────────────────────────────────

class AdminProfileListCreateView(APIView):
    """
    GET:  List all admin profiles (active and disabled).
    POST: Create a new admin profile. Admin only.
    """
    permission_classes = (IsAuthenticated, IsAdminUser)

    def get(self, request):
        profiles = AdminProfile.objects.all()
        serializer = AdminProfileSerializer(profiles, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = AdminProfileSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile = serializer.save()
        log_admin_action(
            request, 'create', 'AdminProfile',
            entity_id=profile.id, entity_label=profile.name
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AdminProfileDetailView(APIView):
    """
    GET:    Retrieve a single admin profile.
    PATCH:  Update a profile's name or is_active status.
    DELETE: Delete a profile (only if not referenced in audit logs).
    Admin only.
    """
    permission_classes = (IsAuthenticated, IsAdminUser)

    def get_object(self, pk):
        from django.shortcuts import get_object_or_404
        return get_object_or_404(AdminProfile, pk=pk)

    def get(self, request, pk):
        profile = self.get_object(pk)
        return Response(AdminProfileSerializer(profile).data)

    def patch(self, request, pk):
        profile = self.get_object(pk)
        old_name = profile.name
        old_active = profile.is_active
        serializer = AdminProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        changes = {}
        if profile.name != old_name:
            changes['name'] = {'before': old_name, 'after': profile.name}
        if profile.is_active != old_active:
            changes['is_active'] = {'before': old_active, 'after': profile.is_active}

        if changes:
            log_admin_action(
                request, 'update', 'AdminProfile',
                entity_id=profile.id, entity_label=profile.name,
                changes=changes
            )
        return Response(serializer.data)

    def delete(self, request, pk):
        profile = self.get_object(pk)
        # Prevent deletion if referenced in audit logs
        if AuditLog.objects.filter(admin_profile=profile).exists():
            return Response(
                {"detail": "Cannot delete this profile because it is referenced in audit logs. Disable it instead."},
                status=status.HTTP_400_BAD_REQUEST
            )
        profile_name = profile.name
        profile.delete()
        log_admin_action(
            request, 'delete', 'AdminProfile',
            entity_label=profile_name
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminProfileSelectView(APIView):
    """
    POST: Select an active admin profile for the current session.
    Re-issues JWT access token with admin_profile_id claim embedded.
    """
    permission_classes = (IsAuthenticated, IsAdminUser)

    def post(self, request):
        profile_id = request.data.get('profile_id')
        if not profile_id:
            return Response(
                {"detail": "profile_id is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            profile = AdminProfile.objects.get(id=profile_id)
        except AdminProfile.DoesNotExist:
            return Response(
                {"detail": "Admin profile not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        if not profile.is_active:
            return Response(
                {"detail": "This profile is disabled and cannot be selected."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Issue new JWT tokens with admin_profile_id claim
        refresh = RefreshToken.for_user(request.user)
        refresh['admin_profile_id'] = profile.id
        refresh.access_token['admin_profile_id'] = profile.id

        log_admin_action(
            request, 'profile_select', 'AdminProfile',
            entity_id=profile.id, entity_label=profile.name
        )

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'profile': AdminProfileSerializer(profile).data,
        })


# ──────────────────────────────────────────────────────────────
# Audit Log
# ──────────────────────────────────────────────────────────────

class AuditLogPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = 'page_size'
    max_page_size = 100


class AuditLogListView(APIView):
    """
    GET: Paginated list of audit logs with filtering support.
    Filters: profile_id, action_type, entity_type, search (entity_label).
    Admin only.
    """
    permission_classes = (IsAuthenticated, IsAdminUser)

    def get(self, request):
        queryset = AuditLog.objects.all()

        # Filtering
        profile_id = request.query_params.get('profile_id')
        if profile_id:
            queryset = queryset.filter(admin_profile_id=profile_id)

        action_type = request.query_params.get('action_type')
        if action_type:
            queryset = queryset.filter(action_type=action_type)

        entity_type = request.query_params.get('entity_type')
        if entity_type:
            queryset = queryset.filter(entity_type=entity_type)

        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(entity_label__icontains=search)

        paginator = AuditLogPagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = AuditLogSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)
