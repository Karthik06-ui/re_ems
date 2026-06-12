from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.utils import timezone

from .models import DiscussionThread, Comment
from .serializers import DiscussionThreadSerializer, CommentSerializer
class DiscussionThreadViewSet(viewsets.ModelViewSet):
    queryset = DiscussionThread.objects.filter(deleted_at__isnull=True)
    serializer_class = DiscussionThreadSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        return super().get_queryset()

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def perform_destroy(self, instance):
        instance.deleted_at = timezone.now()
        instance.save()

    @action(detail=True, methods=['get', 'post'], permission_classes=[IsAuthenticated])
    def comments(self, request, pk=None):
        thread = self.get_object()
        
        if request.method == 'POST':
            serializer = CommentSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save(author=request.user, thread=thread)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        # GET method
        # Filter top level comments (where parent is null)
        comments = thread.comments.filter(parent__isnull=True)
        serializer = CommentSerializer(comments, many=True)
        return Response(serializer.data)
