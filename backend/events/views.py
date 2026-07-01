from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db import transaction
from django.utils import timezone
from django.shortcuts import get_object_or_404

from rest_framework.views import APIView
from .models import Event, Registration, Waitlist, Speaker, Session, SurveyQuestion, Announcement, ChapterSetting
from .serializers import (
    EventSerializer, RegistrationSerializer, WaitlistSerializer, SpeakerSerializer,
    SessionSerializer, SurveyQuestionSerializer, AnnouncementSerializer, ChapterSettingSerializer
)
from authentication.models import User
from communication.models import EmailCampaign
from communication.services import EmailService

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
        if not user or not user.is_authenticated:
            queryset = queryset.filter(status=Event.EventStatus.PUBLISHED)
        return queryset

    def perform_destroy(self, instance):
        instance.deleted_at = timezone.now()
        instance.save()

    def perform_create(self, serializer):
        event = serializer.save()
        self.handle_event_draft_logic(event)

    def perform_update(self, serializer):
        old_instance = self.get_object()
        old_title = old_instance.title
        old_venue = old_instance.venue
        old_start = old_instance.start_time
        old_end = old_instance.end_time
        old_status = old_instance.status

        event = serializer.save()

        details_changed = (
            event.title != old_title or 
            event.venue != old_venue or 
            event.start_time != old_start or 
            event.end_time != old_end
        )
        status_changed = event.status != old_status

        self.handle_event_draft_logic(event, details_changed=details_changed, status_changed=status_changed)

    def handle_event_draft_logic(self, event, details_changed=False, status_changed=False):
        # 1. Global Campaign logic (on event publication/registration open status)
        if event.status in [Event.EventStatus.PUBLISHED, Event.EventStatus.REGISTRATION_OPEN]:
            campaign_subject = f"New Event: {event.title}"
            campaign_body = f"We are excited to invite you to our new event: {event.title}.\n\nVenue: {event.venue}\nStart Time: {event.start_time}\nDescription: {event.description}"
            
            campaign_draft = EmailCampaign.objects.filter(
                event=event,
                status=EmailCampaign.CampaignStatus.DRAFT
            ).first()

            if campaign_draft:
                campaign_draft.subject = campaign_subject
                campaign_draft.body = campaign_body
                campaign_draft.save()
            else:
                EmailCampaign.objects.create(
                    event=event,
                    subject=campaign_subject,
                    body=campaign_body,
                    audience='previous_participants',
                    status=EmailCampaign.CampaignStatus.DRAFT
                )

        # 2. Announcement logic (on detail updates: venue, time, title modifications)
        if details_changed:
            announcement_subject = f"Update for Event: {event.title}"
            announcement_body = f"Important updates for {event.title}.\n\nVenue: {event.venue}\nStart Time: {event.start_time}"

            announcement_draft = Announcement.objects.filter(
                event=event,
                status=Announcement.AnnouncementStatus.DRAFT
            ).first()

            if announcement_draft:
                announcement_draft.subject = announcement_subject
                announcement_draft.body = announcement_body
                announcement_draft.save()
            else:
                Announcement.objects.create(
                    event=event,
                    subject=announcement_subject,
                    body=announcement_body,
                    recipients='Confirmed Attendees',
                    status=Announcement.AnnouncementStatus.DRAFT
                )


    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    @transaction.atomic
    def register(self, request, pk=None):
        user = request.user
        if not getattr(user, 'is_profile_completed', False):
            return Response(
                {"detail": "You must complete your profile before registering for events."},
                status=status.HTTP_400_BAD_REQUEST
            )

        event = self.get_object()

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
                from analytics.utils import log_event
                log_event("waitlist_promotion", promoted_reg.id, None, {"email": promoted_user.email, "event_title": event.title})
                
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
        from analytics.utils import log_event
        log_event("checkin", reg.id, request.user, {"email": attendee.email, "event_title": event.title})
        
        serializer = RegistrationSerializer(reg)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def registrations(self, request, pk=None):
        event = self.get_object()
        regs = event.registrations.all().order_by('registered_at')
        serializer = RegistrationSerializer(regs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def waitlist(self, request, pk=None):
        event = self.get_object()
        wl = event.waitlists.all().order_by('position')
        serializer = WaitlistSerializer(wl, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    @transaction.atomic
    def reorder_sessions(self, request, pk=None):
        event = self.get_object()
        session_ids = request.data.get('session_ids', [])
        for order, session_id in enumerate(session_ids):
            Session.objects.filter(event=event, id=session_id).update(order=order)
        return Response({"detail": "Sessions reordered successfully."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    @transaction.atomic
    def promote(self, request, pk=None):
        event = self.get_object()
        email = request.data.get('email')
        if not email:
            return Response({"detail": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)
        user_to_promote = get_object_or_404(User, email=email.lower())
        wait_entry = Waitlist.objects.filter(event=event, user=user_to_promote).first()
        if not wait_entry:
            return Response({"detail": "User is not on waitlist."}, status=status.HTTP_404_NOT_FOUND)
        
        reg, created = Registration.objects.update_or_create(
            event=event,
            user=user_to_promote,
            defaults={'status': Registration.Status.CONFIRMED}
        )
        from analytics.utils import log_event
        log_event("waitlist_promotion", reg.id, request.user, {"email": user_to_promote.email, "event_title": event.title})
        wait_entry.delete()
        
        remaining = Waitlist.objects.filter(event=event).order_by('position')
        for idx, entry in enumerate(remaining):
            entry.position = idx + 1
            entry.save()
            
        return Response({"detail": f"Successfully promoted {email}."}, status=status.HTTP_200_OK)

class RegistrationViewSet(viewsets.ModelViewSet):
    queryset = Registration.objects.all().order_by('-registered_at')
    serializer_class = RegistrationSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['post'])
    def checkin(self, request):
        email = request.data.get('email')
        event_id = request.data.get('event_id')
        if not email or not event_id:
            return Response({"detail": "email and event_id are required."}, status=status.HTTP_400_BAD_REQUEST)
        
        reg = get_object_or_404(Registration, event_id=event_id, user__email=email.lower())
        reg.status = Registration.Status.CHECKED_IN
        reg.checked_in_at = timezone.now()
        reg.save()
        from analytics.utils import log_event
        log_event("checkin", reg.id, request.user, {"email": email, "event_title": reg.event.title})
        return Response(self.get_serializer(reg).data)

class SpeakerViewSet(viewsets.ModelViewSet):
    queryset = Speaker.objects.all()
    serializer_class = SpeakerSerializer
    permission_classes = [IsAuthenticated]

class SessionViewSet(viewsets.ModelViewSet):
    queryset = Session.objects.all()
    serializer_class = SessionSerializer
    permission_classes = [IsAuthenticated]

class SurveyQuestionViewSet(viewsets.ModelViewSet):
    queryset = SurveyQuestion.objects.all()
    serializer_class = SurveyQuestionSerializer
    permission_classes = [IsAuthenticated]

class AnnouncementViewSet(viewsets.ModelViewSet):
    queryset = Announcement.objects.all()
    serializer_class = AnnouncementSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'])
    def send(self, request, pk=None):
        announcement = self.get_object()
        try:
            EmailService.send_announcement_emails(announcement, request.user)
            serializer = self.get_serializer(announcement)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"detail": f"Failed to send announcement emails: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ChapterSettingDetailView(APIView):
    permission_classes = [AllowAny]

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request, slug):
        setting, created = ChapterSetting.objects.get_or_create(slug=slug)
        serializer = ChapterSettingSerializer(setting)
        return Response(serializer.data)

    def patch(self, request, slug):
        if request.user.role not in [User.Role.PLATFORM_ADMIN, User.Role.CHAPTER_LEAD, User.Role.ORGANIZER]:
            return Response(
                {"detail": "You do not have permission to modify chapter settings."},
                status=status.HTTP_403_FORBIDDEN
            )
        setting, created = ChapterSetting.objects.get_or_create(slug=slug)
        serializer = ChapterSettingSerializer(setting, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


