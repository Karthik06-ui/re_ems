from rest_framework import views, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db import models
from events.models import Registration, Event
from events.serializers import EventSerializer

class ParticipantDashboardView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        now = timezone.now()

        # 1. Total Participated Metric (Confirmed or Checked In registrations)
        total_participated = Registration.objects.filter(
            user=user,
            status__in=[Registration.Status.CONFIRMED, Registration.Status.CHECKED_IN]
        ).count()

        # 2. Upcoming Events (Not registered, published events happening in the future)
        registered_event_ids = Registration.objects.filter(
            user=user
        ).exclude(status=Registration.Status.CANCELLED).values_list('event_id', flat=True)
        
        upcoming_events = Event.objects.filter(
            status=Event.EventStatus.PUBLISHED,
            start_time__gt=now
        ).exclude(id__in=registered_event_ids).order_by('start_time')

        # 3. Registered Events (User is actively registered and event is not finished)
        active_registrations = Registration.objects.filter(
            user=user,
            status__in=[Registration.Status.CONFIRMED, Registration.Status.CHECKED_IN],
            event__end_time__gt=now
        ).select_related('event').order_by('event__start_time')
        registered_events = [reg.event for reg in active_registrations]

        # 4. Completed Events (User registered and event is completed or status set to completed)
        completed_registrations = Registration.objects.filter(
            user=user,
            status__in=[Registration.Status.CONFIRMED, Registration.Status.CHECKED_IN]
        ).filter(
            models.Q(event__status=Event.EventStatus.COMPLETED) | models.Q(event__end_time__lte=now)
        ).select_related('event').order_by('-event__end_time')
        completed_events = [reg.event for reg in completed_registrations]

        return Response({
            "analytics": {
                "total_events_participated": total_participated
            },
            "events": {
                "upcoming": EventSerializer(upcoming_events, many=True, context={'request': request}).data,
                "registered": EventSerializer(registered_events, many=True, context={'request': request}).data,
                "completed": EventSerializer(completed_events, many=True, context={'request': request}).data,
            }
        })
