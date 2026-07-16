from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView,
    CustomTokenObtainPairView,
    MeView,
    AdminProfileListCreateView,
    AdminProfileDetailView,
    AdminProfileSelectView,
    AuditLogListView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', MeView.as_view(), name='auth_me'),
    path('profiles/', AdminProfileListCreateView.as_view(), name='admin_profiles'),
    path('profiles/<int:pk>/', AdminProfileDetailView.as_view(), name='admin_profile_detail'),
    path('profiles/select/', AdminProfileSelectView.as_view(), name='admin_profile_select'),
    path('audit-logs/', AuditLogListView.as_view(), name='audit_logs'),
]
