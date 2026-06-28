from rest_framework import permissions

class IsProfileCompleted(permissions.BasePermission):
    message = "You must complete your profile details before performing this action."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            getattr(request.user, 'is_profile_completed', False)
        )
