from rest_framework import viewsets, filters
from rest_framework.permissions import AllowAny
from django.utils import timezone
from django.db.models import Q
from .models import Event
from .public_serializers import PublicEventListSerializer, PublicEventDetailSerializer


class PublicEventViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Unauthenticated Public API for consuming published events on external platforms
    (e.g., GitHub Pages, static sites, public event directories).
    """
    permission_classes = [AllowAny]
    authentication_classes = []
    lookup_field = 'slug'
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'description', 'venue', 'category']

    def get_queryset(self):
        # Exclude deleted, draft, hidden, and cancelled events
        PUBLIC_STATUSES = [
            Event.EventStatus.PUBLISHED,
            Event.EventStatus.REGISTRATION_OPEN,
            Event.EventStatus.REGISTRATION_CLOSED,
            Event.EventStatus.COMPLETED,
            Event.EventStatus.REPORT_IN_PROGRESS,
            Event.EventStatus.REPORT_COMPLETED,
            Event.EventStatus.ARCHIVED,
        ]

        queryset = Event.objects.filter(
            deleted_at__isnull=True,
            status__in=PUBLIC_STATUSES
        ).prefetch_related('speakers', 'sessions', 'event_sponsors__sponsor', 'assets')

        now = timezone.now()

        # Query filter: time_frame (upcoming vs past)
        time_frame = self.request.query_params.get('time_frame')
        if time_frame == 'upcoming':
            queryset = queryset.filter(
                start_time__gte=now
            ).exclude(
                status__in=[
                    Event.EventStatus.COMPLETED,
                    Event.EventStatus.REPORT_IN_PROGRESS,
                    Event.EventStatus.REPORT_COMPLETED,
                    Event.EventStatus.ARCHIVED,
                ]
            )
        elif time_frame == 'past':
            queryset = queryset.filter(
                Q(end_time__lt=now) |
                Q(status__in=[
                    Event.EventStatus.COMPLETED,
                    Event.EventStatus.REPORT_IN_PROGRESS,
                    Event.EventStatus.REPORT_COMPLETED,
                    Event.EventStatus.ARCHIVED,
                ])
            )

        # Query filter: category (workshop, bootcamp, hackathon, etc.)
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category.lower())

        # Query filter: mode / type (virtual, physical, hybrid)
        mode = self.request.query_params.get('mode') or self.request.query_params.get('type')
        if mode:
            queryset = queryset.filter(type=mode.lower())

        return queryset.order_by('start_time')

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return PublicEventDetailSerializer
        return PublicEventListSerializer
