from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action
from django.utils import timezone

from .models import Sponsor, EventSponsor
from .serializers import SponsorSerializer, EventSponsorSerializer

class SponsorViewSet(viewsets.ModelViewSet):
    queryset = Sponsor.objects.filter(deleted_at__isnull=True)
    serializer_class = SponsorSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        sponsor = serializer.save()
        from analytics.utils import log_event
        log_event("sponsor_added", sponsor.id, self.request.user, {"name": sponsor.name, "tier": sponsor.tier})

    def perform_destroy(self, instance):
        instance.deleted_at = timezone.now()
        instance.save()

class EventSponsorViewSet(viewsets.ModelViewSet):
    queryset = EventSponsor.objects.all()
    serializer_class = EventSponsorSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        event_id = self.request.query_params.get('event')
        if event_id:
            queryset = queryset.filter(event_id=event_id)
        return queryset
