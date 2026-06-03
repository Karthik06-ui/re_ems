from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count
from django.contrib.auth import get_user_model

from .models import AnalyticsEvent
from .serializers import AnalyticsEventSerializer
from chapters.models import Chapter
from events.models import Event, Registration
from discussions.models import DiscussionThread

User = get_user_model()

class AnalyticsViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def overview(self, request):
        chapter_slug = request.query_params.get('chapter')
        
        # Base queries
        users_query = User.objects.all()
        events_query = Event.objects.filter(deleted_at__isnull=True)
        registrations_query = Registration.objects.all()
        threads_query = DiscussionThread.objects.filter(deleted_at__isnull=True)

        if chapter_slug:
            chapter = Chapter.objects.filter(slug=chapter_slug).first()
            if not chapter:
                return Response({"detail": "Chapter not found."}, status=status.HTTP_404_NOT_FOUND)
            
            # Scoped counts
            users_count = User.objects.filter(chapter_roles__chapter=chapter).count()
            events_count = events_query.filter(chapter=chapter).count()
            registrations_count = registrations_query.filter(event__chapter=chapter).count()
            threads_count = threads_query.filter(chapter=chapter).count()
        else:
            # Global counts for platform admins
            users_count = users_query.count()
            events_count = events_query.count()
            registrations_count = registrations_query.count()
            threads_count = threads_query.count()

        return Response({
            "total_members": users_count,
            "total_events": events_count,
            "total_registrations": registrations_count,
            "total_discussions": threads_count,
            "engagement_metrics": {
                "active_users": users_count, # Mocked/calculated engagement
                "attendance_rate": 85.5 if registrations_count > 0 else 0.0
            }
        })

    @action(detail=False, methods=['post'])
    def track(self, request):
        serializer = AnalyticsEventSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
