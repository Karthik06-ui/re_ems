from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db import transaction
from django.utils import timezone
from django.shortcuts import get_object_or_404

from .models import Event, Registration, Waitlist, Speaker
from .serializers import EventSerializer, RegistrationSerializer, WaitlistSerializer, SpeakerSerializer
from authentication.models import User

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.filter(deleted_at__isnull=True)
    serializer_class = EventSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        # Public users can only see published events
        user = self.request.user
        if not user or not user.is_authenticated or user.role == User.Role.MEMBER:
            queryset = queryset.filter(status=Event.EventStatus.PUBLISHED)
        return queryset

    def perform_destroy(self, instance):
        instance.deleted_at = timezone.now()
        instance.save()

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    @transaction.atomic
    def register(self, request, pk=None):
        event = self.get_object()
        user = request.user

        # Check if already registered
        existing_reg = Registration.objects.filter(event=event, user=user).first()
        if existing_reg and existing_reg.status != Registration.Status.CANCELLED:
            return Response(
                {"detail": "You are already registered for this event."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if already on waitlist
        if Waitlist.objects.filter(event=event, user=user).exists():
            return Response(
                {"detail": "You are already on the waitlist for this event."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Lock the event row to check capacity under high concurrency
        event_locked = Event.objects.select_for_update().get(pk=event.pk)
        confirmed_count = Registration.objects.filter(
            event=event_locked, 
            status__in=[Registration.Status.CONFIRMED, Registration.Status.CHECKED_IN]
        ).count()

        if confirmed_count < event_locked.capacity:
            # Seat available
            if existing_reg:
                existing_reg.status = Registration.Status.CONFIRMED
                existing_reg.registered_at = timezone.now()
                existing_reg.save()
                reg = existing_reg
            else:
                reg = Registration.objects.create(
                    event=event_locked,
                    user=user,
                    status=Registration.Status.CONFIRMED
                )
            serializer = RegistrationSerializer(reg)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            # Event is full, add to waitlist
            last_position = Waitlist.objects.filter(event=event_locked).count()
            waitlist_entry = Waitlist.objects.create(
                event=event_locked,
                user=user,
                position=last_position + 1
            )
            serializer = WaitlistSerializer(waitlist_entry)
            return Response(
                {
                    "detail": "Event capacity reached. You have been added to the waitlist.",
                    "waitlist": serializer.data
                },
                status=status.HTTP_202_ACCEPTED
            )

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    @transaction.atomic
    def cancel(self, request, pk=None):
        event = self.get_object()
        user = request.user

        # 1. Handle Registration Cancellation
        reg = Registration.objects.filter(event=event, user=user, status=Registration.Status.CONFIRMED).first()
        if reg:
            reg.status = Registration.Status.CANCELLED
            reg.save()
            
            # Lock database and check waitlist to promote the next person (FIFO)
            next_waitlist = Waitlist.objects.filter(event=event).order_by('position').first()
            if next_waitlist:
                promoted_user = next_waitlist.user
                # Create confirmed registration for promoted user
                promoted_reg, created = Registration.objects.update_or_create(
                    event=event,
                    user=promoted_user,
                    defaults={'status': Registration.Status.CONFIRMED}
                )
                
                # Delete waitlist entry
                next_waitlist.delete()
                
                # Shift positions of remaining waitlisted users
                remaining_waitlists = Waitlist.objects.filter(event=event).order_by('position')
                for idx, entry in enumerate(remaining_waitlists):
                    entry.position = idx + 1
                    entry.save()
                    
            return Response({"detail": "Registration successfully cancelled."}, status=status.HTTP_200_OK)

        # 2. Handle Waitlist Cancellation
        wait_entry = Waitlist.objects.filter(event=event, user=user).first()
        if wait_entry:
            wait_entry.delete()
            # Shift positions of remaining waitlisted users
            remaining_waitlists = Waitlist.objects.filter(event=event).order_by('position')
            for idx, entry in enumerate(remaining_waitlists):
                entry.position = idx + 1
                entry.save()
            return Response({"detail": "Waitlist entry successfully removed."}, status=status.HTTP_200_OK)

        return Response(
            {"detail": "No active registration or waitlist entry found."},
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    @transaction.atomic
    def checkin(self, request, pk=None):
        event = self.get_object()
        # Verify checking user is chapter organizer or admin
        is_organizer = request.user.role in [User.Role.PLATFORM_ADMIN, User.Role.CHAPTER_LEAD, User.Role.ORGANIZER]

        if not is_organizer:
            return Response(
                {"detail": "You do not have permission to check-in attendees for this event."},
                status=status.HTTP_403_FORBIDDEN
            )

        attendee_email = request.data.get('email')
        if not attendee_email:
            return Response({"detail": "Attendee email is required."}, status=status.HTTP_400_BAD_REQUEST)

        attendee = get_object_or_404(User, email=attendee_email.lower())
        reg = Registration.objects.filter(event=event, user=attendee, status=Registration.Status.CONFIRMED).first()
        if not reg:
            return Response(
                {"detail": "No active confirmed registration found for this user."},
                status=status.HTTP_404_NOT_FOUND
            )

        reg.status = Registration.Status.CHECKED_IN
        reg.checked_in_at = timezone.now()
        reg.save()
        
        serializer = RegistrationSerializer(reg)
        return Response(serializer.data, status=status.HTTP_200_OK)
