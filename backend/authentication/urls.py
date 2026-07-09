from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import RegisterView, RegisterAdminView, CustomTokenObtainPairView, MeView, UsersRoleView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('register-admin/', RegisterAdminView.as_view(), name='auth_register_admin'),
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', MeView.as_view(), name='auth_me'),
    path('users/', UsersRoleView.as_view(), name='auth_users'),
]
