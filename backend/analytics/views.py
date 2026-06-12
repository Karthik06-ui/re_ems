from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count
from django.contrib.auth import get_user_model

from .models import AnalyticsEvent
from .serializers import AnalyticsEventSerializer
from events.models import Event, Registration
from discussions.models import DiscussionThread

User = get_user_model()

class AnalyticsViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def overview(self, request):
        users_count = User.objects.count()
        events_count = Event.objects.filter(deleted_at__isnull=True).count()
        registrations_count = Registration.objects.count()
        threads_count = DiscussionThread.objects.filter(deleted_at__isnull=True).count()

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
