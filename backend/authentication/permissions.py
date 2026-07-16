from rest_framework.permissions import BasePermission


class IsAdminUser(BasePermission):
    """
    Allows access only to admin users.
    Admin determination is based on email matching ADMIN_EMAIL setting.
    """
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_admin
        )


class RequiresActiveProfile(BasePermission):
    """
    Ensures that the admin user has selected an active admin profile
    before performing admin actions. Profile is extracted from JWT
    by AdminProfileMiddleware and attached to request.admin_profile.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if not request.user.is_admin:
            return False
        admin_profile = getattr(request, 'admin_profile', None)
        return admin_profile is not None and admin_profile.is_active
