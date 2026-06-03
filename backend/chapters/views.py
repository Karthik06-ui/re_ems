from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from .models import Chapter, UserChapterRole
from .serializers import ChapterSerializer, UserChapterRoleSerializer
from .permissions import IsChapterAdminOrReadOnly

class ChapterViewSet(viewsets.ModelViewSet):
    queryset = Chapter.objects.filter(deleted_at__isnull=True)
    serializer_class = ChapterSerializer
    lookup_field = 'slug'

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated(), IsChapterAdminOrReadOnly()]

    def perform_create(self, serializer):
        chapter = serializer.save()
        # Automatically make creator the Chapter Lead
        UserChapterRole.objects.create(
            user=self.request.user,
            chapter=chapter,
            role=UserChapterRole.Role.LEAD
        )

    def perform_destroy(self, instance):
        # Soft delete
        import django.utils.timezone as timezone
        instance.deleted_at = timezone.now()
        instance.save()

    @action(detail=True, methods=['get', 'post'], permission_classes=[IsAuthenticated])
    def roles(self, request, slug=None):
        chapter = self.get_object()
        
        # Check permissions: only Chapter Leads or Platform Admins can manage roles
        is_lead = UserChapterRole.objects.filter(
            user=request.user,
            chapter=chapter,
            role=UserChapterRole.Role.LEAD
        ).exists() or request.user.role == 'platform_admin'
        
        if request.method == 'POST':
            if not is_lead:
                return Response(
                    {"detail": "You do not have permission to manage roles for this chapter."},
                    status=status.HTTP_403_FORBIDDEN
                )
            serializer = UserChapterRoleSerializer(data=request.data, context={'chapter': chapter})
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        # GET method
        roles = chapter.user_roles.all()
        serializer = UserChapterRoleSerializer(roles, many=True)
        return Response(serializer.data)
