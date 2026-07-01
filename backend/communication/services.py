import json
import importlib
from django.core.mail import send_mail
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.conf import settings
from .models import EmailCampaign
from events.models import Announcement, Registration

User = get_user_model()

class BaseEmailProvider:
    def send_outreach_email(self, subject: str, body: str, recipients: list) -> dict:
        raise NotImplementedError()

class DjangoSMTPProvider(BaseEmailProvider):
    def send_outreach_email(self, subject: str, body: str, recipients: list) -> dict:
        if recipients:
            sent_count = send_mail(
                subject=subject,
                message=body,
                from_email='noreply@communityplatform.com',
                recipient_list=recipients,
                fail_silently=False
            )
            return {"status": "success", "sent_count": sent_count, "provider": "DjangoSMTP"}
        return {"status": "skipped", "reason": "No recipients", "provider": "DjangoSMTP"}

def get_email_provider():
    provider_path = getattr(settings, 'EMAIL_PROVIDER_CLASS', 'communication.services.DjangoSMTPProvider')
    try:
        module_name, class_name = provider_path.rsplit('.', 1)
        module = importlib.import_module(module_name)
        return getattr(module, class_name)()
    except Exception:
        return DjangoSMTPProvider()

class EmailService:
    @staticmethod
    def send_campaign_emails(campaign, sender_user):
        if campaign.status == EmailCampaign.CampaignStatus.SENT:
            raise ValueError("This outreach has already been sent.")

        campaign.status = EmailCampaign.CampaignStatus.SENDING
        campaign.save()

        # Resolve audience list
        recipients = []
        if campaign.audience == 'all':
            users = User.objects.filter(is_active=True)
            recipients = [u.email for u in users if u.notification_preferences_dict.get('outreach', True)]
        elif campaign.audience == 'previous_participants':
            users = User.objects.filter(
                registrations__event__status='completed',
                registrations__status='confirmed'
            ).distinct()
            recipients = [u.email for u in users if u.notification_preferences_dict.get('outreach', True)]
        elif campaign.audience == 'registrants':
            if campaign.event:
                recipients = list(campaign.event.registrations.filter(
                    status__in=[Registration.Status.CONFIRMED, Registration.Status.CHECKED_IN]
                ).values_list('user__email', flat=True))
        elif campaign.audience == 'waitlist':
            if campaign.event:
                recipients = list(campaign.event.waitlists.values_list('user__email', flat=True))

        try:
            provider = get_email_provider()
            result = provider.send_outreach_email(
                subject=campaign.subject,
                body=campaign.body,
                recipients=recipients
            )
            campaign.status = EmailCampaign.CampaignStatus.SENT
            campaign.sent_by = sender_user
            campaign.sent_at = timezone.now()
            campaign.actual_recipient_count = len(recipients)
            campaign.delivery_result = json.dumps(result)
            campaign.save()

            # Log analytics
            from analytics.utils import log_event
            log_event("outreach_sent", campaign.id, sender_user, {
                "subject": campaign.subject,
                "recipient_count": len(recipients)
            })

        except Exception as e:
            campaign.status = EmailCampaign.CampaignStatus.FAILED
            campaign.failure_reason = str(e)
            campaign.actual_recipient_count = len(recipients)
            campaign.save()
            raise e

    @staticmethod
    def send_announcement_emails(announcement, sender_user):
        if announcement.status == Announcement.AnnouncementStatus.SENT:
            raise ValueError("This announcement has already been sent.")

        announcement.status = Announcement.AnnouncementStatus.SENDING
        announcement.save()

        # Resolve audience list
        recipients = []
        event = announcement.event
        if event:
            if announcement.recipients == 'Confirmed Attendees' or announcement.recipients == 'Confirmed':
                recipients = list(event.registrations.filter(
                    status__in=[Registration.Status.CONFIRMED, Registration.Status.CHECKED_IN]
                ).values_list('user__email', flat=True))
            elif announcement.recipients == 'Waitlist' or announcement.recipients == 'Waitlisted Users':
                recipients = list(event.waitlists.values_list('user__email', flat=True))
            else:
                # Default fallback
                recipients = list(event.registrations.filter(
                    status__in=[Registration.Status.CONFIRMED, Registration.Status.CHECKED_IN]
                ).values_list('user__email', flat=True))

        try:
            if recipients:
                send_mail(
                    subject=announcement.subject,
                    message=announcement.body,
                    from_email='noreply@communityplatform.com',
                    recipient_list=recipients,
                    fail_silently=False
                )
            announcement.status = Announcement.AnnouncementStatus.SENT
            announcement.sent_by = sender_user
            announcement.sent_at = timezone.now()
            announcement.save()

            # Log analytics
            from analytics.utils import log_event
            log_event("announcement_sent", announcement.id, sender_user, {"subject": announcement.subject, "event_id": event.id if event else None})

        except Exception as e:
            announcement.status = Announcement.AnnouncementStatus.FAILED
            announcement.save()
            raise e
