from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import EmailCampaign
from .serializers import EmailCampaignSerializer
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from .services import EmailService

User = get_user_model()

class EmailCampaignViewSet(viewsets.ModelViewSet):
    queryset = EmailCampaign.objects.all()
    serializer_class = EmailCampaignSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def send(self, request, pk=None):
        campaign = self.get_object()
        try:
            EmailService.send_campaign_emails(campaign, request.user)
            serializer = self.get_serializer(campaign)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"detail": f"Failed to send campaign emails: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        campaign = self.get_object()
        if campaign.status in [EmailCampaign.CampaignStatus.DRAFT, EmailCampaign.CampaignStatus.SCHEDULED]:
            campaign.status = EmailCampaign.CampaignStatus.CANCELLED
            campaign.save()
            serializer = self.get_serializer(campaign)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response({"detail": "Only draft or scheduled outreach can be cancelled."}, status=status.HTTP_400_BAD_REQUEST)

