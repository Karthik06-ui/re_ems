from rest_framework import permissions
from .models import UserChapterRole
from authentication.models import User

class IsChapterAdminOrReadOnly(permissions.BasePermission):
    """
    Allow Platform Admins or Chapter Leads to perform write operations,
    while allowing read-only access for others.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        if not request.user or not request.user.is_authenticated:
            return False
            
        if request.user.role == User.Role.PLATFORM_ADMIN:
            return True

        # Check if the user is a Chapter Lead for the chapter
        chapter = obj
        return UserChapterRole.objects.filter(
            user=request.user,
            chapter=chapter,
            role=UserChapterRole.Role.LEAD
        ).exists()

class IsChapterLeadOrOrganizer(permissions.BasePermission):
    """
    Allow Platform Admins, Chapter Leads, or Chapter Organizers.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
            
        if request.user.role == User.Role.PLATFORM_ADMIN:
            return True
            
        chapter = obj
        return UserChapterRole.objects.filter(
            user=request.user,
            chapter=chapter,
            role__in=[UserChapterRole.Role.LEAD, UserChapterRole.Role.ORGANIZER]
        ).exists()
