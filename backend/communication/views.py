from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import EmailCampaign
from .serializers import EmailCampaignSerializer
from django.contrib.auth import get_user_model
from django.core.mail import send_mail

User = get_user_model()

class EmailCampaignViewSet(viewsets.ModelViewSet):
    queryset = EmailCampaign.objects.all()
    serializer_class = EmailCampaignSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'])
    def send(self, request, pk=None):
        campaign = self.get_object()
        if campaign.status == EmailCampaign.CampaignStatus.SENT:
            return Response(
                {"detail": "This campaign has already been sent."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        campaign.status = EmailCampaign.CampaignStatus.SENDING
        campaign.save()

        # Resolve audience list
        recipients = []
        if campaign.audience == 'all':
            # Get all users (since chapters are removed)
            recipients = list(User.objects.filter(is_active=True).values_list('email', flat=True))

        # Simulate batch email transmission (in a real app, this would be a Celery task)
        # We also trigger standard django send_mail to facilitate local testing
        try:
            if recipients:
                send_mail(
                    subject=campaign.subject,
                    message=campaign.body,
                    from_email='noreply@communityplatform.com',
                    recipient_list=recipients,
                    fail_silently=True
                )
        except Exception:
            pass

        campaign.status = EmailCampaign.CampaignStatus.SENT
        campaign.sent_at = timezone.now()
        campaign.save()

        serializer = self.get_serializer(campaign)
        return Response(serializer.data, status=status.HTTP_200_OK)
