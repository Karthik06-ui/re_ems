from django.urls import path
from .views import ParticipantDashboardView

urlpatterns = [
    path('dashboard/', ParticipantDashboardView.as_view(), name='participant_dashboard'),
]
